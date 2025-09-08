import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code2,
  Key,
  Shield,
  Zap,
  Book,
  Terminal,
  Globe,
  CheckCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const apiFeatures = [
  {
    icon: Zap,
    title: "Pagamentos Instantâneos",
    description: "Processe pagamentos em tempo real com nossa API"
  },
  {
    icon: Shield,
    title: "Segurança Máxima",
    description: "Criptografia de ponta a ponta e compliance PCI DSS"
  },
  {
    icon: Globe,
    title: "RESTful API",
    description: "Interface REST simples e intuitiva"
  },
  {
    icon: Key,
    title: "Autenticação JWT",
    description: "Sistema de autenticação seguro baseado em tokens"
  }
];

const endpoints = [
  {
    method: "POST",
    path: "/api/v1/payments",
    description: "Criar novo pagamento",
    auth: true
  },
  {
    method: "GET",
    path: "/api/v1/payments/:id",
    description: "Consultar status do pagamento",
    auth: true
  },
  {
    method: "POST",
    path: "/api/v1/payment-links",
    description: "Criar link de pagamento",
    auth: true
  },
  {
    method: "GET",
    path: "/api/v1/transactions",
    description: "Listar transações",
    auth: true
  },
  {
    method: "POST",
    path: "/api/v1/webhooks",
    description: "Configurar webhooks",
    auth: true
  }
];

const codeExamples = {
  payment: `curl -X POST https://api.kixicopay.ao/v1/payments \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 25000,
    "currency": "AOA",
    "description": "Consultoria de Marketing",
    "customer": {
      "name": "João Silva",
      "email": "joao@email.com"
    },
    "payment_methods": ["multicaixa", "unitel_money"],
    "return_url": "https://seusite.com/sucesso",
    "cancel_url": "https://seusite.com/cancelado"
  }'`,
  
  response: `{
  "id": "pay_1234567890",
  "status": "pending",
  "amount": 25000,
  "currency": "AOA",
  "description": "Consultoria de Marketing",
  "checkout_url": "https://checkout.kixicopay.ao/pay_1234567890",
  "expires_at": "2024-03-15T10:30:00Z",
  "created_at": "2024-03-15T10:00:00Z"
}`,

  webhook: `{
  "event": "payment.completed",
  "data": {
    "id": "pay_1234567890",
    "status": "completed",
    "amount": 25000,
    "currency": "AOA",
    "customer": {
      "name": "João Silva",
      "email": "joao@email.com"
    },
    "payment_method": "multicaixa",
    "completed_at": "2024-03-15T10:15:00Z"
  }
}`
};

const sdks = [
  {
    language: "PHP",
    icon: "🐘",
    install: "composer require kixicopay/php-sdk",
    example: `$kixicopay = new KixicoPay('your-api-key');
$payment = $kixicopay->createPayment([
    'amount' => 25000,
    'description' => 'Produto XYZ'
]);`
  },
  {
    language: "Node.js",
    icon: "🟢",
    install: "npm install @kixicopay/node-sdk",
    example: `const KixicoPay = require('@kixicopay/node-sdk');
const client = new KixicoPay('your-api-key');
const payment = await client.createPayment({
    amount: 25000,
    description: 'Produto XYZ'
});`
  },
  {
    language: "Python",
    icon: "🐍",
    install: "pip install kixicopay-python",
    example: `import kixicopay
client = kixicopay.Client('your-api-key')
payment = client.create_payment(
    amount=25000,
    description='Produto XYZ'
)`
  }
];

export default function ApiDocumentation() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Code2 className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            API de Pagamentos
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Integre pagamentos diretamente em sua aplicação com nossa API RESTful. 
            Simples, segura e poderosa.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/auth')}
            >
              <Key className="w-4 h-4 mr-2" />
              Obter API Key
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => window.open('https://docs.kixicopay.ao', '_blank')}
            >
              <Book className="w-4 h-4 mr-2" />
              Documentação Completa
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Por Que Escolher Nossa API?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {apiFeatures.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <feature.icon className="w-10 h-10 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Start */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                <Terminal className="w-6 h-6 inline mr-2" />
                Início Rápido
              </CardTitle>
              <p className="text-center text-muted-foreground">
                Faça seu primeiro pagamento em 5 minutos
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <Tabs defaultValue="create" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="create">1. Criar Pagamento</TabsTrigger>
                  <TabsTrigger value="response">2. Resposta</TabsTrigger>
                  <TabsTrigger value="webhook">3. Webhook</TabsTrigger>
                </TabsList>
                
                <TabsContent value="create" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Criar um Pagamento</h3>
                    <p className="text-muted-foreground">
                      Use este endpoint para criar um novo pagamento:
                    </p>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">cURL</Badge>
                        <Button size="sm" variant="ghost">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <pre className="text-sm overflow-x-auto">
                        <code>{codeExamples.payment}</code>
                      </pre>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="response" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Resposta da API</h3>
                    <p className="text-muted-foreground">
                      A API retornará os dados do pagamento criado:
                    </p>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">JSON Response</Badge>
                        <Button size="sm" variant="ghost">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <pre className="text-sm overflow-x-auto">
                        <code>{codeExamples.response}</code>
                      </pre>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="webhook" className="mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Webhook de Confirmação</h3>
                    <p className="text-muted-foreground">
                      Quando o pagamento for completado, você receberá:
                    </p>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">Webhook Payload</Badge>
                        <Button size="sm" variant="ghost">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <pre className="text-sm overflow-x-auto">
                        <code>{codeExamples.webhook}</code>
                      </pre>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Endpoints */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Endpoints Principais
          </h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {endpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant={endpoint.method === 'GET' ? 'secondary' : 'default'}
                        className="font-mono"
                      >
                        {endpoint.method}
                      </Badge>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {endpoint.path}
                      </code>
                      <span className="text-sm text-muted-foreground">
                        {endpoint.description}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {endpoint.auth && (
                        <Badge variant="outline" className="text-xs">
                          <Key className="w-3 h-3 mr-1" />
                          Auth
                        </Badge>
                      )}
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SDKs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            SDKs Oficiais
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sdks.map((sdk, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{sdk.icon}</span>
                    {sdk.language}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Instalação:</h4>
                    <div className="bg-muted rounded p-2">
                      <code className="text-sm">{sdk.install}</code>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Exemplo:</h4>
                    <div className="bg-muted rounded p-2">
                      <pre className="text-xs overflow-x-auto">
                        <code>{sdk.example}</code>
                      </pre>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Documentação
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Preços da API
          </h2>
          <div className="max-w-lg mx-auto">
            <Card className="border-primary/50 shadow-lg">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">API de Pagamentos</CardTitle>
                <div className="text-3xl font-bold text-primary">
                  2,5% <span className="text-base font-normal text-muted-foreground">por transação</span>
                </div>
                <p className="text-muted-foreground">Sem taxas de setup ou mensalidades</p>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Requisições ilimitadas</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Webhooks em tempo real</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">SDKs oficiais</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Suporte técnico 24/7</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-sm">Dashboard completo</span>
                  </li>
                </ul>
                <Button 
                  className="w-full"
                  size="lg"
                  onClick={() => navigate('/auth')}
                >
                  Começar Agora
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Pronto para Integrar?
            </h3>
            <p className="text-muted-foreground mb-6">
              Comece a aceitar pagamentos em sua aplicação hoje mesmo
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/auth')}
              >
                <Key className="w-4 h-4 mr-2" />
                Criar Conta de Desenvolvedor
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/suporte')}
              >
                Falar com Especialista
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}