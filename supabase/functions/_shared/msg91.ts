export interface SmsRecipient {
  phone: string;
  variables: Record<string, string>;
}

export interface SendSmsParams {
  templateId: string;
  recipients: SmsRecipient[];
}

export interface SendSmsResult {
  phone: string;
  status: 'sent' | 'failed';
  messageId?: string;
  error?: string;
  isMock?: boolean;
}

/**
 * Shared helper for sending SMS via MSG91 Flow API.
 * Falls back to mock execution if MSG91_AUTH_KEY is not set.
 */
export async function sendMsg91Sms(params: SendSmsParams): Promise<SendSmsResult[]> {
  const authKey = Deno.env.get('MSG91_AUTH_KEY');
  
  // If no Auth Key is configured, run in Mock Sandbox mode
  if (!authKey || authKey === 'your_msg91_auth_key_here') {
    console.log('[MSG91 Mock Sandbox] Sending SMS via template:', params.templateId, 'Recipient Count:', params.recipients.length);
    return params.recipients.map(r => ({
      phone: r.phone,
      status: 'sent',
      messageId: `mock_msg_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      isMock: true
    }));
  }

  const results: SendSmsResult[] = [];

  for (const recipient of params.recipients) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // Format phone number (ensure country code e.g. 91)
      let cleanPhone = recipient.phone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        cleanPhone = '91' + cleanPhone;
      }

      const payload = {
        template_id: params.templateId,
        short_url: "0",
        recipients: [
          {
            mobiles: cleanPhone,
            ...recipient.variables
          }
        ]
      };

      const response = await fetch('https://control.msg91.com/api/v5/flow/', {
        method: 'POST',
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok && (data.type === 'success' || data.status === 'success')) {
        results.push({
          phone: recipient.phone,
          status: 'sent',
          messageId: data.message_id || data.request_id || `msg91_${Date.now()}`
        });
      } else {
        results.push({
          phone: recipient.phone,
          status: 'failed',
          error: data.message || JSON.stringify(data)
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      results.push({
        phone: recipient.phone,
        status: 'failed',
        error: err.name === 'AbortError' ? 'MSG91 request timed out after 10 seconds' : (err.message || 'Network failure connecting to MSG91')
      });
    }
  }

  return results;
}
