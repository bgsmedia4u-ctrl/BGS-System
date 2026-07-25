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

    // 1. Authenticate caller
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

    // 2. Verify Admin Role
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!adminProfile || adminProfile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can send SMS notifications' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { templateId, recipientIds, variables } = await req.json();

    if (!templateId || !recipientIds || !Array.isArray(recipientIds) || recipientIds.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid parameters: templateId and recipientIds array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Verify Template exists in notification_templates
    const { data: template, error: tmplError } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('template_id', templateId)
      .maybeSingle();

    if (tmplError || !template) {
      return new Response(JSON.stringify({ error: `Template '${templateId}' not found in registered templates` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Fetch target teacher phones
    const { data: teacherProfiles } = await supabase
      .from('profiles')
      .select('id, name, phone')
      .in('id', recipientIds);

    if (!teacherProfiles || teacherProfiles.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid teacher recipients found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Send SMS via shared MSG91 helper
    const smsRecipients = teacherProfiles
      .filter((t) => t.phone)
      .map((t) => ({
        phone: t.phone,
        variables: {
          var1: t.name,
          var2: (variables && variables.var2) || (variables && variables[1]) || '',
          ...variables,
        },
      }));

    if (smsRecipients.length === 0) {
      return new Response(JSON.stringify({ error: 'Selected teachers do not have valid phone numbers configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sendResults = await sendMsg91Sms({
      templateId,
      recipients: smsRecipients,
    });

    // 6. Record logs into notification_log
    const logsToInsert = sendResults.map((res) => ({
      channel: 'sms',
      template_id: templateId,
      recipient_phone: res.phone,
      variables: variables || {},
      status: res.status,
      provider_message_id: res.messageId || null,
      error_message: res.error || null,
      sent_by: user.id,
    }));

    await supabase.from('notification_log').insert(logsToInsert);

    return new Response(
      JSON.stringify({
        success: true,
        total: sendResults.length,
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
