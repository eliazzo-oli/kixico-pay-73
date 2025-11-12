import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatPriceFromDB } from '@/lib/utils';
import { Plus, Trash2, Calendar, Users } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  value: number;
  expiry_date: string | null;
  usage_limit: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

interface CouponManagerProps {
  productId: string;
  productName: string;
}

export default function CouponManager({ productId, productName }: CouponManagerProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    value: '',
    expiry_date: '',
    usage_limit: ''
  });

  useEffect(() => {
    fetchCoupons();
  }, [productId]);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('manage-coupons', {
        body: { product_id: productId, action: 'get' }
      });

      if (error) throw error;

      setCoupons(data || []);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar cupões. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code.trim() || !formData.value) {
      toast({
        title: 'Erro',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    const numericValue = parseFloat(formData.value);
    if (isNaN(numericValue) || numericValue <= 0) {
      toast({
        title: 'Erro',
        description: 'Por favor, insira um valor válido.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.discount_type === 'percentage' && numericValue > 100) {
      toast({
        title: 'Erro',
        description: 'Percentagem de desconto não pode ser superior a 100%.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('manage-coupons', {
        body: {
          action: 'create',
          product_id: productId,
          code: formData.code.trim(),
          discount_type: formData.discount_type,
          value: numericValue,
          expiry_date: formData.expiry_date || null,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) {
        let errorMessage = 'Erro ao criar cupão. Tente novamente.';
        try {
          const ctxBody = (error as any)?.context?.body;
          if (ctxBody) {
            const parsed = typeof ctxBody === 'string' ? JSON.parse(ctxBody) : ctxBody;
            errorMessage = parsed.error || errorMessage;
          } else if ((error as any)?.data?.error) {
            errorMessage = (error as any).data.error;
          } else if ((error as any)?.message) {
            errorMessage = (error as any).message;
          }
        } catch {}

        toast({
          title: 'Erro ao Criar Cupão',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Cupão criado!',
        description: 'O cupão foi criado com sucesso.',
      });

      setFormData({
        code: '',
        discount_type: 'percentage',
        value: '',
        expiry_date: '',
        usage_limit: ''
      });
      setShowCreateDialog(false);
      fetchCoupons();

    } catch (error: any) {
      console.error('Error creating coupon:', error);
      console.log('Full error object:', JSON.stringify(error, null, 2));
      
      // Extract error message from the edge function response
      let errorMessage = 'Erro ao criar cupão. Tente novamente.';
      
      // Try to get the error from different possible locations
      try {
        // Try to get the response body
        if (error?.context?.body) {
          const errorData = typeof error.context.body === 'string' 
            ? JSON.parse(error.context.body) 
            : error.context.body;
          errorMessage = errorData.error || errorMessage;
        } 
        // Try data.error
        else if (error?.data?.error) {
          errorMessage = error.data.error;
        }
        // Try the error message directly
        else if (error?.message && error.message !== 'Edge Function returned a non-2xx status code') {
          errorMessage = error.message;
        }
      } catch (parseError) {
        console.error('Error parsing error message:', parseError);
      }
      
      toast({
        title: 'Erro ao Criar Cupão',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (couponId: string, couponCode: string) => {
    if (!confirm(`Tem certeza que deseja eliminar o cupão "${couponCode}"?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { error } = await supabase.functions.invoke('manage-coupons', {
        body: { action: 'delete', coupon_id: couponId },
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: 'Cupão eliminado',
        description: 'O cupão foi eliminado com sucesso.',
      });

      fetchCoupons();

    } catch (error) {
      console.error('Error deleting coupon:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao eliminar cupão. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const formatExpiryDate = (date: string | null) => {
    if (!date) return 'Sem expiração';
    return new Date(date).toLocaleDateString('pt-PT');
  };

  const getCouponStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return { text: 'Inativo', variant: 'secondary' as const };
    if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
      return { text: 'Expirado', variant: 'destructive' as const };
    }
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return { text: 'Esgotado', variant: 'destructive' as const };
    }
    return { text: 'Ativo', variant: 'default' as const };
  };

  return (
    <Card className="border-border/50 shadow-elegant">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-foreground">Cupões de Desconto</CardTitle>
          <CardDescription>
            Gerir cupões para {productName}
          </CardDescription>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Cupão
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Novo Cupão</DialogTitle>
              <DialogDescription>
                Crie um cupão de desconto para este produto.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código do Cupão *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="Ex: DESCONTO20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_type">Tipo de Desconto *</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: 'percentage' | 'fixed') => 
                      setFormData(prev => ({ ...prev, discount_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentagem</SelectItem>
                      <SelectItem value="fixed">Valor Fixo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="value">
                    {formData.discount_type === 'percentage' ? 'Percentagem (%)' : 'Valor (KZS)'} *
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    step={formData.discount_type === 'percentage' ? '1' : '0.01'}
                    min="0"
                    max={formData.discount_type === 'percentage' ? '100' : undefined}
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                    placeholder={formData.discount_type === 'percentage' ? '20' : '1000'}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiry_date">Data de Expiração</Label>
                  <Input
                    id="expiry_date"
                    type="datetime-local"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage_limit">Limite de Uso</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: e.target.value }))}
                    placeholder="Ilimitado"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'A criar...' : 'Criar Cupão'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            A carregar cupões...
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum cupão criado ainda.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Desconto</TableHead>
                <TableHead>Expiração</TableHead>
                <TableHead>Uso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <TableRow key={coupon.id}>
                    <TableCell className="font-medium">{coupon.code}</TableCell>
                    <TableCell>
                      {coupon.discount_type === 'percentage' 
                        ? `${coupon.value}%` 
                        : formatPriceFromDB(coupon.value)}
                    </TableCell>
                    <TableCell className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatExpiryDate(coupon.expiry_date)}
                    </TableCell>
                    <TableCell className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      {coupon.used_count}
                      {coupon.usage_limit && ` / ${coupon.usage_limit}`}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.text}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(coupon.id, coupon.code)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}