import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Shield, Code, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function WebhookDocumentation() {
  const { toast } = useToast();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copiado!',
        description: `${label} copiado para a área de transferência`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao copiar para a área de transferência',
        variant: 'destructive',
      });
    }
  };

  const examplePayload = `{
  "id": "evt_12345ABCDE",
  "event_type": "pagamento.sucedido",
  "api_version": "2025-09-02",
  "created_at": "1725273842",
  "data": {
    "object": {
      "id_pagamento": "pay_67890FGHIJ",
      "referencia": "KIXICOPAY-001",
      "montante": 2500.00,
      "moeda": "AOA",
      "status": "sucedido",
      "metodo_pagamento": "cartao_credito",
      "produto": {
        "nome": "Produto Premium",
        "preco": 2500.00
      },
      "cliente": {
        "nome": "José dos Santos",
        "email": "jose.santos@email.com"
      },
      "created_at": "2025-09-14T10:30:00Z",
      "updated_at": "2025-09-14T10:35:00Z"
    }
  }
}`;

  const nodeJsExample = `const crypto = require('crypto');

function verifyWebhookSignature(body, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('hex');
  
  const expectedSignatureWithPrefix = \`sha256=\${expectedSignature}\`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignatureWithPrefix)
  );
}

// Exemplo de uso no Express.js
app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['kixicopay-signature'];
  const secret = 'whsec_your_webhook_secret_here';
  
  if (!verifyWebhookSignature(req.body, signature, secret)) {
    return res.status(401).send('Unauthorized');
  }
  
  const event = JSON.parse(req.body);
  
  switch (event.event_type) {
    case 'pagamento.sucedido':
      // Processar pagamento bem-sucedido
      console.log('Pagamento sucedido:', event.data.object);
      break;
    case 'pagamento.falhado':
      // Processar pagamento falhado
      console.log('Pagamento falhado:', event.data.object);
      break;
    default:
      console.log('Evento não reconhecido:', event.event_type);
  }
  
  res.status(200).send('OK');
});`;

  const phpExample = `<?php
function verifyWebhookSignature($body, $signature, $secret) {
    $expectedSignature = 'sha256=' . hash_hmac('sha256', $body, $secret);
    return hash_equals($signature, $expectedSignature);
}

// Exemplo de uso
$body = file_get_contents('php://input');
$signature = $_SERVER['HTTP_KIXICOPAY_SIGNATURE'];
$secret = 'whsec_your_webhook_secret_here';

if (!verifyWebhookSignature($body, $signature, $secret)) {
    http_response_code(401);
    exit('Unauthorized');
}

$event = json_decode($body, true);

switch ($event['event_type']) {
    case 'pagamento.sucedido':
        // Processar pagamento bem-sucedido
        error_log('Pagamento sucedido: ' . $event['data']['object']['id_pagamento']);
        break;
    case 'pagamento.falhado':
        // Processar pagamento falhado
        error_log('Pagamento falhado: ' . $event['data']['object']['id_pagamento']);
        break;
    default:
        error_log('Evento não reconhecido: ' . $event['event_type']);
}

http_response_code(200);
echo 'OK';
?>`;

  const pythonExample = `import hmac
import hashlib
import json
from flask import Flask, request

app = Flask(__name__)

def verify_webhook_signature(body, signature, secret):
    expected_signature = 'sha256=' + hmac.new(
        secret.encode('utf-8'),
        body.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(signature, expected_signature)

@app.route('/webhook', methods=['POST'])
def webhook():
    signature = request.headers.get('KixicoPay-Signature')
    secret = 'whsec_your_webhook_secret_here'
    body = request.get_data(as_text=True)
    
    if not verify_webhook_signature(body, signature, secret):
        return 'Unauthorized', 401
    
    event = json.loads(body)
    
    if event['event_type'] == 'pagamento.sucedido':
        # Processar pagamento bem-sucedido
        print(f"Pagamento sucedido: {event['data']['object']['id_pagamento']}")
    elif event['event_type'] == 'pagamento.falhado':
        # Processar pagamento falhado
        print(f"Pagamento falhado: {event['data']['object']['id_pagamento']}")
    else:
        print(f"Evento não reconhecido: {event['event_type']}")
    
    return 'OK', 200`;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Documentação de Webhooks
          </CardTitle>
          <CardDescription>
            Como integrar e verificar webhooks da KixicoPay no seu sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  Segurança HMAC-SHA256
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Todas as notificações são assinadas com HMAC-SHA256 para garantir autenticidade
              </CardContent>
            </Card>
            
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Retry Logic
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Retentativas automáticas com exponential backoff por até 24 horas
              </CardContent>
            </Card>
            
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Code className="h-4 w-4 text-blue-500" />
                  Timeout 30s
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Seu endpoint deve responder com HTTP 200 em até 30 segundos
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="payload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="payload">Estrutura do Payload</TabsTrigger>
          <TabsTrigger value="nodejs">Node.js</TabsTrigger>
          <TabsTrigger value="php">PHP</TabsTrigger>
          <TabsTrigger value="python">Python</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Estrutura do Payload JSON</CardTitle>
              <CardDescription>
                Formato padrão para todos os eventos de webhook
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Cabeçalhos HTTP</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <code>Content-Type:</code>
                        <Badge variant="outline">application/json</Badge>
                      </div>
                      <div className="flex justify-between">
                        <code>KixicoPay-Signature:</code>
                        <Badge variant="outline">sha256=...</Badge>
                      </div>
                      <div className="flex justify-between">
                        <code>User-Agent:</code>
                        <Badge variant="outline">KixicoPay-Webhooks/1.0</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Tipos de Eventos</h4>
                    <div className="space-y-2">
                      <Badge variant="default" className="text-xs">
                        pagamento.sucedido
                      </Badge>
                      <Badge variant="destructive" className="text-xs">
                        pagamento.falhado
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        pagamento.pendente
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="bg-muted rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary">Exemplo de Payload</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(examplePayload, 'Payload de exemplo')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <pre className="text-sm overflow-x-auto">
                    <code>{examplePayload}</code>
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="nodejs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Implementação Node.js</CardTitle>
              <CardDescription>
                Como verificar webhooks usando Express.js e crypto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">server.js</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(nodeJsExample, 'Código Node.js')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="text-sm overflow-x-auto">
                  <code>{nodeJsExample}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="php" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Implementação PHP</CardTitle>
              <CardDescription>
                Como verificar webhooks usando PHP puro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">webhook.php</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(phpExample, 'Código PHP')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="text-sm overflow-x-auto">
                  <code>{phpExample}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="python" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Implementação Python</CardTitle>
              <CardDescription>
                Como verificar webhooks usando Flask
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary">app.py</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(pythonExample, 'Código Python')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <pre className="text-sm overflow-x-auto">
                  <code>{pythonExample}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-orange-800 dark:text-orange-200">
            <AlertTriangle className="h-5 w-5" />
            Importante - Melhores Práticas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-orange-700 dark:text-orange-300">
          <p>• <strong>Sempre verifique a assinatura HMAC</strong> antes de processar o evento</p>
          <p>• <strong>Responda com HTTP 200</strong> para confirmar o recebimento</p>
          <p>• <strong>Implemente idempotência</strong> - o mesmo evento pode ser enviado múltiplas vezes</p>
          <p>• <strong>Use HTTPS</strong> para o seu endpoint de webhook</p>
          <p>• <strong>Processe eventos de forma assíncrona</strong> para evitar timeouts</p>
          <p>• <strong>Monitore logs</strong> para detectar falhas de entrega</p>
        </CardContent>
      </Card>
    </div>
  );
}