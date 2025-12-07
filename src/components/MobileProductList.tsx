import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Edit2, Eye, Share2, Trash2 } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  status: 'active' | 'inactive';
  sales: number;
  revenue: number;
  created_at: string;
  description?: string;
}

interface MobileProductListProps {
  products: Product[];
  onToggleStatus: (id: string) => void;
  onEdit: (product: Product) => void;
  onView: (product: Product) => void;
  onCopyLink: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  formatPrice: (price: number) => string;
}

export function MobileProductList({
  products,
  onToggleStatus,
  onEdit,
  onView,
  onCopyLink,
  onDelete,
  formatPrice
}: MobileProductListProps) {
  if (products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <div 
          key={product.id} 
          className="bg-card border border-border/50 rounded-xl p-4 space-y-3"
        >
          {/* Header: Name and Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm truncate">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {product.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge 
                variant={product.status === 'active' ? 'default' : 'secondary'}
                className="text-[10px] px-2 py-0.5"
              >
                {product.status === 'active' ? 'Ativo' : 'Inativo'}
              </Badge>
              <Switch
                checked={product.status === 'active'}
                onCheckedChange={() => onToggleStatus(product.id)}
                className="scale-75"
              />
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/30">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Preço</p>
              <p className="text-sm font-semibold text-foreground">{formatPrice(product.price)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Vendas</p>
              <p className="text-sm font-semibold text-foreground">{product.sales}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Receita</p>
              <p className="text-sm font-semibold text-foreground">{formatPrice(product.revenue)}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCopyLink(product.id, product.name)}
              className="flex-1 h-8 text-xs"
            >
              <Share2 className="h-3 w-3 mr-1.5" />
              Link
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(product)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(product)}
              className="h-8 w-8 p-0"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
