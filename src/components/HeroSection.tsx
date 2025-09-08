import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-primary overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="KixicoPay - Plataforma de Pagamentos para Angola"
          className="w-full h-full object-cover opacity-20 optimized-image"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-primary/90"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="block">Pagamentos</span>
            <span className="block text-white">
              Rápidos e Seguros
            </span>
            <span className="block">para Angola</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/80 max-w-3xl mx-auto leading-relaxed">
            Elimine saques lentos e taxas altas. A KixicoPay oferece a solução completa 
            de pagamentos que os empreendedores angolanos precisam para crescer.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="hero-white" size="xl" className="group" asChild>
              <a href="/auth">
                Começar Agora
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button variant="hero-white" size="xl" asChild>
              <a href="/demo">
                Ver Demo
              </a>
            </Button>
          </div>
          
          {/* Professional Image */}
          <div className="mb-12">
            <div className="max-w-md mx-auto">
              <img 
                src="/lovable-uploads/14c77df0-4c22-4142-9c93-e7fe05942046.png"
                alt="Profissional angolana usando tecnologia KixicoPay para pagamentos"
                className="w-full h-auto rounded-2xl shadow-2xl object-cover animate-fade-in hover:scale-105 transition-transform duration-500 image-float optimized-image"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>

          {/* Features Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white rounded-xl p-6 border border-primary/20">
              <Zap className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2 text-primary">Saques Instantâneos</h3>
              <p className="text-primary/80">Receba seus pagamentos em segundos, não em dias.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-primary/20">
              <Shield className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2 text-primary">Taxas Reduzidas</h3>
              <p className="text-primary/80">As menores taxas do mercado angolano.</p>
            </div>
            
            <div className="bg-white rounded-xl p-6 border border-primary/20">
              <TrendingUp className="h-12 w-12 text-primary mb-4 mx-auto" />
              <h3 className="text-xl font-semibold mb-2 text-primary">Crescimento Garantido</h3>
              <p className="text-primary/80">Ferramentas que impulsionam seu negócio.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
      </div>
    </section>
  );
}