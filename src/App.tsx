import { Suspense, lazy, useState, type FC, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CartSidebar } from "@/components/shop/CartSidebar";
import { AddToCartModal } from "@/components/shop/AddToCartModal";
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { useAdminStore } from "@/store/useAdminStore";
import { ShopLayout } from "@/components/layout/ShopLayout";
import { AIChatAgent } from "@/components/ui/AIChatAgent";

// Helper to handle chunk load errors by forcing a reload
const safeLazy = (importFn: () => Promise<any>) => {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (error) {
      console.error('Error loading chunk:', error);
      // Force a full page reload to get latest assets
      window.location.reload();
      return { default: () => null };
    }
  });
};

// Lazy loading for high optimization
const HomePage = safeLazy(() => import("@/features/shop/HomePage"));
const ProductPage = safeLazy(() => import("@/features/shop/ProductPage"));
const CategoryPage = safeLazy(() => import("@/features/shop/CategoryPage"));
const CheckoutPage = safeLazy(() => import("@/features/shop/CheckoutPage"));
const AdminDashboard = safeLazy(() => import("@/features/admin/AdminDashboard"));
const LoginPage = safeLazy(() => import("@/features/auth/LoginPage").then(m => ({ default: m.LoginPage })));
const SignupPage = safeLazy(() => import("@/features/auth/SignupPage").then(m => ({ default: m.SignupPage })));
const CustomerLayout = safeLazy(() => import("@/features/customer/CustomerLayout").then(m => ({ default: m.CustomerLayout })));
const CustomerDashboard = safeLazy(() => import("@/features/customer/CustomerDashboard").then(m => ({ default: m.CustomerDashboard })));
const OrderHistory = safeLazy(() => import("@/features/customer/OrderHistory").then(m => ({ default: m.OrderHistory })));
const InvoiceList = safeLazy(() => import("@/features/customer/InvoiceList").then(m => ({ default: m.InvoiceList })));
const PaymentMethods = safeLazy(() => import("@/features/customer/PaymentMethods").then(m => ({ default: m.PaymentMethods })));
const ProfilePage = safeLazy(() => import("@/features/customer/ProfilePage").then(m => ({ default: m.ProfilePage })));
const FavoritesPage = safeLazy(() => import("@/features/customer/FavoritesPage").then(m => ({ default: m.FavoritesPage })));
const AdminLoginPage = safeLazy(() => import("@/features/admin/AdminLoginPage").then(m => ({ default: m.AdminLoginPage })));
const ResetPasswordPage = safeLazy(() => import("@/features/auth/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));
const AvisoLegalPage = safeLazy(() => import("@/features/shop/AvisoLegalPage"));
const PrivacyPolicyPage = safeLazy(() => import("@/features/shop/PrivacyPolicyPage"));
const TermsPage = safeLazy(() => import("@/features/shop/TermsPage"));
const ShippingPage = safeLazy(() => import("@/features/shop/ShippingPage"));
const ReturnsPage = safeLazy(() => import("@/features/shop/ReturnsPage"));
const CookiesPage = safeLazy(() => import("@/features/shop/CookiesPage"));
const ForgotPasswordPage = safeLazy(() => import("@/features/auth/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const SubscriptionConfirmation = safeLazy(() => import("@/features/shop/SubscriptionConfirmation"));
const UnsubscribePage = safeLazy(() => import("@/features/shop/UnsubscribePage"));
const ConocenosPage = safeLazy(() => import("@/features/shop/ConocenosPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const Skeleton: FC = () => (
  <div className="min-h-screen bg-accent flex items-center justify-center">
    <div className="w-8 h-8 border border-primary/30 border-t-primary rounded-full animate-spin" />
  </div>
);

const ProtectedRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const AdminProtectedRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAdminAuthenticated = useAdminStore((state) => state.isAdminAuthenticated);
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  return <>{children}</>;
};

const ScrollToTop: FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

function App() {
  const { isCartOpen, setIsCartOpen } = useCartStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    // Scroll to top on route change
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ScrollToTop />
        <AddToCartModal />
        <AIChatAgent />
        <Suspense fallback={<Skeleton />}>
          <Routes>
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route path="/admin/recuperar-password" element={<ForgotPasswordPage isAdmin={true} />} />
            <Route path="/admin/*" element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/registro" element={<SignupPage />} />
            <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/cuenta/*" element={
              <ProtectedRoute>
                <CustomerLayout>
                  <Routes>
                    <Route index element={<CustomerDashboard />} />
                    <Route path="pedidos" element={<OrderHistory />} />
                    <Route path="facturas" element={<InvoiceList />} />
                    <Route path="pagos" element={<PaymentMethods />} />
                    <Route path="perfil" element={<ProfilePage />} />
                    <Route path="favoritos" element={<FavoritesPage />} />
                  </Routes>
                </CustomerLayout>
              </ProtectedRoute>
            } />
            <Route path="*" element={
              <ShopLayout 
                setIsCartOpen={setIsCartOpen}
                isMenuOpen={isMenuOpen}
                setIsMenuOpen={setIsMenuOpen}
              >
                <Routes>
                  <Route index element={<HomePage />} />
                  <Route path="/producto/:id" element={<ProductPage />} />
                  <Route path="/categoria/:category" element={<CategoryPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/aviso-legal" element={<AvisoLegalPage />} />
                  <Route path="/politica-de-privacidad" element={<PrivacyPolicyPage />} />
                  <Route path="/condiciones-venta" element={<TermsPage />} />
                  <Route path="/envios" element={<ShippingPage />} />
                  <Route path="/devoluciones" element={<ReturnsPage />} />
                  <Route path="/favoritos" element={<Navigate to="/cuenta/favoritos" replace />} />
                  <Route path="/cookies" element={<CookiesPage />} />
                  <Route path="/conocenos" element={<ConocenosPage />} />
                  <Route path="/confirmar-suscripcion" element={<SubscriptionConfirmation />} />
                  <Route path="/desuscribir" element={<UnsubscribePage />} />
                </Routes>
                <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
              </ShopLayout>
            } />
          </Routes>
        </Suspense>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
