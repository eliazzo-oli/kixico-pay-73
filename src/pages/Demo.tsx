import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CreditCard, Copy, Check, DollarSign, Users, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

const Demo = () => {
  const [productName, setProductName] = useState("Curso de Marketing Digital");
  const [productPrice, setProductPrice] = useState("50000");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const demoLink = `https://kixicopay.com/pay/${productName.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 6)}`;

  const copyLink = () => {
    navigator.clipboard.writeText(demoLink);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "O link de pagamento foi copiado para sua área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Demonstração Interativa
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Veja como é fácil criar um link de pagamento e começar a vender em segundos
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Left Column - Product Creation Demo */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Criar Produto
                  </CardTitle>
                  <CardDescription>
                    Experimente criar um produto de demonstração
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome do Produto</label>
                    <Input
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      placeholder="Digite o nome do produto"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Preço (AOA)</label>
                    <Input
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      placeholder="Digite o preço"
                      type="number"
                    />
                  </div>
                  
                  {/* Generated Link */}
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Link de Pagamento Gerado:</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 p-2 bg-background rounded border text-sm truncate">
                        {demoLink}
                      </div>
                      <Button size="sm" onClick={copyLink}>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dashboard Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Dashboard Preview</CardTitle>
                  <CardDescription>
                    Veja como seria seu dashboard após algumas vendas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <DollarSign className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">125.000</p>
                      <p className="text-sm text-muted-foreground">AOA vendidos</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">12</p>
                      <p className="text-sm text-muted-foreground">Clientes</p>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-lg">
                      <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                      <p className="text-2xl font-bold">8</p>
                      <p className="text-sm text-muted-foreground">Produtos</p>
                    </div>
                  </div>
                  
                  {/* Recent Transactions */}
                  <div>
                    <h4 className="font-medium mb-3">Vendas Recentes</h4>
                    <div className="space-y-2">
                      {[
                        { product: "Curso de Marketing Digital", amount: "50.000 AOA", status: "Pago" },
                        { product: "E-book de Vendas", amount: "15.000 AOA", status: "Pago" },
                        { product: "Consultoria 1h", amount: "60.000 AOA", status: "Pendente" }
                      ].map((transaction, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <div>
                            <p className="font-medium text-sm">{transaction.product}</p>
                            <p className="text-xs text-muted-foreground">{transaction.amount}</p>
                          </div>
                          <Badge variant={transaction.status === "Pago" ? "default" : "secondary"}>
                            {transaction.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Payment Page Preview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preview da Página de Pagamento</CardTitle>
                  <CardDescription>
                    Como seus clientes verão a página de checkout
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-6 bg-muted/50">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2">{productName}</h3>
                      <p className="text-3xl font-bold text-primary">
                        {parseInt(productPrice).toLocaleString('pt-AO')} AOA
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Nome Completo</label>
                        <Input placeholder="Digite seu nome" disabled />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input placeholder="seu@email.com" disabled />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Telefone</label>
                        <Input placeholder="+244 900 000 000" disabled />
                      </div>
                      
                      <Button className="w-full" size="lg" disabled>
                        Finalizar Compra
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      
                      <div className="text-center text-xs text-muted-foreground">
                        🔒 Pagamento 100% seguro
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features Highlight */}
              <Card>
                <CardHeader>
                  <CardTitle>Por que escolher KixicoPay?</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Saques Instantâneos</p>
                        <p className="text-sm text-muted-foreground">
                          Receba seus pagamentos em segundos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Taxas Competitivas</p>
                        <p className="text-sm text-muted-foreground">
                          As menores taxas do mercado angolano
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium">Suporte 24/7</p>
                        <p className="text-sm text-muted-foreground">
                          Estamos sempre aqui para ajudar
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center mt-12">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h3 className="text-2xl font-bold mb-4">
                  Pronto para começar a vender?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Crie sua conta gratuita e comece a receber pagamentos hoje mesmo
                </p>
                <Button variant="gradient" size="lg" asChild>
                  <a href="/auth">
                    Criar Conta Gratuita
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Demo;