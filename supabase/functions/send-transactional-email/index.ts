import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string;
  template: 'welcome' | 'password-reset' | 'sale-notification' | 'withdrawal-request' | 'withdrawal-approved';
  data: {
    userName?: string;
    productName?: string;
    saleAmount?: number;
    withdrawalAmount?: number;
    resetUrl?: string;
    dashboardUrl?: string;
  };
}

const emailTemplates = {
  welcome: {
    subject: (data: any) => `Bem-vindo à KixicoPay, ${data.userName}!`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; background: #f8f9fa; padding: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">KixicoPay</div>
          </div>
          <div class="content">
            <h2>Bem-vindo à KixicoPay, ${data.userName}!</h2>
            <p>Parabéns por se juntar à nossa plataforma de pagamentos!</p>
            <p>Com a KixicoPay, pode:</p>
            <ul>
              <li>Criar e vender produtos digitais</li>
              <li>Receber pagamentos de forma segura</li>
              <li>Gerir as suas vendas através do dashboard</li>
              <li>Solicitar saques quando quiser</li>
            </ul>
            <p>Está pronto para começar?</p>
            <a href="${data.dashboardUrl || '#'}" class="button">Aceder à Dashboard</a>
          </div>
          <div class="footer">
            <p>© 2025 KixicoPay - Plataforma de Pagamentos Digitais</p>
            <p>Este é um e-mail automático, por favor não responda.</p>
          </div>
        </body>
      </html>
    `
  },
  'password-reset': {
    subject: () => 'Recuperação de Senha da KixicoPay',
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; background: #f8f9fa; padding: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .content { padding: 30px 20px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 12px; }
            .warning { background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">KixicoPay</div>
          </div>
          <div class="content">
            <h2>Recuperação de Senha</h2>
            <p>Olá ${data.userName},</p>
            <p>Recebemos um pedido para redefinir a senha da sua conta KixicoPay.</p>
            <div class="warning">
              <strong>Atenção:</strong> Este link expira em 1 hora por questões de segurança.
            </div>
            <a href="${data.resetUrl}" class="button">Criar Nova Senha</a>
            <p>Se não solicitou esta alteração, pode ignorar este e-mail com segurança.</p>
          </div>
          <div class="footer">
            <p>© 2025 KixicoPay - Plataforma de Pagamentos Digitais</p>
            <p>Este é um e-mail automático, por favor não responda.</p>
          </div>
        </body>
      </html>
    `
  },
  'sale-notification': {
    subject: (data: any) => `Venda Realizada! Recebeu ${data.saleAmount} AOA`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; background: #f8f9fa; padding: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .content { padding: 30px 20px; }
            .success { background: #d1fae5; color: #065f46; padding: 15px; border-radius: 6px; margin: 15px 0; text-align: center; }
            .amount { font-size: 24px; font-weight: bold; color: #059669; }
            .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">KixicoPay</div>
          </div>
          <div class="content">
            <div class="success">
              <h2>🎉 Parabéns! Nova Venda Realizada</h2>
            </div>
            <p>Olá ${data.userName},</p>
            <p>Temos excelentes notícias! O seu produto <strong>"${data.productName}"</strong> acabou de ser vendido.</p>
            <div class="amount">${data.saleAmount} AOA</div>
            <p>O valor já está refletido no seu saldo KixicoPay e pode solicitar o saque a qualquer momento através da sua dashboard.</p>
            <p>Continue assim e obrigado por confiar na KixicoPay!</p>
          </div>
          <div class="footer">
            <p>© 2025 KixicoPay - Plataforma de Pagamentos Digitais</p>
            <p>Este é um e-mail automático, por favor não responda.</p>
          </div>
        </body>
      </html>
    `
  },
  'withdrawal-request': {
    subject: () => 'O seu pedido de saque foi recebido',
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; background: #f8f9fa; padding: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .content { padding: 30px 20px; }
            .info { background: #eff6ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
            .amount { font-size: 18px; font-weight: bold; color: #1d4ed8; }
            .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">KixicoPay</div>
          </div>
          <div class="content">
            <h2>Pedido de Saque Recebido</h2>
            <p>Olá ${data.userName},</p>
            <p>Recebemos o seu pedido de saque no valor de:</p>
            <div class="info">
              <div class="amount">${data.withdrawalAmount} AOA</div>
            </div>
            <p>A nossa equipa irá processar o seu pedido em breve. Receberá uma confirmação por e-mail assim que o saque for aprovado e enviado.</p>
            <p>Obrigado pela confiança!</p>
          </div>
          <div class="footer">
            <p>© 2025 KixicoPay - Plataforma de Pagamentos Digitais</p>
            <p>Este é um e-mail automático, por favor não responda.</p>
          </div>
        </body>
      </html>
    `
  },
  'withdrawal-approved': {
    subject: (data: any) => `Saque enviado! ${data.withdrawalAmount} AOA a caminho`,
    html: (data: any) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; background: #f8f9fa; padding: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .content { padding: 30px 20px; }
            .success { background: #d1fae5; color: #065f46; padding: 15px; border-radius: 6px; margin: 15px 0; text-align: center; }
            .amount { font-size: 20px; font-weight: bold; color: #059669; }
            .footer { text-align: center; padding: 20px; background: #f8f9fa; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">KixicoPay</div>
          </div>
          <div class="content">
            <div class="success">
              <h2>✅ Saque Aprovado e Enviado!</h2>
            </div>
            <p>Olá ${data.userName},</p>
            <p>Boas notícias! O seu saque foi aprovado e enviado para a sua conta bancária.</p>
            <div class="amount">${data.withdrawalAmount} AOA</div>
            <p>O valor deverá estar disponível na sua conta em breve, dependendo do seu banco.</p>
            <p>Obrigado por usar a KixicoPay!</p>
          </div>
          <div class="footer">
            <p>© 2025 KixicoPay - Plataforma de Pagamentos Digitais</p>
            <p>Este é um e-mail automático, por favor não responda.</p>
          </div>
        </body>
      </html>
    `
  }
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, template, data }: EmailRequest = await req.json();

    console.log(`Sending ${template} email to: ${to}`);

    if (!emailTemplates[template]) {
      throw new Error(`Template "${template}" not found`);
    }

    const templateConfig = emailTemplates[template];
    const subject = templateConfig.subject(data);
    const html = templateConfig.html(data);

    const emailResponse = await resend.emails.send({
      from: "KixicoPay <nao-responder@resend.dev>", // You'll need to configure your domain
      to: [to],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.data?.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-transactional-email function:", error);
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