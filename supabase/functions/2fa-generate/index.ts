import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticator } from 'https://esm.sh/otplib@12.0.1';
import QRCode from 'https://esm.sh/qrcode@1.5.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('2FA Generate function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('User authenticated:', user.id);

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('name, email, is_two_factor_enabled')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if 2FA is already enabled
    if (profile.is_two_factor_enabled) {
      return new Response(JSON.stringify({ error: '2FA already enabled' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate secret
    const secret = authenticator.generateSecret();
    console.log('Generated secret for user');

    // Create otpauth URL
    const service = 'KixicoPay';
    const account = profile.email;
    const otpauthUrl = authenticator.keyuri(account, service, secret);

    console.log('Generated otpauth URL');

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
    
    console.log('Generated QR code');

    // Store temporary secret (not yet activated)
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ two_factor_secret: secret })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error storing secret:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to store secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Secret stored temporarily');

    return new Response(JSON.stringify({
      qrCode: qrCodeDataURL,
      secret: secret,
      manualEntryKey: secret.match(/.{1,4}/g)?.join(' ') || secret
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in 2fa-generate function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});