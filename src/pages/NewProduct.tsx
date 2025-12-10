import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrialBanner } from '@/components/TrialBanner';
import { ArrowLeft, Home, Upload, X } from 'lucide-react';

export default function NewProduct() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    product_category: '',
    product_delivery_link: '',
    seller_support_contact: '',
    currency: 'AOA',
  });
  const [checkoutCustomization, setCheckoutCustomization] = useState({
    backgroundColor: '#ffffff',
    textColor: '#000000',
    buttonColor: '#6366f1',
    timerEnabled: false,
  });
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState<string[]>([
    'reference',
    'multicaixa',
    'paypal_ao',
  ]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const formatPrice = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Adiciona pontos a cada 3 dígitos da direita para a esquerda
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      const formattedValue = formatPrice(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedValue,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview('');
  };

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate optimal dimensions (max 800x600)
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8 // 80% quality
        );
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      // Compress image before upload
      const compressedFile = await compressImage(file);
      
      const fileExt = 'jpg'; // Always save as JPG for better compression
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Remove pontos antes de converter para número
      const priceValue = formData.price.replace(/\./g, '');
      const price = parseFloat(priceValue);
      if (isNaN(price) || price <= 0) {
        toast({
          title: 'Erro',
          description: 'Por favor, insira um preço válido',
          variant: 'destructive',
        });
        return;
      }

      let imageUrl = null;
      
      // Upload image if selected
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          toast({
            title: 'Erro',
            description: 'Erro ao fazer upload da imagem. Tente novamente.',
            variant: 'destructive',
          });
          return;
        }
      }

      const { error } = await supabase
        .from('products')
        .insert({
          user_id: user?.id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: price, // Price is already in AOA as integer
          image_url: imageUrl,
          active: true,
          checkout_background_color: checkoutCustomization.backgroundColor,
          checkout_text_color: checkoutCustomization.textColor,
          checkout_button_color: checkoutCustomization.buttonColor,
          checkout_timer_enabled: checkoutCustomization.timerEnabled,
          accepted_payment_methods: acceptedPaymentMethods.length > 0 ? acceptedPaymentMethods : null,
          product_category: formData.product_category || null,
          product_delivery_link: formData.product_delivery_link || null,
          seller_support_contact: formData.seller_support_contact || null,
          currency: formData.currency,
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Produto criado com sucesso!',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar produto. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-primary">
              Novo Produto
            </h1>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <TrialBanner />
        <div className="max-w-2xl mx-auto">
          <Card className="border-border/50 shadow-elegant">
            <CardHeader>
              <CardTitle className="text-foreground">Cadastrar Produto</CardTitle>
              <CardDescription>
                Preencha as informações do seu produto para criar um link de pagamento
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <Tabs defaultValue="produto" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="produto">Produto</TabsTrigger>
                    <TabsTrigger value="checkout">Checkout</TabsTrigger>
                    <TabsTrigger value="pagamentos">Pagamentos</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="produto" className="space-y-6 mt-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome do Produto *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Ex: Curso de Marketing Digital"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="price">Preço (AOA) *</Label>
                      <Input
                        id="price"
                        name="price"
                        type="text"
                        value={formData.price}
                        onChange={handleInputChange}
                        required
                        placeholder="100.000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descrição</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Descreva seu produto..."
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product_category">Categoria do Produto</Label>
                      <select
                        id="product_category"
                        name="product_category"
                        value={formData.product_category}
                        onChange={(e) => setFormData(prev => ({ ...prev, product_category: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Selecione uma categoria</option>
                        <option value="Marketing Digital">Marketing Digital</option>
                        <option value="Saúde e Bem-estar">Saúde e Bem-estar</option>
                        <option value="Desenvolvimento Pessoal">Desenvolvimento Pessoal</option>
                        <option value="Negócios e Carreira">Negócios e Carreira</option>
                        <option value="Design e Fotografia">Design e Fotografia</option>
                        <option value="Finanças e Investimentos">Finanças e Investimentos</option>
                        <option value="Espiritualidade">Espiritualidade</option>
                        <option value="Tecnologia e Programação">Tecnologia e Programação</option>
                        <option value="Outros">Outros</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="currency">Moeda do Produto *</Label>
                      <select
                        id="currency"
                        name="currency"
                        value={formData.currency}
                        onChange={(e) => setFormData(prev => ({ ...prev, currency: e.target.value }))}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        required
                      >
                        <option value="AOA">AOA - Kwanza Angolano</option>
                        <option value="BRL">BRL - Real Brasileiro</option>
                      </select>
                      <p className="text-xs text-muted-foreground">
                        A moeda determina quais métodos de pagamento serão exibidos no checkout.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="product_delivery_link">Link de Entrega do Produto *</Label>
                      <Input
                        id="product_delivery_link"
                        name="product_delivery_link"
                        type="url"
                        value={formData.product_delivery_link}
                        onChange={handleInputChange}
                        required
                        placeholder="https://..."
                      />
                      <p className="text-xs text-muted-foreground">
                        O seu cliente receberá este link imediatamente após o pagamento ser aprovado.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="seller_support_contact">Contacto de Suporte ao Cliente *</Label>
                      <Input
                        id="seller_support_contact"
                        name="seller_support_contact"
                        type="text"
                        value={formData.seller_support_contact}
                        onChange={handleInputChange}
                        required
                        placeholder="seuemail@exemplo.com ou +244 900 000 000"
                      />
                      <p className="text-xs text-muted-foreground">
                        O seu cliente verá este contacto (e-mail ou WhatsApp) na página de sucesso e no e-mail de confirmação.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Imagem do Produto</Label>
                      <div className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center">
                        {!imagePreview ? (
                          <div>
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground">
                                Clique para selecionar uma imagem ou arraste aqui
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PNG, JPG ou JPEG até 5MB
                              </p>
                            </div>
                            <Input
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="mt-4 cursor-pointer"
                            />
                          </div>
                        ) : (
                          <div className="relative">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="max-w-full h-48 object-cover rounded-lg mx-auto"
                              loading="lazy"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={removeImage}
                              className="absolute top-2 right-2 p-1 h-8 w-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <p className="text-sm text-muted-foreground mt-2">
                              {selectedImage?.name}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="checkout" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-foreground">Personalização da Página de Checkout</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="backgroundColor"
                            type="color"
                            value={checkoutCustomization.backgroundColor}
                            onChange={(e) => setCheckoutCustomization(prev => ({ ...prev, backgroundColor: e.target.value }))}
                            className="w-20 h-10 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={checkoutCustomization.backgroundColor}
                            onChange={(e) => setCheckoutCustomization(prev => ({ ...prev, backgroundColor: e.target.value }))}
                            placeholder="#ffffff"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="textColor">Cor do Texto</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="textColor"
                            type="color"
                            value={checkoutCustomization.textColor}
                            onChange={(e) => setCheckoutCustomization(prev => ({ ...prev, textColor: e.target.value }))}
                            className="w-20 h-10 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={checkoutCustomization.textColor}
                            onChange={(e) => setCheckoutCustomization(prev => ({ ...prev, textColor: e.target.value }))}
                            placeholder="#000000"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="buttonColor">Cor do Botão</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="buttonColor"
                            type="color"
                            value={checkoutCustomization.buttonColor}
                            onChange={(e) => setCheckoutCustomization(prev => ({ ...prev, buttonColor: e.target.value }))}
                            className="w-20 h-10 cursor-pointer"
                          />
                          <Input
                            type="text"
                            value={checkoutCustomization.buttonColor}
                            onChange={(e) => setCheckoutCustomization(prev => ({ ...prev, buttonColor: e.target.value }))}
                            placeholder="#6366f1"
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="timerEnabled">Ativar Temporizador de Escassez</Label>
                          <p className="text-sm text-muted-foreground">
                            Mostra uma contagem regressiva de 15 minutos no checkout
                          </p>
                        </div>
                        <Switch
                          id="timerEnabled"
                          checked={checkoutCustomization.timerEnabled}
                          onCheckedChange={(checked) => setCheckoutCustomization(prev => ({ ...prev, timerEnabled: checked }))}
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="pagamentos" className="space-y-6 mt-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-foreground">Métodos de Pagamento Aceitos</h4>
                      <p className="text-sm text-muted-foreground">
                        Escolha quais métodos de pagamento deseja aceitar para este produto
                      </p>
                      
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img 
                              src="/assets/multicaixa-referencia.png" 
                              alt="Pagamento por Referência" 
                              className="h-10 w-10 object-contain rounded-lg"
                            />
                            <div>
                              <p className="font-medium text-foreground">Pagamento por Referência</p>
                              <p className="text-sm text-muted-foreground">Pagamento via referência bancária</p>
                            </div>
                          </div>
                          <Switch
                            checked={acceptedPaymentMethods.includes('reference')}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAcceptedPaymentMethods(prev => [...prev, 'reference']);
                              } else {
                                setAcceptedPaymentMethods(prev => prev.filter(m => m !== 'reference'));
                              }
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img 
                              src="/assets/multicaixa-express.png" 
                              alt="Multicaixa Express" 
                              className="h-10 w-10 object-contain rounded-lg"
                            />
                            <div>
                              <p className="font-medium text-foreground">Multicaixa Express</p>
                              <p className="text-sm text-muted-foreground">Pagamento via Multicaixa</p>
                            </div>
                          </div>
                          <Switch
                            checked={acceptedPaymentMethods.includes('multicaixa')}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAcceptedPaymentMethods(prev => [...prev, 'multicaixa']);
                              } else {
                                setAcceptedPaymentMethods(prev => prev.filter(m => m !== 'multicaixa'));
                              }
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 border border-border/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <img 
                              src="/assets/paypay-afri.png" 
                              alt="PayPay Afri" 
                              className="h-10 w-10 object-contain rounded-lg"
                            />
                            <div>
                              <p className="font-medium text-foreground">PayPay Afri</p>
                              <p className="text-sm text-muted-foreground">PayPay África</p>
                            </div>
                          </div>
                          <Switch
                            checked={acceptedPaymentMethods.includes('paypal_ao')}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAcceptedPaymentMethods(prev => [...prev, 'paypal_ao']);
                              } else {
                                setAcceptedPaymentMethods(prev => prev.filter(m => m !== 'paypal_ao'));
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>

              <div className="p-6 pt-0">
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="premium"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Criando...' : 'Criar Produto'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}