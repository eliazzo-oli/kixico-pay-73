import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code, 
  Book, 
  Zap, 
  Shield, 
  Globe, 
  Webhook, 
  Terminal, 
  FileText, 
  Github, 
  Key,
  Settings,
  CheckCircle,
  Copy,
  ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";

const apiFeatures = [
  {
    icon: Code,
    title: "API RESTful",
    description: "API moderna e intuitiva com endpoints bem documentados",
    details: [
      "Autenticação JWT segura",
      "Rate limiting inteligente",
      "Respostas JSON consistentes",
      "Versionamento da API"
    ]
  },
  {
    icon: Webhook,
    title: "Webhooks",
    description: "Notificações em tempo real para eventos importantes",
    details: [
      "Eventos de pagamento",
      "Atualizações de status",
      "Retry automático",
      "Assinatura de segurança"
    ]
  },
  {
    icon: Shield,
    title: "Segurança",
    description: "Implementações de segurança de nível empresarial",
    details: [
      "OAuth 2.0 & JWT",
      "Criptografia end-to-end",
      "Whitelist de IPs",
      "Auditoria completa"
    ]
  },
  {
    icon: Terminal,
    title: "SDK & Bibliotecas",
    description: "Bibliotecas oficiais para diferentes linguagens",
    details: [
      "JavaScript/Node.js",
      "Python",
      "PHP",
      "C# .NET"
    ]
  }
];

const codeExamples = {
  javascript: `// Criar um pagamento
const payment = await kixicoPay.payments.create({
  amount: 5000, // 50.00 AOA
  currency: 'AOA',
  customer: {
    name: 'João Silva',
    email: 'joao@exemplo.com'
  },
  metadata: {
    order_id: 'ORD-123'
  }
});

console.log(payment.checkout_url);`,
  
  python: `# Criar um pagamento
payment = kixico_pay.Payment.create(
    amount=5000,  # 50.00 AOA
    currency='AOA',
    customer={
        'name': 'João Silva',
        'email': 'joao@exemplo.com'
    },
    metadata={
        'order_id': 'ORD-123'
    }
)

print(payment.checkout_url)`,

  php: `<?php
// Criar um pagamento
$payment = $kixicoPay->payments->create([
    'amount' => 5000, // 50.00 AOA
    'currency' => 'AOA',
    'customer' => [
        'name' => 'João Silva',
        'email' => 'joao@exemplo.com'
    ],
    'metadata' => [
        'order_id' => 'ORD-123'
    ]
]);

echo $payment->checkout_url;
?>`,

  curl: `curl -X POST https://api.kixicopay.com/v1/payments \\
  -H "Authorization: Bearer sk_test_..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 5000,
    "currency": "AOA",
    "customer": {
      "name": "João Silva",
      "email": "joao@exemplo.com"
    },
    "metadata": {
      "order_id": "ORD-123"
    }
  }'`
};

const quickStartSteps = [
  {
    step: "1",
    title: "Crie sua conta",
    description: "Registre-se gratuitamente e acesse o dashboard de desenvolvedores"
  },
  {
    step: "2", 
    title: "Obtenha suas chaves API",
    description: "Gere suas chaves de teste e produção no painel de controle"
  },
  {
    step: "3",
    title: "Faça sua primeira chamada",
    description: "Use nossa API para criar seu primeiro pagamento"
  },
  {
    step: "4",
    title: "Configure webhooks",
    description: "Receba notificações automáticas sobre mudanças de status"
  }
];

export default function Desenvolvedores() {
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState<string>("");

  const handleGetStarted = () => {
    navigate("/auth");
  };

  const copyToClipboard = (code: string, language: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(language);
    setTimeout(() => setCopiedCode(""), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-4">
                <Code className="w-4 h-4 mr-2" />
                API v1.0
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                Desenvolva com KixicoPay
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                APIs poderosas, documentação completa e ferramentas que facilitam 
                a integração de pagamentos em qualquer aplicação.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={handleGetStarted}>
                  <Key className="w-4 h-4 mr-2" />
                  Obter chaves API
                </Button>
                <Button size="lg" variant="outline">
                  <Book className="w-4 h-4 mr-2" />
                  Ver documentação
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Start */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Comece em minutos
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Siga estes passos simples para integrar pagamentos em sua aplicação
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickStartSteps.map((step, index) => (
                <Card key={index} className="text-center relative" variant="hover">
                  <CardHeader>
                    <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-lg">
                      {step.step}
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm">
                      {step.description}
                    </p>
                  </CardContent>
                  {index < quickStartSteps.length - 1 && (
                    <div className="hidden lg:block absolute -right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-6 h-0.5 bg-border"></div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Code Examples */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Exemplos de código
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Veja como é simples integrar nossa API em diferentes linguagens
              </p>
            </div>

            <Card className="max-w-4xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="w-5 h-5" />
                  Criar um pagamento
                </CardTitle>
                <CardDescription>
                  Exemplo básico de como criar um pagamento usando nossa API
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="javascript" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                    <TabsTrigger value="php">PHP</TabsTrigger>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                  </TabsList>
                  
                  {Object.entries(codeExamples).map(([language, code]) => (
                    <TabsContent key={language} value={language} className="mt-4">
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                          <code>{code}</code>
                        </pre>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() => copyToClipboard(code, language)}
                        >
                          {copiedCode === language ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* API Features */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Recursos da API
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tudo que você precisa para construir soluções de pagamento robustas
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {apiFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="h-full" variant="hover">
                    <CardHeader>
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                      <CardDescription className="text-base">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3">
                        {feature.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                            <span className="text-foreground">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Resources */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Recursos e ferramentas
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tudo que você precisa para desenvolver e testar suas integrações
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card variant="hover" className="cursor-pointer">
                <CardHeader>
                  <FileText className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Documentação da API</CardTitle>
                  <CardDescription>
                    Referência completa com todos os endpoints, parâmetros e exemplos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="p-0 h-auto">
                    Acessar docs <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card variant="hover" className="cursor-pointer">
                <CardHeader>
                  <Settings className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Ambiente Sandbox</CardTitle>
                  <CardDescription>
                    Teste suas integrações sem processar pagamentos reais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="p-0 h-auto">
                    Acessar sandbox <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card variant="hover" className="cursor-pointer">
                <CardHeader>
                  <Github className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Código exemplo</CardTitle>
                  <CardDescription>
                    Repositórios no GitHub com implementações completas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="p-0 h-auto">
                    Ver no GitHub <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card variant="hover" className="cursor-pointer">
                <CardHeader>
                  <Webhook className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Testador de Webhooks</CardTitle>
                  <CardDescription>
                    Ferramenta para testar e debugar seus webhooks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="p-0 h-auto">
                    Usar ferramenta <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card variant="hover" className="cursor-pointer">
                <CardHeader>
                  <Globe className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Status da API</CardTitle>
                  <CardDescription>
                    Monitore a disponibilidade e performance da nossa API
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="p-0 h-auto">
                    Ver status <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card variant="hover" className="cursor-pointer">
                <CardHeader>
                  <Zap className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Postman Collection</CardTitle>
                  <CardDescription>
                    Coleção completa para testar a API no Postman
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="p-0 h-auto">
                    Download <ExternalLink className="w-4 h-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-primary">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Pronto para começar a desenvolver?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Junte-se a centenas de desenvolvedores que já estão construindo 
              soluções incríveis com nossa API.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={handleGetStarted}
              >
                <Key className="w-4 h-4 mr-2" />
                Obter chaves API
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-primary"
              >
                <Book className="w-4 h-4 mr-2" />
                Ler documentação
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}