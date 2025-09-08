import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";

export default function TestimonialSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Histórias de 
            <span className="text-primary ml-3">
              Sucesso
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Veja como empreendedores angolanos estão transformando seus negócios com a KixicoPay.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div>
            <img 
              src="/lovable-uploads/0bc37015-5f68-4520-abe1-c1e4b80184d4.png"
              alt="Empreendedora angolana bem-sucedida usando KixicoPay"
              className="w-full h-auto rounded-2xl shadow-lg object-cover"
            />
          </div>

          {/* Testimonial Content */}
          <div>
            <Card className="bg-white border-primary/20 shadow-lg">
              <CardContent className="p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-lg text-muted-foreground mb-6">
                  "A KixicoPay revolucionou meu negócio. Antes esperava dias para receber 
                  os pagamentos, agora é instantâneo. Minhas vendas aumentaram 60% em 3 meses!"
                </blockquote>
                <div className="mb-6">
                  <p className="font-semibold text-foreground">Maria Santos</p>
                  <p className="text-sm text-primary">Fundadora da LojaBela Angola</p>
                  <p className="text-sm text-muted-foreground">Luanda, Angola</p>
                </div>
                <div className="bg-primary/5 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong className="text-primary">Resultados em 90 dias:</strong>
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• +60% aumento nas vendas</li>
                    <li>• 0 segundos tempo de espera para pagamentos</li>
                    <li>• 50+ novos clientes mensais</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <Button variant="gradient" size="lg" className="group">
                <a href="/auth" className="flex items-center">
                  Comece Sua História de Sucesso
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}