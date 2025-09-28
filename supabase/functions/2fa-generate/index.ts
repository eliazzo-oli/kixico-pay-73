import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as OTPAuth from 'https://esm.sh/otpauth@9.2.3';
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

    // Generate secret - manual base32 encoding
    const generateSecret = () => {
      const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let secret = '';
      for (let i = 0; i < 32; i++) {
        secret += alphabet[Math.floor(Math.random() * 32)];
      }
      return secret;
    };
    
    const secretBase32 = generateSecret();
    console.log('Generated secret for user');

    // Create otpauth URL
    const service = 'KixicoPay';
    const account = profile.email;
    const totp = new OTPAuth.TOTP({
      issuer: service,
      label: account,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secretBase32,
    });
    const otpauthUrl = totp.toString();

    console.log('Generated otpauth URL');

    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
    
    console.log('Generated QR code');

    // Store temporary secret (not yet activated)
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({ two_factor_secret: secretBase32 })
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
      secret: secretBase32,
      manualEntryKey: secretBase32.match(/.{1,4}/g)?.join(' ') || secretBase32
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in 2fa-generate function:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});