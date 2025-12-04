import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
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

    const { amount, from_currency, to_currency } = await req.json();

    // Validate input
    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Valor inválido para conversão' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (from_currency !== 'BRL' || to_currency !== 'AOA') {
      return new Response(
        JSON.stringify({ error: 'Conversão não suportada. Apenas BRL para AOA.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing conversion: ${amount} ${from_currency} to ${to_currency} for user ${user.id}`);

    // Get current exchange rate
    const { data: rateData, error: rateError } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', from_currency)
      .eq('to_currency', to_currency)
      .single();

    if (rateError || !rateData) {
      console.error('Error fetching exchange rate:', rateError);
      return new Response(
        JSON.stringify({ error: 'Taxa de câmbio não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const exchangeRate = Number(rateData.rate);
    const convertedAmount = Number(amount) * exchangeRate;

    console.log(`Exchange rate: ${exchangeRate}, Converted amount: ${convertedAmount}`);

    // Get user's BRL wallet balance
    const { data: brlWallet, error: brlError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .eq('currency', 'BRL')
      .single();

    if (brlError || !brlWallet) {
      console.error('Error fetching BRL wallet:', brlError);
      return new Response(
        JSON.stringify({ error: 'Carteira BRL não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check sufficient balance
    if (Number(brlWallet.balance) < Number(amount)) {
      return new Response(
        JSON.stringify({ error: 'Saldo insuficiente na carteira BRL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's AOA wallet
    const { data: aoaWallet, error: aoaError } = await supabase
      .from('wallets')
      .select('id, balance')
      .eq('user_id', user.id)
      .eq('currency', 'AOA')
      .single();

    if (aoaError || !aoaWallet) {
      console.error('Error fetching AOA wallet:', aoaError);
      return new Response(
        JSON.stringify({ error: 'Carteira AOA não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Execute atomic transaction
    // 1. Debit BRL wallet
    const newBrlBalance = Number(brlWallet.balance) - Number(amount);
    const { error: debitError } = await supabase
      .from('wallets')
      .update({ balance: newBrlBalance, updated_at: new Date().toISOString() })
      .eq('id', brlWallet.id);

    if (debitError) {
      console.error('Error debiting BRL wallet:', debitError);
      return new Response(
        JSON.stringify({ error: 'Erro ao debitar carteira BRL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Credit AOA wallet
    const newAoaBalance = Number(aoaWallet.balance) + convertedAmount;
    const { error: creditError } = await supabase
      .from('wallets')
      .update({ balance: newAoaBalance, updated_at: new Date().toISOString() })
      .eq('id', aoaWallet.id);

    if (creditError) {
      // Rollback BRL debit
      console.error('Error crediting AOA wallet, rolling back:', creditError);
      await supabase
        .from('wallets')
        .update({ balance: brlWallet.balance, updated_at: new Date().toISOString() })
        .eq('id', brlWallet.id);
      
      return new Response(
        JSON.stringify({ error: 'Erro ao creditar carteira AOA' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Record conversion in history
    const { error: conversionError } = await supabase
      .from('currency_conversions')
      .insert({
        user_id: user.id,
        from_currency,
        to_currency,
        from_amount: amount,
        to_amount: convertedAmount,
        exchange_rate: exchangeRate,
        status: 'completed'
      });

    if (conversionError) {
      console.error('Error recording conversion:', conversionError);
      // Don't rollback - the conversion was successful, just logging failed
    }

    console.log(`Conversion successful: ${amount} BRL -> ${convertedAmount} AOA`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Conversão realizada com sucesso',
        from_amount: amount,
        to_amount: convertedAmount,
        exchange_rate: exchangeRate,
        new_brl_balance: newBrlBalance,
        new_aoa_balance: newAoaBalance
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Conversion error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno ao processar conversão' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
