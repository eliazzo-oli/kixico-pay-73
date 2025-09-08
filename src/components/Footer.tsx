import { CreditCard, Mail, Phone, MapPin } from "lucide-react";
import kixicoPayLogo from "/lovable-uploads/9a0e296b-bc4f-460b-9e96-40c29ccfbe47.png";

export default function Footer() {
  return (
    <footer className="bg-foreground text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center mb-4">
              <img 
                src="/lovable-uploads/ffa0f8a8-7a80-42b7-a356-912c53a24003.png" 
                alt="KixicoPay" 
                className="h-36 w-auto"
              />
            </div>
            <p className="text-gray-300 mb-4">
              A plataforma de pagamentos feita especialmente para empreendedores angolanos.
            </p>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                contato@kixicopay.ao
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                +244 933 277 739
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Luanda, Angola
              </div>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-4">Produtos</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="/checkout" className="hover:text-white transition-colors">Checkout</a></li>
              <li><a href="/links-pagamento" className="hover:text-white transition-colors">Links de Pagamento</a></li>
              <li><a href="/api" className="hover:text-white transition-colors">API de Pagamentos</a></li>
              <li><a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Suporte</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="/suporte" className="hover:text-white transition-colors">Central de Ajuda</a></li>
              <li><a href="/suporte" className="hover:text-white transition-colors">Documentação</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Status do Sistema</a></li>
              <li><a href="/suporte" className="hover:text-white transition-colors">Contato</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2 text-gray-300">
              <li><a href="/sobre" className="hover:text-white transition-colors">Sobre Nós</a></li>
              <li><a href="/carreiras" className="hover:text-white transition-colors">Carreiras</a></li>
              <li><a href="/imprensa" className="hover:text-white transition-colors">Imprensa</a></li>
              <li><a href="/parceiros" className="hover:text-white transition-colors">Parceiros</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © 2025 KixicoPay. Todos os direitos reservados.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                Política de Privacidade
              </a>
              <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">
                Cookies
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}