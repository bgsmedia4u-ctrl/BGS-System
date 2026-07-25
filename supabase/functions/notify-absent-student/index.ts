import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendMsg91Sms } from '../_shared/msg91.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Authenticate caller (for non-cron invocations)
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (!profile || profile.role !== 'admin') {
          return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    }

    let targetDate = new Date().toISOString().split('T')[0];

    try {
      const body = await req.json();
      if (body && body.date) {
        targetDate = body.date;
      }
    } catch {
      // Body may be empty on cron invocation
    }

    const templateId = 'tmpl_absence_alert_01';

    // 2. Fetch attendance_sessions for targetDate
    const { data: sessions } = await supabase
      .from('attendance_sessions')
      .select('id')
      .eq('date', targetDate);

    if (!sessions || sessions.length === 0) {
      return new Response(JSON.stringify({ message: `No attendance sessions recorded for ${targetDate}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const sessionIds = sessions.map((s) => s.id);

    // 3. Query absent attendance_records
    const { data: absentRecords, error: recError } = await supabase
      .from('attendance_records')
      .select('student_id')
      .in('session_id', sessionIds)
      .eq('is_absent', true);

    if (recError || !absentRecords || absentRecords.length === 0) {
      return new Response(JSON.stringify({ message: `No absent students recorded for ${targetDate}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const studentIds = Array.from(new Set(absentRecords.map((r) => r.student_id)));

    // 4. Fetch student details
    const { data: students } = await supabase
      .from('students')
      .select('id, name, parent_phone')
      .in('id', studentIds);

    if (!students || students.length === 0) {
      return new Response(JSON.stringify({ message: 'No matching student records found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 5. Idempotency Guard: Check notification_log for sent logs today for this template & student
    const nextDay = new Date(new Date(targetDate).getTime() + 86400000).toISOString().split('T')[0];
    const { data: existingLogs } = await supabase
      .from('notification_log')
      .select('variables')
      .eq('template_id', templateId)
      .eq('status', 'sent')
      .gte('created_at', `${targetDate}T00:00:00Z`)
      .lt('created_at', `${nextDay}T00:00:00Z`);

    const alreadyNotifiedStudentIds = new Set(
      (existingLogs || [])
        .map((l) => l.variables && l.variables.student_id)
        .filter(Boolean)
    );

    const candidates = students.filter((s) => !alreadyNotifiedStudentIds.has(s.id));

    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({
          message: `All absent students for ${targetDate} have already been notified.`,
          totalAbsent: studentIds.length,
          alreadyNotified: alreadyNotifiedStudentIds.size,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // 6. Partition candidates into valid parent phone vs missing parent phone
    const validRecipients = candidates.filter((s) => s.parent_phone);
    const missingPhoneStudents = candidates.filter((s) => !s.parent_phone);

    const logsToInsert: any[] = [];

    // Log missing phone numbers as failed entries
    for (const student of missingPhoneStudents) {
      logsToInsert.push({
        channel: 'sms',
        template_id: templateId,
        recipient_phone: 'N/A',
        variables: { student_id: student.id, student_name: student.name },
        status: 'failed',
        error_message: 'No parent phone number registered for student',
      });
    }

    // 7. Send SMS to valid recipients
    if (validRecipients.length > 0) {
      const smsRecipients = validRecipients.map((s) => ({
        phone: s.parent_phone!,
        variables: {
          var1: s.name,
        },
      }));

      const sendResults = await sendMsg91Sms({
        templateId,
        recipients: smsRecipients,
      });

      sendResults.forEach((res, idx) => {
        const student = validRecipients[idx];
        logsToInsert.push({
          channel: 'sms',
          template_id: templateId,
          recipient_phone: res.phone,
          variables: { student_id: student?.id, student_name: student?.name },
          status: res.status,
          provider_message_id: res.messageId || null,
          error_message: res.error || null,
        });
      });
    }

    // 8. Insert all log records
    if (logsToInsert.length > 0) {
      await supabase.from('notification_log').insert(logsToInsert);
    }

    return new Response(
      JSON.stringify({
        success: true,
        date: targetDate,
        totalAbsent: studentIds.length,
        smsSent: validRecipients.length,
        missingPhone: missingPhoneStudents.length,
        results: logsToInsert,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
