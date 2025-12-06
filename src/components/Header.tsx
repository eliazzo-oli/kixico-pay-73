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
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-3 md:px-4">
        <div className="flex items-center justify-between h-12 md:h-14">
          {/* Logo */}
          <button 
            onClick={handleLogoClick}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img 
              src={kixicoPayLogo} 
              alt="KixicoPay" 
              className="h-16 md:h-24 w-auto logo-animated optimized-image"
              loading="eager"
              decoding="async"
            />
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/produtos" className="text-sm text-foreground hover:text-primary transition-colors">Produtos</a>
            <a href="/precos" className="text-sm text-foreground hover:text-primary transition-colors">Preços</a>
            <a href="/desenvolvedores" className="text-sm text-foreground hover:text-primary transition-colors">Desenvolvedores</a>
            <a href="/suporte" className="text-sm text-foreground hover:text-primary transition-colors">Suporte</a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Button variant="ghost" size="sm" asChild>
              <a href="/auth">Entrar</a>
            </Button>
            <Button variant="default" size="sm" asChild>
              <a href="/auth">Criar Conta</a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-1.5"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-3 border-t border-border">
            <nav className="flex flex-col space-y-3">
              <a href="/produtos" className="text-sm text-foreground hover:text-primary transition-colors">Produtos</a>
              <a href="/precos" className="text-sm text-foreground hover:text-primary transition-colors">Preços</a>
              <a href="/desenvolvedores" className="text-sm text-foreground hover:text-primary transition-colors">Desenvolvedores</a>
              <a href="/suporte" className="text-sm text-foreground hover:text-primary transition-colors">Suporte</a>
              <div className="flex flex-col space-y-2 pt-3">
                <Button variant="ghost" size="sm" className="w-full justify-center" asChild>
                  <a href="/auth">Entrar</a>
                </Button>
                <Button variant="default" size="sm" className="w-full justify-center" asChild>
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