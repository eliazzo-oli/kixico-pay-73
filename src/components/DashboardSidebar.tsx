import { BarChart3, CreditCard, Package, TrendingUp, Home, DollarSign, User, Settings, X } from 'lucide-react';
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
    title: 'Saques',
    url: '/dashboard/withdrawals',
    icon: DollarSign,
  },
  {
    title: 'Planos e Assinatura',
    url: '/plans-management',
    icon: CreditCard,
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
        {/* Logo/Brand */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-between">
            {sidebarState !== 'collapsed' ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="text-lg font-bold text-primary hover:opacity-80 transition-opacity"
              >
                KixicoPay
              </button>
            ) : (
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <CreditCard className="w-4 h-4 text-white" />
              </button>
            )}
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