import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing webhook retries...');

    // Get pending retries that are due
    const { data: pendingRetries, error: retriesError } = await supabase
      .from('webhook_attempts')
      .select(`
        *,
        webhook_endpoints(*),
        webhook_events(*)
      `)
      .not('next_retry_at', 'is', null)
      .lte('next_retry_at', new Date().toISOString())
      .eq('succeeded', false)
      .limit(50);

    if (retriesError) {
      console.error('Error fetching pending retries:', retriesError);
      throw retriesError;
    }

    if (!pendingRetries || pendingRetries.length === 0) {
      console.log('No pending retries found');
      return new Response(JSON.stringify({ message: 'No pending retries' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${pendingRetries.length} pending retries`);

    const results = await Promise.allSettled(
      pendingRetries.map(retry => processRetry(supabase, retry))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Retry processing complete: ${successful} successful, ${failed} failed`);

    return new Response(JSON.stringify({
      message: 'Retries processed',
      successful,
      failed,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in webhook-retry function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processRetry(supabase: any, retry: any) {
  const endpoint = retry.webhook_endpoints;
  const webhookEvent = retry.webhook_events;

  // Skip if endpoint is inactive or has reached max failures
  if (!endpoint.is_active || endpoint.failure_count >= 10) {
    console.log(`Skipping retry for inactive/failed endpoint: ${endpoint.id}`);
    
    // Clear the retry
    await supabase
      .from('webhook_attempts')
      .update({ next_retry_at: null })
      .eq('id', retry.id);
    
    return;
  }

  const eventId = `evt_${webhookEvent.id.replace(/-/g, '').substring(0, 14)}`;
  
  const payload = {
    id: eventId,
    event_type: webhookEvent.event_type,
    api_version: webhookEvent.api_version,
    created_at: Math.floor(new Date(webhookEvent.created_at).getTime() / 1000).toString(),
    data: webhookEvent.data,
  };

  const payloadString = JSON.stringify(payload);
  const signature = await generateSignature(endpoint.secret_key, payloadString);

  try {
    console.log(`Retrying webhook to ${endpoint.url} (attempt ${retry.attempt_number})`);
    
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'KixicoPay-Signature': signature,
        'User-Agent': 'KixicoPay-Webhooks/1.0',
      },
      body: payloadString,
      signal: AbortSignal.timeout(30000),
    });

    const responseBody = await response.text();
    const succeeded = response.status >= 200 && response.status < 300;

    // Update the current attempt
    await supabase
      .from('webhook_attempts')
      .update({
        http_status: response.status,
        response_body: responseBody.substring(0, 1000),
        succeeded,
        next_retry_at: null, // Clear retry schedule
      })
      .eq('id', retry.id);

    if (succeeded) {
      console.log(`Retry successful for ${endpoint.url}`);
      
      // Reset failure count on success
      await supabase
        .from('webhook_endpoints')
        .update({ 
          failure_count: 0,
          last_failure_at: null,
        })
        .eq('id', endpoint.id);
        
    } else {
      console.log(`Retry failed for ${endpoint.url}: HTTP ${response.status}`);
      
      // Update failure count
      await supabase
        .from('webhook_endpoints')
        .update({
          failure_count: endpoint.failure_count + 1,
          last_failure_at: new Date().toISOString(),
        })
        .eq('id', endpoint.id);

      // Schedule next retry if under limit
      if (retry.attempt_number < 10 && endpoint.failure_count < 9) {
        await scheduleNextRetry(supabase, retry);
      } else {
        // Disable endpoint after max attempts
        await supabase
          .from('webhook_endpoints')
          .update({ is_active: false })
          .eq('id', endpoint.id);
        
        console.log(`Endpoint ${endpoint.id} disabled after max retry attempts`);
      }
    }

  } catch (error) {
    console.error(`Retry error for ${endpoint.url}:`, error);
    
    // Update attempt with error
    await supabase
      .from('webhook_attempts')
      .update({
        error_message: error instanceof Error ? error.message : 'Unknown error',
        next_retry_at: null,
      })
      .eq('id', retry.id);

    // Update failure count
    await supabase
      .from('webhook_endpoints')
      .update({
        failure_count: endpoint.failure_count + 1,
        last_failure_at: new Date().toISOString(),
      })
      .eq('id', endpoint.id);

    // Schedule next retry if under limit
    if (retry.attempt_number < 10 && endpoint.failure_count < 9) {
      await scheduleNextRetry(supabase, retry);
    }
  }
}

async function scheduleNextRetry(supabase: any, retry: any) {
  // Exponential backoff: 2^attempt minutes, max 24 hours
  const delayMinutes = Math.min(Math.pow(2, retry.attempt_number), 1440);
  const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

  await supabase
    .from('webhook_attempts')
    .insert({
      webhook_endpoint_id: retry.webhook_endpoint_id,
      webhook_event_id: retry.webhook_event_id,
      attempt_number: retry.attempt_number + 1,
      next_retry_at: nextRetryAt.toISOString(),
      succeeded: false,
    });

  console.log(`Scheduled next retry in ${delayMinutes} minutes`);
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