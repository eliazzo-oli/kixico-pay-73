import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização necessário' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Token inválido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { amount, bank_name, account_number } = await req.json();

    // Validar dados de entrada
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Valor do saque deve ser maior que zero' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar saldo do usuário calculando das transações
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .select('amount, status, payment_method')
      .eq('user_id', user.id);

    if (transactionError) {
      console.error('Erro ao buscar transações:', transactionError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar saldo do usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate current balance
    let currentBalance = 0;
    transactionData?.forEach(transaction => {
      if (transaction.status === 'completed') {
        if (transaction.payment_method === 'saque' || transaction.payment_method === 'taxa' || transaction.payment_method === 'debito') {
          // These are debits (negative amounts)
          currentBalance += Number(transaction.amount);
        } else {
          // These are credits (sales)
          currentBalance += Number(transaction.amount);
        }
      }
    });

    if (currentBalance < amount) {
      return new Response(
        JSON.stringify({ error: 'Saldo insuficiente para o saque' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar registro de saque na tabela withdrawals
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount: amount,
        status: 'pending',
        bank_name: bank_name || null,
        account_number: account_number || null
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('Erro ao criar solicitação de saque:', withdrawalError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar solicitação de saque' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for email
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, email')
      .eq('user_id', user.id)
      .single();

    // Send withdrawal request confirmation email
    if (profile) {
      try {
        await supabase.functions.invoke('send-transactional-email', {
          body: {
            to: profile.email,
            template: 'withdrawal-request',
            data: {
              userName: profile.name,
              withdrawalAmount: amount
            }
          }
        });
      } catch (emailError) {
        console.error('Withdrawal request email error:', emailError);
        // Don't fail the withdrawal if email fails
      }
    }

    // Log da operação
    console.log(`Saque solicitado: Usuário ${user.id}, Valor: ${amount}, ID: ${withdrawal.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Solicitação de saque criada com sucesso',
        withdrawal: {
          id: withdrawal.id,
          amount: withdrawal.amount,
          status: withdrawal.status,
          created_at: withdrawal.created_at
        },
        current_balance: currentBalance
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Erro no processamento de saque:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});