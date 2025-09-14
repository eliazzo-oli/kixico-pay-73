import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookEvent {
  id: string;
  event_type: string;
  api_version: string;
  created_at: string;
  data: {
    object: any;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { userId, eventType, eventData } = await req.json();

    console.log('Processing webhook event:', { userId, eventType });

    // Get active webhook endpoints for this user
    const { data: endpoints, error: endpointsError } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .contains('events', [eventType]);

    if (endpointsError) {
      console.error('Error fetching endpoints:', endpointsError);
      throw endpointsError;
    }

    if (!endpoints || endpoints.length === 0) {
      console.log('No active endpoints found for event type:', eventType);
      return new Response(JSON.stringify({ message: 'No active endpoints found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create webhook event record
    const { data: webhookEvent, error: eventError } = await supabase
      .from('webhook_events')
      .insert({
        user_id: userId,
        event_type: eventType,
        data: eventData,
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error creating webhook event:', eventError);
      throw eventError;
    }

    // Send webhook to each endpoint
    const promises = endpoints.map(async (endpoint) => {
      return sendWebhookToEndpoint(supabase, endpoint, webhookEvent);
    });

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Webhook delivery results: ${successful} successful, ${failed} failed`);

    return new Response(JSON.stringify({
      message: 'Webhooks processed',
      successful,
      failed,
      event_id: webhookEvent.id,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in send-webhook function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function sendWebhookToEndpoint(supabase: any, endpoint: any, webhookEvent: any) {
  const eventId = `evt_${webhookEvent.id.replace(/-/g, '').substring(0, 14)}`;
  
  const payload: WebhookEvent = {
    id: eventId,
    event_type: webhookEvent.event_type,
    api_version: webhookEvent.api_version,
    created_at: Math.floor(new Date(webhookEvent.created_at).getTime() / 1000).toString(),
    data: webhookEvent.data,
  };

  const payloadString = JSON.stringify(payload);
  
  // Generate HMAC-SHA256 signature
  const signature = await generateSignature(endpoint.secret_key, payloadString);

  try {
    console.log(`Sending webhook to ${endpoint.url}`);
    
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'KixicoPay-Signature': signature,
        'User-Agent': 'KixicoPay-Webhooks/1.0',
      },
      body: payloadString,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseBody = await response.text();
    const succeeded = response.status >= 200 && response.status < 300;

    // Record the attempt
    await supabase
      .from('webhook_attempts')
      .insert({
        webhook_endpoint_id: endpoint.id,
        webhook_event_id: webhookEvent.id,
        http_status: response.status,
        response_body: responseBody.substring(0, 1000), // Limit response body size
        succeeded,
        attempt_number: 1,
      });

    if (!succeeded) {
      // Update endpoint failure count
      await supabase
        .from('webhook_endpoints')
        .update({
          failure_count: endpoint.failure_count + 1,
          last_failure_at: new Date().toISOString(),
        })
        .eq('id', endpoint.id);

      // Schedule retry if failure count is less than 10
      if (endpoint.failure_count < 9) {
        await scheduleRetry(supabase, endpoint.id, webhookEvent.id, 1);
      } else {
        // Disable endpoint after 10 failures
        await supabase
          .from('webhook_endpoints')
          .update({ is_active: false })
          .eq('id', endpoint.id);
        
        console.log(`Endpoint ${endpoint.id} disabled after 10 consecutive failures`);
      }

      throw new Error(`HTTP ${response.status}: ${responseBody}`);
    } else {
      // Reset failure count on success
      if (endpoint.failure_count > 0) {
        await supabase
          .from('webhook_endpoints')
          .update({ 
            failure_count: 0,
            last_failure_at: null,
          })
          .eq('id', endpoint.id);
      }
    }

    console.log(`Webhook delivered successfully to ${endpoint.url}`);
    return { success: true, endpoint: endpoint.url };

  } catch (error) {
    console.error(`Failed to deliver webhook to ${endpoint.url}:`, error);
    
    // Record failed attempt
    await supabase
      .from('webhook_attempts')
      .insert({
        webhook_endpoint_id: endpoint.id,
        webhook_event_id: webhookEvent.id,
        error_message: error.message,
        succeeded: false,
        attempt_number: 1,
      });

    // Update failure count
    await supabase
      .from('webhook_endpoints')
      .update({
        failure_count: endpoint.failure_count + 1,
        last_failure_at: new Date().toISOString(),
      })
      .eq('id', endpoint.id);

    // Schedule retry
    if (endpoint.failure_count < 9) {
      await scheduleRetry(supabase, endpoint.id, webhookEvent.id, 1);
    }

    throw error;
  }
}

async function generateSignature(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(payload)
  );

  const hashArray = Array.from(new Uint8Array(signature));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `sha256=${hashHex}`;
}

async function scheduleRetry(supabase: any, endpointId: string, eventId: string, attemptNumber: number) {
  // Exponential backoff: 2^attempt minutes
  const delayMinutes = Math.pow(2, attemptNumber);
  const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

  await supabase
    .from('webhook_attempts')
    .insert({
      webhook_endpoint_id: endpointId,
      webhook_event_id: eventId,
      attempt_number: attemptNumber + 1,
      next_retry_at: nextRetryAt.toISOString(),
      succeeded: false,
    });

  console.log(`Scheduled retry for ${delayMinutes} minutes from now`);
}