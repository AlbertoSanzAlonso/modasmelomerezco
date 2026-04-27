import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader2, ShoppingBag } from 'lucide-react';
import { generateInvoicePDF } from "@/utils/pdfGenerator";
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import type { Order } from '@/types';
import { api } from "@/lib/api";

// Sub-components
import { OrderListTable } from './components/OrderListTable';
import { OrderListMobile } from './components/OrderListMobile';
import { OrderDetailsModal } from './components/OrderDetailsModal';

export const OrderHistory: React.FC = () => {
  const { user } = useAuthStore();
  const { clearCart, openModal, closeModal } = useCartStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      clearCart();
      openModal({
        title: '¡Pago completado!',
        message: 'Tu pedido se ha procesado correctamente. Recibirás un email de confirmación en breve.',
        type: 'success',
        actionLabel: 'Ver mis pedidos',
        onAction: async () => {
          closeModal();
        }
      });
      
      const sendInitialEmail = async () => {
        try {
          const latestOrders = await api.orders.getByCustomer(user?.customer_id || user?.email || '');
          const latest = latestOrders[0];
          if (latest && (new Date().getTime() - new Date(latest.order_date).getTime() < 60000)) {
            await api.mail.sendOrderConfirmation(latest, user?.email || '');
          }
        } catch (e) {
          console.error('Auto-email on return failed', e);
        }
      };
      sendInitialEmail();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [clearCart, openModal, user]);

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders', user?.customer_id, currentPage],
    queryFn: () => api.orders.getByCustomer(user?.customer_id || user?.email || '', currentPage, itemsPerPage),
    enabled: !!user?.customer_id || !!user?.email
  });

  const hasMore = !!orders && orders.length === itemsPerPage;

  const handleDownloadPDF = async (order: Order) => {
    const doc = await generateInvoicePDF(order, user);
    doc.save(`Factura_Pedido_${order.order_id.split('-')[0].toUpperCase()}.pdf`);
  };

  const onViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetails(true);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black uppercase tracking-tighter mb-2">
            Mis <span className="italic font-serif lowercase text-primary">pedidos</span>
          </h1>
          <p className="text-gray-500 font-medium">Historial completo de tus compras en la boutique.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar pedido..."
              className="pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all w-full md:w-64"
            />
          </div>
          <button className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors">
            <Filter className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </header>

      <div className="overflow-x-auto min-h-[400px]">
        {isLoading || !user ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              {!user ? 'Sincronizando sesión...' : 'Cargando tus pedidos...'}
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6 bg-white/5 border border-red-500/20 rounded-[3rem]">
            <div className="text-center">
              <h3 className="text-xl font-black uppercase italic mb-2 text-red-500">Error al cargar pedidos</h3>
              <p className="text-sm text-gray-500 font-medium">No hemos podido recuperar tu historial de compras. Por favor, inténtalo más tarde.</p>
            </div>
          </div>
        ) : !orders || orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-6 bg-white/5 border border-white/10 rounded-[3rem]">
            <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-black uppercase italic mb-2">Aún no tienes pedidos</h3>
              <p className="text-sm text-gray-500 font-medium">¡Tu armario está esperando nuevas joyas!</p>
            </div>
            <a href="/" className="px-8 py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-full hover:bg-secondary transition-all">
              Ir a la tienda
            </a>
          </div>
        ) : (
          <>
            <OrderListTable 
              orders={orders} 
              onViewDetails={onViewDetails} 
              onDownloadPDF={handleDownloadPDF} 
            />
            <OrderListMobile 
              orders={orders} 
              onViewDetails={onViewDetails} 
              onDownloadPDF={handleDownloadPDF} 
            />

            {(currentPage > 1 || hasMore) && (
              <div className="flex items-center justify-between pt-12 border-t border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500"> Página {currentPage} </p>
                <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  > Anterior </button>
                  <button 
                    disabled={!hasMore}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="px-6 py-3 bg-primary text-white border border-primary rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  > Siguiente </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showDetails && selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          user={user} 
          onClose={() => setShowDetails(false)} 
        />
      )}
    </div>
  );
};
