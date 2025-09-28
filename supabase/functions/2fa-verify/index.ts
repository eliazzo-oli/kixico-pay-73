import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { authenticator } from 'https://esm.sh/otplib@12.0.1';
import { createHash } from "https://deno.land/std@0.168.0/node/crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('2FA Verify function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, password, code, recoveryCode } = await req.json();

    if (!email || !password || (!code && !recoveryCode)) {
      return new Response(JSON.stringify({ error: 'Email, password, and code/recovery code are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role for initial auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Attempting initial authentication');

    // First verify email/password
    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('Authentication failed:', authError);
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Initial auth successful, checking 2FA');

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('two_factor_secret, is_two_factor_enabled')
      .eq('user_id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!profile.is_two_factor_enabled || !profile.two_factor_secret) {
      console.log('2FA not enabled for user');
      return new Response(JSON.stringify({ error: '2FA not enabled' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let isValid = false;

    if (code) {
      // Verify TOTP code
      console.log('Verifying TOTP code');
      isValid = authenticator.verify({
        token: code,
        secret: profile.two_factor_secret,
      });
      console.log('TOTP verification result:', isValid);
    } else if (recoveryCode) {
      // Verify recovery code
      console.log('Verifying recovery code');
      const hashedRecoveryCode = createHash('sha256').update(recoveryCode.toUpperCase()).digest('hex');
      
      const { data: recoveryCodeData, error: recoveryError } = await supabaseClient
        .from('recovery_codes')
        .select('id, used_at')
        .eq('user_id', authData.user.id)
        .eq('hashed_code', hashedRecoveryCode)
        .maybeSingle();

      if (recoveryError) {
        console.error('Recovery code check error:', recoveryError);
        return new Response(JSON.stringify({ error: 'Error checking recovery code' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (recoveryCodeData && !recoveryCodeData.used_at) {
        // Mark recovery code as used
        const { error: markUsedError } = await supabaseClient
          .from('recovery_codes')
          .update({ used_at: new Date().toISOString() })
          .eq('id', recoveryCodeData.id);

        if (markUsedError) {
          console.error('Error marking recovery code as used:', markUsedError);
        } else {
          isValid = true;
          console.log('Recovery code verified and marked as used');
        }
      }
    }

    if (!isValid) {
      console.log('2FA verification failed');
      // Sign out the user since they failed 2FA
      await supabaseClient.auth.signOut();
      return new Response(JSON.stringify({ error: 'Invalid 2FA code' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('2FA verification successful');

    // Return the session data
    return new Response(JSON.stringify({
      success: true,
      user: authData.user,
      session: authData.session
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in 2fa-verify function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});