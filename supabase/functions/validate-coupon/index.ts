import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ValidateCouponRequest {
  product_id: string;
  coupon_code: string;
}

interface ValidateCouponResponse {
  valid: boolean;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { product_id, coupon_code }: ValidateCouponRequest = await req.json();

    if (!product_id || !coupon_code) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Product ID and coupon code are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Validating coupon: ${coupon_code} for product: ${product_id}`);

    // Check if coupon exists and is valid
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('product_id', product_id)
      .eq('code', coupon_code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching coupon:', error);
      return new Response(
        JSON.stringify({ valid: false, error: 'Error validating coupon' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!coupon) {
      console.log('Coupon not found or inactive');
      return new Response(
        JSON.stringify({ valid: false, error: 'Cupão inválido ou expirado' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if coupon has expired
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      console.log('Coupon has expired');
      return new Response(
        JSON.stringify({ valid: false, error: 'Cupão expirado' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      console.log('Coupon usage limit exceeded');
      return new Response(
        JSON.stringify({ valid: false, error: 'Cupão esgotado' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Coupon is valid:', coupon);

    const response: ValidateCouponResponse = {
      valid: true,
      discount_type: coupon.discount_type,
      discount_value: parseFloat(coupon.value)
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Erro interno do servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});