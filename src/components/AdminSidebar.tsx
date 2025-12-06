
import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  BarChart3, 
  LogOut,
  Shield,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Usuários", url: "/admin/users", icon: Users },
  { title: "Análise de Usuários", url: "/admin/analytics", icon: TrendingUp },
  { title: "Transações", url: "/admin/transactions", icon: CreditCard },
  { title: "Saques", url: "/admin/withdrawals", icon: DollarSign },
  { title: "Verificações KYC", url: "/admin/kyc-verifications", icon: Shield },
  { title: "Relatórios", url: "/admin/reports", icon: BarChart3 },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao fazer logout',
        variant: 'destructive',
      });
    } else {
      navigate('/admin/login');
    }
  };

  return (
    <Sidebar className={state === "collapsed" ? "w-14" : "w-60"} collapsible="icon">
      <SidebarContent>
        {/* Logo/Brand */}
        <div className="p-4 border-b border-border">
          <button 
            onClick={() => navigate('/admin')}
            className="hover:opacity-80 transition-opacity"
          >
            {state === "expanded" ? (
              <img 
                src="/lovable-uploads/aaa7ebd4-937a-41c9-ab8e-25102e62b1ed.png" 
                alt="KixicoPay" 
                className="h-10 w-auto"
              />
            ) : (
              <img 
                src="/lovable-uploads/aaa7ebd4-937a-41c9-ab8e-25102e62b1ed.png" 
                alt="KixicoPay" 
                className="h-8 w-8 object-contain"
              />
            )}
          </button>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            {state === "expanded" && "Painel Admin"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end={item.url === "/admin"}
                      className={({ isActive }) =>
                        isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {state === "expanded" && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="mt-auto p-2">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full justify-start text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            {state === "expanded" && <span className="ml-2">Sair</span>}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
