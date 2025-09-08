import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  FileText, 
  Home, 
  Clock, 
  Shield, 
  Users,
  Headphones,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
  },
  {
    question: "Quais são as taxas do KixicoPay?",
    answer: "Cobramos apenas uma pequena taxa por transação processada. Confira nossa página de preços para mais detalhes sobre os planos disponíveis."
  },
  {
    question: "Como funciona a segurança dos pagamentos?",
    answer: "Utilizamos criptografia de nível bancário e seguimos as melhores práticas de segurança da indústria para proteger todas as transações."
  }
];

const supportFeatures = [
  {
    icon: Clock,
    title: "Suporte 24/7",
    description: "Nossa equipe está disponível 24 horas por dia, 7 dias por semana para te ajudar."
  },
  {
    icon: Users,
    title: "Equipe Especializada",
    description: "Profissionais experientes em pagamentos digitais e tecnologia financeira."
  },
  {
    icon: Shield,
    title: "Atendimento Seguro",
    description: "Todas as comunicações são protegidas e seus dados mantidos em sigilo."
  },
  {
    icon: CheckCircle,
    title: "Resolução Rápida",
    description: "Tempo médio de resposta inferior a 5 minutos para questões urgentes."
  }
];

export default function Support() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Headphones className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Central de Suporte
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Estamos aqui para ajudar você a ter a melhor experiência com o KixicoPay. 
            Encontre respostas ou entre em contato conosco.
          </p>
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Voltar ao início
          </Button>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <MessageCircle className="w-10 h-10 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2 text-foreground">Chat ao Vivo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fale conosco em tempo real
              </p>
              <Button size="sm" className="w-full">
                Iniciar Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Phone className="w-10 h-10 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2 text-foreground">WhatsApp</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Atendimento via WhatsApp
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

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <Mail className="w-10 h-10 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2 text-foreground">Email</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Envie uma mensagem
              </p>
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full"
                onClick={() => window.open('mailto:contato@kixicopay.ao')}
              >
                contato@kixicopay.ao
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <FileText className="w-10 h-10 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2 text-foreground">Documentação</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Guias e tutoriais
              </p>
              <Button size="sm" variant="outline" className="w-full">
                Ver Documentação
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Support Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Por que escolher nosso suporte?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportFeatures.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <feature.icon className="w-8 h-8 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Professional Support Image */}
        <div className="mb-16">
          <div className="max-w-4xl mx-auto">
            <img 
              src="/lovable-uploads/a48936b2-da54-45ae-953f-8ee9a92ccf2a.png"
              alt="Profissional de suporte atendendo clientes com dedicação"
              className="w-full h-auto rounded-2xl shadow-lg object-cover"
            />
          </div>
        </div>

        {/* FAQ Section */}
        <Card className="mb-16">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Perguntas Frequentes
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Encontre respostas rápidas para as dúvidas mais comuns
            </p>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Não encontrou o que procurava?
            </h3>
            <p className="text-muted-foreground mb-6">
              Nossa equipe de suporte está pronta para ajudar você com qualquer questão
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => window.open('https://wa.me/244933277739', '_blank')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Falar no WhatsApp
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => window.open('mailto:contato@kixicopay.ao')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Enviar Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}