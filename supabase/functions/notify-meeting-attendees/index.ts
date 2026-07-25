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

    // Authenticate caller token and verify admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized user token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin role required to trigger meeting notifications' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { meetingId, isUpdate } = await req.json();

    if (!meetingId) {
      return new Response(JSON.stringify({ error: 'Missing meetingId parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const templateId = 'tmpl_meeting_notice_01';

    // 1. Fetch meeting details
    const { data: meeting, error: meetErr } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetErr || !meeting) {
      return new Response(JSON.stringify({ error: 'Meeting not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Determine target teachers
    let targetTeachers: { id: string; name: string; phone?: string }[] = [];

    if (meeting.audience_type === 'all_staff') {
      const { data: teachers } = await supabase
        .from('profiles')
        .select('id, name, phone')
        .eq('role', 'teacher');
      targetTeachers = teachers || [];
    } else if (meeting.audience_type === 'department') {
      const { data: teachers } = await supabase
        .from('profiles')
        .select('id, name, phone')
        .eq('role', 'teacher')
        .eq('department', meeting.department);
      targetTeachers = teachers || [];
    } else if (meeting.audience_type === 'individual') {
      const { data: attendees } = await supabase
        .from('meeting_attendees')
        .select('teacher_id, profiles!teacher_id(id, name, phone)')
        .eq('meeting_id', meetingId);

      targetTeachers = (attendees || [])
        .map((a: any) => a.profiles)
        .filter(Boolean);
    }

    const validRecipients = targetTeachers.filter((t) => t.phone);

    if (validRecipients.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No attendees with registered phone numbers found for this meeting' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Send SMS via MSG91
    const titlePrefix = isUpdate ? `[UPDATED] ${meeting.title}` : meeting.title;
    const smsRecipients = validRecipients.map((t) => ({
      phone: t.phone!,
      variables: {
        var1: t.name,
        var2: titlePrefix,
        var3: meeting.meeting_date,
        var4: meeting.start_time,
      },
    }));

    const sendResults = await sendMsg91Sms({
      templateId,
      recipients: smsRecipients,
    });

    // 4. Insert logs into notification_log
    const logsToInsert = sendResults.map((res, idx) => ({
      channel: 'sms',
      template_id: templateId,
      recipient_phone: res.phone,
      variables: { meeting_id: meetingId, meeting_title: meeting.title, teacher_id: validRecipients[idx]?.id },
      status: res.status,
      provider_message_id: res.messageId || null,
      error_message: res.error || null,
    }));

    await supabase.from('notification_log').insert(logsToInsert);

    return new Response(
      JSON.stringify({
        success: true,
        meetingId,
        notifiedCount: sendResults.length,
        results: sendResults,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
