import { Button } from "@/components/ui/button";
import { CreditCard, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import kixicoPayLogo from "/lovable-uploads/aaa7ebd4-937a-41c9-ab8e-25102e62b1ed.png";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img 
              src={kixicoPayLogo} 
              alt="KixicoPay" 
              className="h-32 w-auto logo-animated optimized-image"
              loading="eager"
              decoding="async"
            />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/produtos" className="text-foreground hover:text-primary transition-colors">Produtos</a>
            <a href="/precos" className="text-foreground hover:text-primary transition-colors">Preços</a>
            <a href="/desenvolvedores" className="text-foreground hover:text-primary transition-colors">Desenvolvedores</a>
            <a href="/suporte" className="text-foreground hover:text-primary transition-colors">Suporte</a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <a href="/auth">Entrar</a>
            </Button>
            <Button variant="gradient" asChild>
              <a href="/auth">Criar Conta</a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col space-y-4">
              <a href="/produtos" className="text-foreground hover:text-primary transition-colors">Produtos</a>
              <a href="/precos" className="text-foreground hover:text-primary transition-colors">Preços</a>
              <a href="/desenvolvedores" className="text-foreground hover:text-primary transition-colors">Desenvolvedores</a>
              <a href="/suporte" className="text-foreground hover:text-primary transition-colors">Suporte</a>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="ghost" className="w-full" asChild>
                  <a href="/auth">Entrar</a>
                </Button>
                <Button variant="gradient" className="w-full" asChild>
                  <a href="/auth">Criar Conta</a>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}