import { BarChart3, CreditCard, Package, TrendingUp, Home, DollarSign, Wallet, Users, RotateCcw, Grid3X3, Settings, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import kixicoPayLogo from "/lovable-uploads/9a0e296b-bc4f-460b-9e96-40c29ccfbe47.png";

const navigationItems = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
  },
  {
    title: 'Métricas',
    url: '/dashboard/metrics',
    icon: BarChart3,
  },
  {
    title: 'Meus Produtos',
    url: '/dashboard/products',
    icon: Package,
  },
  {
    title: 'Webhooks',
    url: '/webhooks',
    icon: TrendingUp,
  },
  {
    title: 'Saques',
    url: '/dashboard/withdrawals',
    icon: DollarSign,
  },
  {
    title: 'Carteira',
    url: '/configuracoes/carteira',
    icon: Wallet,
  },
  {
    title: 'Dados Financeiros',
    url: '/configuracoes/financeiro',
    icon: CreditCard,
  },
  {
    title: 'Área de Membros',
    url: '/area-membros',
    icon: Users,
  },
  {
    title: 'Reembolsos',
    url: '/reembolsos',
    icon: RotateCcw,
  },
  {
    title: 'Apps & Integrações',
    url: '/apps',
    icon: Grid3X3,
  },
];

export function DashboardSidebar() {
  const navigate = useNavigate();
  
  // Try to use sidebar context, fallback if not available
  let sidebarState;
  let setSidebarOpen;
  
  try {
    const sidebar = useSidebar();
    sidebarState = sidebar.state;
    setSidebarOpen = sidebar.setOpen;
  } catch (error) {
    // Fallback values if not within SidebarProvider
    sidebarState = 'expanded';
    setSidebarOpen = () => {};
  }

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium border-r-2 border-primary' 
      : 'hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground';

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="bg-sidebar border-r border-sidebar-border">
        {/* Logo/Brand - Horizontal */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/dashboard')}
              className="hover:opacity-80 transition-opacity"
            >
              {sidebarState !== 'collapsed' ? (
                <img 
                  src={kixicoPayLogo}
                  alt="KixicoPay" 
                  className="h-8 w-auto"
                />
              ) : (
                <img 
                  src={kixicoPayLogo}
                  alt="KixicoPay" 
                  className="h-8 w-8 object-contain"
                />
              )}
            </button>
            {sidebarState !== 'collapsed' && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
                aria-label="Fechar sidebar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === '/dashboard'}
                      className={getNavClassName}
                    >
                      <item.icon className="w-4 h-4" />
                      {sidebarState !== 'collapsed' && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}