import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, ExternalLink, ShoppingCart, FileText } from 'lucide-react';

interface ShareProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export function ShareProductModal({ isOpen, onClose, productId, productName }: ShareProductModalProps) {
  const { toast } = useToast();
  const [copiedSalesPage, setCopiedSalesPage] = useState(false);
  const [copiedCheckout, setCopiedCheckout] = useState(false);

  const baseUrl = window.location.origin;
  const salesPageLink = `${baseUrl}/produto/${productId}`;
  const checkoutLink = `${baseUrl}/checkout?id=${productId}`;

  const handleCopy = async (link: string, type: 'sales' | 'checkout') => {
    try {
      await navigator.clipboard.writeText(link);
      
      if (type === 'sales') {
        setCopiedSalesPage(true);
        setTimeout(() => setCopiedSalesPage(false), 2000);
      } else {
        setCopiedCheckout(true);
        setTimeout(() => setCopiedCheckout(false), 2000);
      }

      toast({
        title: 'Link copiado!',
        description: type === 'sales' 
          ? 'Link da página de vendas copiado.' 
          : 'Link de checkout direto copiado.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o link. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenLink = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Partilhar Produto</DialogTitle>
          <DialogDescription className="text-sm">
            Escolha o tipo de link para partilhar "{productName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Sales Page Link */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Página de Vendas</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Use este link para apresentar o produto ao cliente com todos os detalhes.
            </p>
            <div className="flex gap-2">
              <Input
                value={salesPageLink}
                readOnly
                className="text-xs h-9 bg-muted/50"
              />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 h-9 px-3"
                onClick={() => handleCopy(salesPageLink, 'sales')}
              >
                {copiedSalesPage ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-9 px-3"
                onClick={() => handleOpenLink(salesPageLink)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="border-t border-border/50" />

          {/* Checkout Direct Link */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-primary" />
              <Label className="text-sm font-medium">Checkout Direto</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Use este link para clientes que já estão prontos para pagar.
            </p>
            <div className="flex gap-2">
              <Input
                value={checkoutLink}
                readOnly
                className="text-xs h-9 bg-muted/50"
              />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 h-9 px-3"
                onClick={() => handleCopy(checkoutLink, 'checkout')}
              >
                {copiedCheckout ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 h-9 px-3"
                onClick={() => handleOpenLink(checkoutLink)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
