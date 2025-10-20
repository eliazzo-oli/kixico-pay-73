import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateCouponRequest {
  product_id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  value: number;
  expiry_date?: string;
  usage_limit?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create client with auth header to ensure RLS works server-side
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    const requestBody = await req.json();
    const action = requestBody.action;

    switch (action) {
      case 'get':
        // Get coupons for a product
        const productId = requestBody.product_id;
        if (!productId) {
          return new Response(
            JSON.stringify({ error: 'Product ID is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { data: coupons, error: fetchError } = await supabase
          .from('coupons')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false });

        if (fetchError) {
          console.error('Error fetching coupons:', fetchError);
          return new Response(
            JSON.stringify({ error: 'Error fetching coupons' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        return new Response(
          JSON.stringify(coupons),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      case 'create':
        // Create a new coupon
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return new Response(
            JSON.stringify({ error: 'User not authenticated' }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { data: newCoupon, error: createError } = await supabase
          .from('coupons')
          .insert({
            product_id: requestBody.product_id,
            user_id: user.id,
            code: requestBody.code.toUpperCase(),
            discount_type: requestBody.discount_type,
            value: requestBody.value,
            expiry_date: requestBody.expiry_date,
            usage_limit: requestBody.usage_limit
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating coupon:', createError);
          
          // Check for duplicate code error
          if (createError.code === '23505') {
            return new Response(
              JSON.stringify({ error: 'Este código de cupão já existe. Por favor, escolha outro código.' }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
              }
            );
          }
          
          return new Response(
            JSON.stringify({ error: 'Erro ao criar cupão. Tente novamente.' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        return new Response(
          JSON.stringify(newCoupon),
          { 
            status: 201, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      case 'delete':
        // Delete a coupon
        const couponId = requestBody.coupon_id;
        if (!couponId) {
          return new Response(
            JSON.stringify({ error: 'Coupon ID is required' }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        const { error: deleteError } = await supabase
          .from('coupons')
          .delete()
          .eq('id', couponId);

        if (deleteError) {
          console.error('Error deleting coupon:', deleteError);
          return new Response(
            JSON.stringify({ error: 'Error deleting coupon' }),
            { 
              status: 500, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        return new Response(
          JSON.stringify({ success: true }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});