import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Simple fetch-based email sending instead of resend package

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface KycNotificationRequest {
  to: string;
  userName: string;
  status: 'approved' | 'rejected';
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, userName, status, rejectionReason }: KycNotificationRequest = await req.json();

    console.log(`Sending KYC ${status} notification to:`, to);

    let subject: string;
    let htmlContent: string;

    if (status === 'approved') {
      subject = "✅ Verificação de Identidade Aprovada - KixicoPay";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 40px; border: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin: 0; font-size: 24px; font-weight: bold;">
              ✅ Verificação Aprovada!
            </h1>
          </div>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
            <p style="margin: 0; color: #15803d; font-weight: 500;">
              Parabéns, ${userName}! Sua identidade foi verificada com sucesso.
            </p>
          </div>
          
          <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">O que isso significa?</h2>
          
          <ul style="color: #4b5563; line-height: 1.6; padding-left: 20px;">
            <li>Agora você pode realizar vendas sem limitações</li>
            <li>Pode processar saques de sua carteira</li>
            <li>Tem acesso completo a todas as funcionalidades da plataforma</li>
            <li>Sua conta está totalmente ativa</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://tumanpeywddnixgyfale.lovable.app/dashboard" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Acessar Dashboard
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Obrigado por escolher a KixicoPay para suas vendas online!
            </p>
          </div>
        </div>
      `;
    } else {
      subject = "❌ Verificação de Identidade Rejeitada - KixicoPay";
      htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 40px; border: 1px solid #e5e7eb;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin: 0; font-size: 24px; font-weight: bold;">
              ❌ Verificação Rejeitada
            </h1>
          </div>
          
          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 20px; margin-bottom: 25px;">
            <p style="margin: 0; color: #991b1b; font-weight: 500;">
              Olá, ${userName}. Infelizmente, não foi possível verificar sua identidade neste momento.
            </p>
          </div>
          
          ${rejectionReason ? `
            <div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
              <h3 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">Motivo da rejeição:</h3>
              <p style="color: #92400e; margin: 0; line-height: 1.5;">${rejectionReason}</p>
            </div>
          ` : ''}
          
          <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">O que fazer agora?</h2>
          
          <ul style="color: #4b5563; line-height: 1.6; padding-left: 20px;">
            <li>Revise os documentos enviados e certifique-se de que estão claros e legíveis</li>
            <li>Verifique se as informações nos documentos correspondem aos dados da conta</li>
            <li>Certifique-se de que a selfie mostra claramente seu rosto junto ao documento</li>
            <li>Envie documentos em alta qualidade (JPG, PNG ou PDF)</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://tumanpeywddnixgyfale.lovable.app/configuracoes/verificacao" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
              Tentar Novamente
            </a>
          </div>
          
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px; margin: 0;">
              Em caso de dúvidas, entre em contato com nosso suporte.
            </p>
          </div>
        </div>
      `;
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "KixicoPay <noreply@resend.dev>",
        to: [to],
        subject: subject,
        html: htmlContent,
      }),
    });

    console.log("KYC notification email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending KYC notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);