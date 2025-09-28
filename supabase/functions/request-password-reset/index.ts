import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Processing password reset request for:', email);

    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('user_id, name')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      console.log('User not found for email:', email);
      // Return success anyway for security (don't reveal if email exists)
      return new Response(
        JSON.stringify({ message: 'Se o email existir, você receberá um link de recuperação' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate reset token (random UUID-like string)
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Store reset token in database (you may need to create this table)
    const { error: tokenError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: userData.user_id,
        token: resetToken,
        expires_at: expiresAt.toISOString()
      });

    if (tokenError) {
      console.error('Error storing reset token:', tokenError);
      
      // If table doesn't exist, we'll create it on the fly (for development)
      if (tokenError.code === '42P01') {
        console.log('Creating password_reset_tokens table...');
        const { error: createTableError } = await supabase.rpc('exec', {
          query: `
            CREATE TABLE IF NOT EXISTS password_reset_tokens (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              token TEXT NOT NULL UNIQUE,
              expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
              used_at TIMESTAMP WITH TIME ZONE NULL,
              created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
            CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
          `
        });

        if (!createTableError) {
          // Try inserting again
          const { error: retryTokenError } = await supabase
            .from('password_reset_tokens')
            .insert({
              user_id: userData.user_id,
              token: resetToken,
              expires_at: expiresAt.toISOString()
            });

          if (retryTokenError) {
            throw retryTokenError;
          }
        }
      } else {
        throw tokenError;
      }
    }

    // Send password reset email
    const resetUrl = `${req.headers.get('origin')}/reset-password?token=${resetToken}`;
    
    const { error: emailError } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        to: email,
        template: 'password-reset',
        data: {
          userName: userData.name || 'Usuário',
          resetUrl: resetUrl
        }
      }
    });

    if (emailError) {
      console.error('Error sending reset email:', emailError);
      throw emailError;
    }

    console.log('Password reset email sent successfully to:', email);

    return new Response(
      JSON.stringify({ message: 'Email de recuperação enviado com sucesso' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in request-password-reset:', error);
    
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});