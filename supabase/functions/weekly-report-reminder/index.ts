import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendMsg91Sms } from '../_shared/msg91.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: Calculate Monday of current ISO week in YYYY-MM-DD format
function getCurrentWeekMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const weekOf = getCurrentWeekMonday();
    const reminderTemplateId = 'tmpl_weekly_reminder_01';

    // 1. Get all active teachers
    const { data: teachers, error: teachersError } = await supabase
      .from('profiles')
      .select('id, name, phone, email')
      .eq('role', 'teacher');

    if (teachersError || !teachers || teachers.length === 0) {
      return new Response(JSON.stringify({ message: 'No active teachers found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 2. Query weekly_reports for current week Monday
    const { data: reports } = await supabase
      .from('weekly_reports')
      .select('user_id, status')
      .eq('report_date', weekOf)
      .eq('status', 'submitted');

    const submittedUserIds = new Set((reports || []).map((r) => r.user_id));

    // Filter teachers who haven't submitted
    const unsubmittedTeachers = teachers.filter((t) => !submittedUserIds.has(t.id));

    if (unsubmittedTeachers.length === 0) {
      return new Response(JSON.stringify({ message: 'All teachers have submitted their report for this week!' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // 3. Idempotency Check: Filter out teachers already sent a reminder for this week
    const { data: existingLogs } = await supabase
      .from('notification_log')
      .select('recipient_phone')
      .eq('template_id', reminderTemplateId)
      .eq('week_of', weekOf)
      .eq('status', 'sent');

    const remindedPhones = new Set((existingLogs || []).map((l) => l.recipient_phone));

    const teachersToRemind = unsubmittedTeachers.filter(
      (t) => t.phone && !remindedPhones.has(t.phone)
    );

    if (teachersToRemind.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'All unsubmitted teachers have already received a reminder for this week.',
          unsubmittedCount: unsubmittedTeachers.length,
          remindedCount: remindedPhones.size,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // 4. Send SMS via MSG91
    const smsRecipients = teachersToRemind.map((t) => ({
      phone: t.phone,
      variables: {
        var1: t.name,
      },
    }));

    const sendResults = await sendMsg91Sms({
      templateId: reminderTemplateId,
      recipients: smsRecipients,
    });

    // 5. Insert audit logs with week_of set
    const logsToInsert = sendResults.map((res, idx) => ({
      channel: 'sms',
      template_id: reminderTemplateId,
      recipient_phone: res.phone,
      variables: { var1: teachersToRemind[idx]?.name, teacher_id: teachersToRemind[idx]?.id },
      status: res.status,
      provider_message_id: res.messageId || null,
      error_message: res.error || null,
      week_of: weekOf,
    }));

    await supabase.from('notification_log').insert(logsToInsert);

    return new Response(
      JSON.stringify({
        success: true,
        weekOf,
        reminded: sendResults.length,
        results: sendResults,
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
