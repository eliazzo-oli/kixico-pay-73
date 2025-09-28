import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as OTPAuth from 'https://esm.sh/otpauth@9.2.3';
import { createHash, randomBytes } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('2FA Enable function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code } = await req.json();

    if (!code) {
      return new Response(JSON.stringify({ error: 'Code is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Get user profile with secret
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('two_factor_secret, is_two_factor_enabled')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!profile.two_factor_secret) {
      return new Response(JSON.stringify({ error: 'No 2FA setup in progress' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (profile.is_two_factor_enabled) {
      return new Response(JSON.stringify({ error: '2FA already enabled' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Verifying TOTP code');

    // Verify the TOTP code
    const totp = new OTPAuth.TOTP({
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: profile.two_factor_secret,
    });
    const isValid = totp.validate({ token: code, window: 1 }) !== null;
    
    console.log('TOTP verification result:', isValid);
    if (!isValid) {
      console.log('Invalid TOTP code provided');
      return new Response(JSON.stringify({ error: 'Invalid code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('TOTP code verified successfully');

    // Generate recovery codes
    const recoveryCodes: string[] = [];
    const hashedCodes: string[] = [];
    
    for (let i = 0; i < 8; i++) {
      const code = randomBytes(4).toString('hex').toUpperCase();
      recoveryCodes.push(code);
      hashedCodes.push(createHash('sha256').update(code).digest('hex').toString());
    }

    console.log('Generated recovery codes');

    // Start transaction by enabling 2FA
    const { error: enableError } = await supabaseClient
      .from('profiles')
      .update({ is_two_factor_enabled: true })
      .eq('user_id', user.id);

    if (enableError) {
      console.error('Error enabling 2FA:', enableError);
      return new Response(JSON.stringify({ error: 'Failed to enable 2FA' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store recovery codes
    const recoveryCodeRecords = hashedCodes.map(hashedCode => ({
      user_id: user.id,
      hashed_code: hashedCode,
    }));

    const { error: codesError } = await supabaseClient
      .from('recovery_codes')
      .insert(recoveryCodeRecords);

    if (codesError) {
      console.error('Error storing recovery codes:', codesError);
      // Rollback 2FA enabling
      await supabaseClient
        .from('profiles')
        .update({ is_two_factor_enabled: false })
        .eq('user_id', user.id);
      
      return new Response(JSON.stringify({ error: 'Failed to store recovery codes' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('2FA enabled successfully');

    return new Response(JSON.stringify({
      success: true,
      recoveryCodes: recoveryCodes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in 2fa-enable function:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});