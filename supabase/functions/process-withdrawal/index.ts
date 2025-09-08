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

    // Verificar saldo do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      return new Response(
        JSON.stringify({ error: 'Erro ao verificar saldo do usuário' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!profile || profile.balance < amount) {
      return new Response(
        JSON.stringify({ error: 'Saldo insuficiente para o saque' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Iniciar transação do banco de dados
    // Primeiro, subtrair o valor do saldo
    const newBalance = profile.balance - amount;
    const { error: updateBalanceError } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('user_id', user.id);

    if (updateBalanceError) {
      console.error('Erro ao atualizar saldo:', updateBalanceError);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar saque' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar registro de saque na tabela transactions
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        amount: amount,
        status: 'pending',
        product_id: null, // Null para saques
        customer_email: '', // Email vazio para saques
        payment_method: 'saque'
      })
      .select()
      .single();

    if (transactionError) {
      console.error('Erro ao criar transação de saque:', transactionError);
      
      // Reverter o saldo se houve erro
      await supabase
        .from('profiles')
        .update({ balance: profile.balance })
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ error: 'Erro ao criar solicitação de saque' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log da operação
    console.log(`Saque processado: Usuário ${user.id}, Valor: ${amount}, ID: ${transaction.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Solicitação de saque criada com sucesso',
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          status: transaction.status,
          created_at: transaction.created_at
        },
        new_balance: newBalance
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