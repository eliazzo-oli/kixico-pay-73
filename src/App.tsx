import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { ProtectedAdminRoute } from "@/components/ProtectedAdminRoute";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useImageProtection } from "@/hooks/useImageProtection";
import { KixiAI } from "@/components/KixiAI";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardMetrics from "./pages/DashboardMetrics";
import DashboardProducts from "./pages/DashboardProducts";
import DashboardWithdrawals from "./pages/DashboardWithdrawals";
import NewProduct from "./pages/NewProduct";
import Checkout from "./pages/Checkout";
import PaymentReference from "./pages/PaymentReference";
import PaymentSuccess from "./pages/PaymentSuccess";
import ProductSalesPage from "./pages/ProductSalesPage";
import Demo from "./pages/Demo";

import Produtos from "./pages/Produtos";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

import Account from "./pages/settings/Account";
import Financial from "./pages/settings/Financial";
import Wallet from "./pages/settings/Wallet";
import Help from "./pages/settings/Help";
import KycVerification from "./pages/settings/KycVerification";
import Support from "./pages/Support";
import Desenvolvedores from "./pages/Desenvolvedores";
import About from "./pages/About";
import Careers from "./pages/Careers";
import Press from "./pages/Press";
import Partners from "./pages/Partners";
import PaymentLinks from "./pages/PaymentLinks";
import ApiDocumentation from "./pages/ApiDocumentation";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminUserAnalytics from "./pages/AdminUserAnalytics";
import AdminUserDetail from "./pages/AdminUserDetail";
import AdminTransactions from "./pages/AdminTransactions";
import AdminReports from "./pages/AdminReports";
import AdminWithdrawals from "./pages/AdminWithdrawals";
import AdminKycVerifications from "./pages/AdminKycVerifications";
import Invoice from "./pages/Invoice";
import Webhooks from "./pages/Webhooks";
import Security from "./pages/settings/Security";
import TwoFactorVerify from "./pages/TwoFactorVerify";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Apps from "./pages/Apps";
import MembersArea from "./pages/MembersArea";
import Refunds from "./pages/Refunds";

const queryClient = new QueryClient();

const App = () => {
  // Ativa proteção de imagens globalmente
  useImageProtection();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/2fa-verify" element={<TwoFactorVerify />} />
              <Route path="/demo" element={<Demo />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/suporte" element={<Support />} />
              <Route path="/desenvolvedores" element={<Desenvolvedores />} />
              <Route path="/sobre" element={<About />} />
              <Route path="/carreiras" element={<Careers />} />
              <Route path="/imprensa" element={<Press />} />
              <Route path="/parceiros" element={<Partners />} />
              <Route path="/links-pagamento" element={<PaymentLinks />} />
              <Route path="/api" element={<ApiDocumentation />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/metrics" element={
                <ProtectedRoute>
                  <DashboardMetrics />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/products" element={
                <ProtectedRoute>
                  <DashboardProducts />
                </ProtectedRoute>
              } />
              <Route path="/dashboard/withdrawals" element={
                <ProtectedRoute>
                  <DashboardWithdrawals />
                </ProtectedRoute>
              } />
              <Route path="/webhooks" element={
                <ProtectedRoute>
                  <Webhooks />
                </ProtectedRoute>
              } />
              <Route path="/perfil" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/apps" element={
                <ProtectedRoute>
                  <Apps />
                </ProtectedRoute>
              } />
              <Route path="/area-membros" element={
                <ProtectedRoute>
                  <MembersArea />
                </ProtectedRoute>
              } />
              <Route path="/reembolsos" element={
                <ProtectedRoute>
                  <Refunds />
                </ProtectedRoute>
              } />
              <Route path="/products/new" element={
                <ProtectedRoute>
                  <NewProduct />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/:productId" element={<Checkout />} />
              <Route path="/produto/:productId" element={<ProductSalesPage />} />
              <Route path="/payment-reference" element={<PaymentReference />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/invoice/:transactionId" element={
                <ProtectedRoute>
                  <Invoice />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedAdminRoute>
                  <AdminUsers />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedAdminRoute>
                  <AdminUserAnalytics />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/users/:id" element={
                <ProtectedAdminRoute>
                  <AdminUserDetail />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/transactions" element={
                <ProtectedAdminRoute>
                  <AdminTransactions />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/invoice/:transactionId" element={
                <ProtectedAdminRoute>
                  <Invoice />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/withdrawals" element={
                <ProtectedAdminRoute>
                  <AdminWithdrawals />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/kyc-verifications" element={
                <ProtectedAdminRoute>
                  <AdminKycVerifications />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedAdminRoute>
                  <AdminReports />
                </ProtectedAdminRoute>
              } />
              
              <Route path="/configuracoes" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }>
                <Route index element={<Account />} />
                <Route path="conta" element={<Account />} />
                <Route path="financeiro" element={<Financial />} />
                <Route path="carteira" element={<Wallet />} />
                <Route path="seguranca" element={<Security />} />
                <Route path="verificacao" element={<KycVerification />} />
                <Route path="ajuda" element={<Help />} />
              </Route>
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <KixiAI />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;