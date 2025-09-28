import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Exporting transactions for user:', user.id);

    // Fetch all transactions for the user
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*, products(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch transactions' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Found', transactions?.length || 0, 'transactions');

    // CSV Headers
    const csvHeaders = [
      'ID da Transação',
      'Data', 
      'Tipo',
      'Descrição/Produto',
      'Valor',
      'Moeda',
      'Status'
    ];

    // Format transactions as CSV rows
    const csvRows = transactions?.map(transaction => {
      const date = new Date(transaction.created_at).toLocaleDateString('pt-AO');
      
      // Determine transaction type and description based on the logic from dashboard
      let type = 'Venda';
      let description = 'Produto não identificado';
      
      if (transaction.product_id) {
        // It's a product sale
        type = 'Venda';
        description = transaction.products?.name || 'Produto não encontrado';
      } else {
        // It's a system transaction
        if (transaction.payment_method === 'saque') {
          type = 'Saque';
          description = 'Saque Aprovado';
        } else if (transaction.payment_method === 'credito') {
          type = 'Ajuste';
          description = 'Ajuste Manual (Crédito)';
        } else if (transaction.payment_method === 'debito') {
          type = 'Ajuste';
          description = 'Ajuste Manual (Débito)';
        } else {
          type = 'Sistema';
          description = 'Transação do Sistema';
        }
      }

      const value = transaction.amount.toLocaleString('pt-AO', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      const status = transaction.status === 'completed' ? 'Completado' :
                    transaction.status === 'pending' ? 'Pendente' :
                    transaction.status === 'failed' ? 'Falhou' : 
                    transaction.status;

      return [
        transaction.id.substring(0, 8) + '...',
        date,
        type,
        description,
        value,
        'AOA',
        status
      ];
    }) || [];

    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => 
        // Escape CSV values that contain commas or quotes
        typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
          ? `"${cell.replace(/"/g, '""')}"` 
          : cell
      ).join(','))
    ].join('\n');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const filename = `historico_transacoes_kixicopay_${currentDate}.csv`;

    console.log('Generated CSV with', csvRows.length, 'rows');

    // Return CSV file as download
    return new Response(csvContent, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error in export-transactions:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})