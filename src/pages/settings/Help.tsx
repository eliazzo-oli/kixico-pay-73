import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { MessageCircle, Mail, Phone, FileText, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const faqItems = [
  {
    question: "Como funciona o sistema de pagamentos?",
    answer: "Nosso sistema processa pagamentos de forma segura através de gateways certificados. Os valores são creditados na sua carteira após a confirmação do pagamento."
  },
  {
    question: "Quando posso sacar meus valores?",
    answer: "Você pode solicitar saques a partir de Kz 50,00. Os saques são processados em até 24 horas para contas correntes."
  },
  {
    question: "Como criar um novo produto?",
    answer: "Acesse a seção 'Meus Produtos' no dashboard e clique em 'Novo Produto'. Preencha as informações necessárias e publique seu produto."
  },
  {
    question: "Posso alterar os dados da minha conta?",
    answer: "Sim, você pode alterar seus dados pessoais e financeiros na seção 'Configurações' a qualquer momento."
  }
];

export default function Help() {
  const navigate = useNavigate();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Central de ajuda</h2>
          <p className="text-muted-foreground">
            Encontre respostas para suas dúvidas ou entre em contato conosco.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          Voltar ao início
        </Button>
      </div>

      <Separator />

      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="text-center">
            <CardContent className="p-6">
              <MessageCircle className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-medium mb-2">Chat ao vivo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fale conosco em tempo real
              </p>
              <Button size="sm" className="w-full">Iniciar chat</Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Mail className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-medium mb-2">Email</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Envie uma mensagem
              </p>
              <Button size="sm" variant="outline" className="w-full">
                contato@kixicopay.com
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Phone className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-medium mb-2">Telefone</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ligue para o suporte
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('https://wa.me/244933277739', '_blank')}
              >
                +244 933 277 739
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <FileText className="w-8 h-8 mx-auto mb-3 text-primary" />
              <h3 className="font-medium mb-2">Documentação</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Guias e tutoriais
              </p>
              <Button size="sm" variant="outline" className="w-full">Ver docs</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Perguntas frequentes</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger>{item.question}</AccordionTrigger>
                  <AccordionContent>
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}