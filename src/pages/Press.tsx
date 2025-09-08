import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Newspaper,
  Download,
  Calendar,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  Users,
  Award,
  TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const pressReleases = [
  {
    date: "2024-03-15",
    title: "KixicoPay alcança marca de 50M AOA processados mensalmente",
    description: "A fintech angolana consolida-se como líder em pagamentos digitais locais",
    category: "Milestone",
    readTime: "3 min"
  },
  {
    date: "2024-02-28",
    title: "Nova funcionalidade: Links de Pagamento Personalizados",
    description: "Empreendedores agora podem criar links de pagamento únicos para seus produtos",
    category: "Produto",
    readTime: "2 min"
  },
  {
    date: "2024-01-20",
    title: "KixicoPay expande suporte para Multicaixa Express",
    description: "Integração com o principal meio de pagamento angolano amplia acessibilidade",
    category: "Parceria",
    readTime: "4 min"
  },
  {
    date: "2023-12-10",
    title: "Prêmio de Melhor Fintech Angolana de 2023",
    description: "Reconhecimento pela inovação e impacto no ecossistema digital angolano",
    category: "Prêmio",
    readTime: "3 min"
  }
];

const mediaKit = [
  {
    type: "Logo",
    icon: ImageIcon,
    description: "Logos oficiais em alta resolução",
    formats: "PNG, SVG, EPS"
  },
  {
    type: "Screenshots",
    icon: ImageIcon,
    description: "Capturas de tela da plataforma",
    formats: "PNG, JPG"
  },
  {
    type: "Fact Sheet",
    icon: FileText,
    description: "Dados e informações da empresa",
    formats: "PDF"
  },
  {
    type: "Fotos da Equipe",
    icon: Users,
    description: "Fotos profissionais da liderança",
    formats: "JPG, PNG"
  }
];

const achievements = [
  {
    year: "2024",
    title: "50M AOA Processados Mensalmente",
    description: "Alcançamos a marca de 50 milhões de kwanzas processados por mês"
  },
  {
    year: "2024",
    title: "10.000+ Usuários Ativos",
    description: "Mais de dez mil empreendedores confiam na nossa plataforma"
  },
  {
    year: "2023",
    title: "Melhor Fintech Angolana",
    description: "Prêmio de reconhecimento pela inovação no setor financeiro"
  },
  {
    year: "2023",
    title: "Integração Multicaixa",
    description: "Primeira fintech a integrar completamente com Multicaixa Express"
  }
];

export default function Press() {
  const navigate = useNavigate();
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-AO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Milestone': return 'bg-green-100 text-green-800';
      case 'Produto': return 'bg-blue-100 text-blue-800';
      case 'Parceria': return 'bg-purple-100 text-purple-800';
      case 'Prêmio': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-full">
              <Newspaper className="w-12 h-12 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Sala de Imprensa
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Acompanhe as últimas novidades do KixicoPay, conquistas da empresa 
            e recursos para jornalistas e mídia.
          </p>
          <Button 
            size="lg"
            onClick={() => window.open('mailto:imprensa@kixicopay.ao')}
          >
            Contato para Imprensa
          </Button>
        </div>

        {/* Press Releases */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Comunicados de Imprensa
          </h2>
          <div className="space-y-6">
            {pressReleases.map((release, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <Badge className={getCategoryColor(release.category)}>
                          {release.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(release.date)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {release.readTime} de leitura
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-foreground">
                        {release.title}
                      </h3>
                      <p className="text-muted-foreground">
                        {release.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ler Mais
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Achievements */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Conquistas e Marcos
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievements.map((achievement, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {achievement.year}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2 text-foreground">
                        {achievement.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Media Kit */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Kit de Mídia
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mediaKit.map((item, index) => (
              <Card key={index} className="text-center">
                <CardContent className="p-6">
                  <item.icon className="w-10 h-10 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold mb-2 text-foreground">{item.type}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                  <p className="text-xs text-muted-foreground mb-4">{item.formats}</p>
                  <Button size="sm" variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Baixar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Company Info */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                Sobre o KixicoPay
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose max-w-none">
                <p className="text-muted-foreground mb-4">
                  O KixicoPay é uma fintech angolana fundada em 2019 com a missão de 
                  democratizar o acesso a soluções de pagamento digital em Angola. 
                  A empresa oferece uma plataforma completa que permite a empreendedores 
                  locais vender produtos e serviços online de forma simples e segura.
                </p>
                <p className="text-muted-foreground mb-4">
                  Com mais de 10.000 usuários ativos e processando mais de 50 milhões 
                  de kwanzas mensalmente, o KixicoPay se consolidou como uma das principais 
                  soluções de pagamento digital do país.
                </p>
                <p className="text-muted-foreground">
                  A plataforma integra os principais meios de pagamento angolanos, 
                  incluindo Multicaixa Express, Unitel Money e PayPal AO, oferecendo 
                  uma experiência completa tanto para vendedores quanto para compradores.
                </p>
              </div>
              
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">10,000+</div>
                  <div className="text-sm text-muted-foreground">Usuários Ativos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">50M AOA</div>
                  <div className="text-sm text-muted-foreground">Processados/Mês</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary mb-2">5 Anos</div>
                  <div className="text-sm text-muted-foreground">No Mercado</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              Contato para Imprensa
            </h3>
            <p className="text-muted-foreground mb-6">
              Para entrevistas, informações adicionais ou solicitações de mídia
            </p>
            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p>Email: imprensa@kixicopay.ao</p>
              <p>Telefone: +244 933 277 739</p>
              <p>Horário: Segunda a Sexta, 8h às 17h</p>
            </div>
            <Button 
              size="lg"
              onClick={() => window.open('mailto:imprensa@kixicopay.ao')}
            >
              Entrar em Contato
            </Button>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}