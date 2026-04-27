import React, { useState } from 'react';
import { Package, Clock, MapPin, ExternalLink, ArrowRight, Heart, Loader2, X } from 'lucide-react';
import { useAuthStore } from "@/store/useAuthStore";
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from "@/lib/api";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const CustomerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['orders', user?.customer_id],
    queryFn: () => api.orders.getByCustomer(user?.customer_id || user?.email || ''),
    enabled: !!(user?.customer_id || user?.email)
  });

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sincronizando sesión...</p>
      </div>
    );
  }

  const defaultAddress = user.addresses?.find(a => a.isDefault) || user.addresses?.[0];
  const recentOrders = orders.slice(0, 5);
  const inProgressCount = orders.filter(o => ['Pending', 'Paid', 'Shipped'].includes(o.order_status)).length;

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black uppercase tracking-tighter mb-2">
            Bienvenida,{' '}<span className="italic font-serif lowercase text-primary">{user?.name.split(' ')[0]}</span>
          </h1>
          <p className="text-gray-500 font-medium">Bienvenida a tu espacio personal. Aquí puedes gestionar todo lo relacionado con tus compras.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {/* Quick Stats */}
        <Link to="/cuenta/pedidos" className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl group hover:border-primary/30 transition-all hover:bg-white/8">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 md:mb-6 group-hover:scale-110 transition-transform">
            <Package className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <p className="text-2xl md:text-4xl font-display font-black mb-1">{orders?.length || 0}</p>
          <p className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest">Pedidos Totales</p>
        </Link>

        <Link to="/cuenta/pedidos" className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl group hover:border-primary/30 transition-all hover:bg-white/8">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 md:mb-6 group-hover:scale-110 transition-transform">
            <Clock className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <p className="text-2xl md:text-4xl font-display font-black mb-1">{inProgressCount}</p>
          <p className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest">En proceso</p>
        </Link>

        <Link to="/cuenta/favoritos" className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl group hover:border-primary/30 transition-all hover:bg-white/8">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 md:mb-6 group-hover:scale-110 transition-transform">
            <Heart className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <p className="text-2xl md:text-4xl font-display font-black mb-1">{user?.favorites?.length || 0}</p>
          <p className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest">Favoritos</p>
        </Link>

        <Link to="/cuenta/perfil" className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-3xl group hover:border-primary/30 transition-all hover:bg-white/8">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 md:mb-6 group-hover:scale-110 transition-transform">
            <MapPin className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <p className="text-lg md:text-xl font-display font-black mb-1 truncate">{defaultAddress?.city || 'No definida'}</p>
          <p className="text-[9px] md:text-[10px] text-gray-500 font-black uppercase tracking-widest">Ubicación</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Recent Orders */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black uppercase tracking-widest italic">Pedidos Recientes</h3>
            <Link to="/cuenta/pedidos" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:gap-3 transition-all">
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {isLoading ? (
              [1, 2].map(i => (
                <div key={i} className="h-24 bg-white/5 animate-pulse rounded-2xl border border-white/10" />
              ))
            ) : error ? (
              <div className="p-12 text-center bg-white/5 border border-red-500/10 rounded-3xl">
                <p className="text-xs font-black uppercase tracking-widest text-red-500 italic">No se pudieron cargar los pedidos</p>
              </div>
            ) : recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div 
                  key={order.order_id} 
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowDetails(true);
                  }}
                  className="p-6 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between hover:bg-white/8 transition-colors cursor-pointer group"
                >
                  <div>
                    <p className="font-black text-sm mb-1">#{order.order_id.split('-')[0].toUpperCase()}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase italic">
                      {format(new Date(order.order_date), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-sm mb-1">{order.total_amount.toFixed(2)}€</p>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                      order.order_status === 'Paid' || order.order_status === 'Shipped' ? 'bg-primary/20 text-primary' : 'bg-green-500/20 text-green-500'
                    }`}>
                      {order.order_status === 'Paid' ? 'Pagado' : 
                       order.order_status === 'Shipped' ? 'Enviado' : 
                       order.order_status === 'Delivered' ? 'Entregado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center bg-white/5 border border-white/10 rounded-3xl">
                <p className="text-xs font-black uppercase tracking-widest text-gray-500 italic">No tienes pedidos recientes</p>
              </div>
            )}
          </div>
        </section>

        {/* Profile Card */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-black uppercase tracking-widest italic">Información de Perfil</h3>
            <Link to="/cuenta/perfil" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 hover:gap-3 transition-all">
              Editar <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-8 bg-white/5 border border-white/10 rounded-3xl space-y-6">
            <div>
              <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] mb-2">Nombre Completo</p>
              <p className="font-bold">{user?.name} {user?.surname}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] mb-2">Email</p>
              <p className="font-bold">{user?.email}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.3em] mb-2">Dirección de Envío</p>
              <p className="font-bold text-sm leading-relaxed">
                {defaultAddress ? (
                  <>
                    {defaultAddress.street}<br />
                    {defaultAddress.zip}, {defaultAddress.city} ({defaultAddress.province})
                  </>
                ) : (
                  'Sin dirección guardada'
                )}
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Order Details Modal */}
      {showDetails && selectedOrder && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-6 bg-secondary/80 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl p-10 rounded-[2.5rem] shadow-2xl space-y-8 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-display font-black uppercase tracking-tighter italic">
                  Detalles del <span className="text-primary italic font-serif lowercase">pedido</span>
                </h2>
                <p className="text-[10px] text-secondary/40 font-black uppercase tracking-widest mt-1">#{selectedOrder.order_id}</p>
              </div>
              <button 
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-y border-gray-100">
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Información de Envío</h4>
                <div className="text-sm font-medium text-secondary/70 space-y-1">
                  <p className="text-secondary font-bold uppercase">{user?.name} {user?.surname}</p>
                  <p>{selectedOrder.shipping_street}</p>
                  <p>{selectedOrder.shipping_zip} {selectedOrder.shipping_city}</p>
                  <p>{selectedOrder.shipping_province}</p>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Resumen de Pago</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold uppercase">
                    <span className="text-secondary/40">Método:</span>
                    <span className="text-secondary">{selectedOrder.payment_method}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold uppercase">
                    <span className="text-secondary/40">Estado:</span>
                    <span className="text-primary">{selectedOrder.order_status}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Artículos del Pedido</h4>
              <div className="space-y-4">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-4 border-b border-gray-50 last:border-0">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-[10px] font-bold text-gray-400">
                        IMG
                      </div>
                      <div>
                        <p className="text-sm font-bold text-secondary uppercase">{item.name || `Producto #${item.product_id}`}</p>
                        <p className="text-[10px] text-secondary/40 font-black">CANT: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-secondary">{item.price.toFixed(2)}€</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-accent/50 p-8 rounded-3xl space-y-3">
              <div className="flex justify-between text-xs font-bold uppercase text-secondary/60">
                <span>Subtotal</span>
                <span>{(selectedOrder.subtotal || selectedOrder.total_amount).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase text-secondary/60">
                <span>Envío</span>
                <span>{(selectedOrder.shipping_cost || 0).toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-lg font-black uppercase text-secondary pt-3 border-t border-secondary/5">
                <span>Total</span>
                <span className="text-primary">{selectedOrder.total_amount.toFixed(2)}€</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
