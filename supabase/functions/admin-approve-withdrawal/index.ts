import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

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

    // Verificar papel de administrador
    const { data: isAdmin, error: roleError } = await supabase
      .rpc('has_role', { _user_id: user.id, _role: 'admin' });

    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { withdrawalId, note } = await req.json();
    if (!withdrawalId) {
      return new Response(
        JSON.stringify({ error: 'withdrawalId é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar o saque
    const { data: withdrawal, error: wError } = await supabase
      .from('withdrawals')
      .select('id, user_id, amount, status')
      .eq('id', withdrawalId)
      .single();

    if (wError || !withdrawal) {
      console.error('Erro ao buscar saque:', wError);
      return new Response(
        JSON.stringify({ error: 'Saque não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (withdrawal.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Apenas saques pendentes podem ser aprovados' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Criar transação de débito (valor negativo)
    console.log('Tentando criar transação:', {
      user_id: withdrawal.user_id,
      amount: -Number(withdrawal.amount),
      status: 'completed',
      product_id: null,
      customer_email: note || 'Saque aprovado',
      customer_name: 'Sistema',
      payment_method: 'saque'
    });

    const { data: tx, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: withdrawal.user_id,
        amount: -Number(withdrawal.amount),
        status: 'completed',
        product_id: null, // permitido após migração para NULL
        customer_email: note || 'Saque aprovado',
        customer_name: 'Sistema',
        payment_method: 'saque'
      })
      .select('id')
      .single();

    if (txError) {
      console.error('ERRO DETALHADO ao criar transação de saque:', {
        error: txError,
        message: txError.message,
        details: txError.details,
        hint: txError.hint,
        code: txError.code
      });
      return new Response(
        JSON.stringify({ 
          error: 'Falha ao registrar transação de saque', 
          details: txError.message,
          code: txError.code 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Atualizar status do saque para aprovado
    const { error: updError } = await supabase
      .from('withdrawals')
      .update({ status: 'approved' })
      .eq('id', withdrawalId);

    if (updError) {
      console.error('Erro ao atualizar saque, revertendo transação...', updError);
      // Tentar reverter inserção da transação
      await supabase.from('transactions').delete().eq('id', tx?.id ?? '');
      return new Response(
        JSON.stringify({ error: 'Falha ao atualizar saque' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Saque aprovado: saque=${withdrawalId} tx=${tx?.id} user=${withdrawal.user_id}`);

    return new Response(
      JSON.stringify({ success: true, transaction_id: tx?.id, withdrawal_id: withdrawalId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro em admin-approve-withdrawal:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});