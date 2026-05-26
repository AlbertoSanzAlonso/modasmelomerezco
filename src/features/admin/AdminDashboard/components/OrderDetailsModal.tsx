import React from 'react';
import { X, Truck, FileImage } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import type { Order } from "@/types";
import { api } from '@/lib/api';
import { getOrderContact } from '@/lib/orderContact';
import { OrderLinePricing } from '@/components/orders/OrderLinePricing';
import { OrderItemVariantInfo } from '@/components/orders/OrderItemVariantInfo';
import { OrderTotalsSummary } from '@/components/orders/OrderTotalsSummary';
import { ScrollArea } from '@/components/ui/ScrollArea';

interface OrderDetailsModalProps {
  order: Order;
  trackingInfo: { number: string; carrier: string };
  onClose: () => void;
  onGenerateLabel: (orderId: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  trackingInfo,
  onClose,
  onGenerateLabel
}) => {
  const contact = getOrderContact(order);

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-6 bg-secondary/80 backdrop-blur-sm">
      <div className="bg-(--bg-main) border border-(--border-main) w-full max-w-4xl max-h-[90vh] min-h-0 rounded-[2.5rem] shadow-2xl shadow-primary/5 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-8 border-b border-(--border-main) flex justify-between items-center bg-(--bg-main)">
          <div>
            <h2 className="text-2xl font-display font-black uppercase tracking-tighter italic text-(--text-main)">
              Detalle del Pedido
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">#{order.order_id.toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-primary/10 rounded-full transition-all text-(--text-main)">
            <X className="w-6 h-6" />
          </button>
        </header>

        <ScrollArea className="flex-1 min-h-0" viewportClassName="p-10" trackInset={26}>
          <div className="space-y-12 pb-2">
          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Información del Cliente</h4>
              <div className="bg-(--bg-card) p-6 border border-(--border-main) rounded-2xl space-y-3">
                <p className="text-sm font-bold text-(--text-main) uppercase italic">
                  {contact.name || 'Sin nombre'}
                </p>
                <p className="text-xs text-gray-500 font-bold">
                  {contact.email || 'Sin email'}
                </p>
                <p className="text-xs text-gray-500 font-bold">
                  {contact.phone || 'Sin teléfono'}
                </p>
                {!order.customer_id && (
                  <p className="text-[9px] text-primary/80 font-black uppercase tracking-widest mt-2">
                    Compra como invitado
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Dirección de Envío</h4>
              <div className="bg-(--bg-card) p-6 border border-(--border-main) rounded-2xl text-xs text-gray-500 font-bold leading-relaxed space-y-1">
                {order.shipping_street ? (
                  <>
                    <p className="text-(--text-main) uppercase">{order.shipping_street}</p>
                    {(order.shipping_floor || order.shipping_door) && (
                      <p>Piso {order.shipping_floor} {order.shipping_door} {order.shipping_stair && `Esc. ${order.shipping_stair}`}</p>
                    )}
                    <p>{order.shipping_zip} {order.shipping_city}</p>
                    <p>{order.shipping_province}</p>
                  </>
                ) : (
                  <p className="italic text-gray-400">Sin dirección de envío detallada</p>
                )}
                
                {order.carrier?.toLowerCase().includes('nacex') && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/20">
                    <h4 className="text-[10px] text-primary font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                      Logística Nacex.Shop
                    </h4>
                    <div className="space-y-2 border-t border-primary/10 pt-3">
                      <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                        <span className="text-[9px] text-gray-400 font-bold uppercase">Punto:</span>
                        <span className="text-[10px] font-black uppercase leading-tight">
                          {order.carrier.includes(':') ? order.carrier.split(':')[1].split('(')[0].trim() : order.carrier}
                        </span>
                      </div>
                      {order.carrier.includes('(') && (
                        <div className="grid grid-cols-[80px_1fr] gap-2 items-start">
                          <span className="text-[9px] text-gray-400 font-bold uppercase">Dirección:</span>
                          <span className="text-[10px] font-medium leading-tight">
                            {order.carrier.split('(')[1]?.replace(')', '').trim()}
                          </span>
                        </div>
                      )}
                      <div className="grid grid-cols-[80px_1fr] gap-2 items-center">
                        <span className="text-[9px] text-gray-400 font-bold uppercase">Estado:</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase w-fit ${
                          order.tracking_number 
                            ? 'bg-green-500/20 text-green-600' 
                            : 'bg-yellow-500/20 text-yellow-600'
                        }`}>
                          {order.tracking_number ? 'Etiqueta Generada' : 'Pendiente de Etiqueta'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Artículos en el Pedido</h4>
            <div className="bg-(--bg-card) border border-(--border-main) rounded-2xl overflow-hidden">
              {order.items?.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center gap-4 border-b border-(--border-main) last:border-0">
                  <div className="w-12 h-16 bg-secondary/5 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-(--border-main)">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-1 text-center">
                        <img src="/assets/logo/LOGO MELOMEREZCO corona.svg" alt="Logo" className="w-6 h-6 opacity-20" />
                        <span className="text-[6px] font-black opacity-30 mt-1 uppercase tracking-tighter">Sin Foto</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase italic text-(--text-main)">{item.name}</p>
                    <OrderItemVariantInfo
                      size={item.size}
                      color={item.color}
                      quantity={item.quantity}
                    />
                  </div>
                  <OrderLinePricing item={item} showUnitDetail />
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-(--border-main) bg-(--bg-main)/50">
              <OrderTotalsSummary order={order} />
            </div>
          </div>

          {/* Logística */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Logística y Seguimiento</h4>
            <div className="bg-primary/5 p-8 border border-primary/20 rounded-4xl space-y-6">
              {order.tracking_number && (
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-primary">Número de Seguimiento</label>
                  <input 
                    type="text"
                    value={order.tracking_number}
                    disabled
                    className="w-full bg-gray-50 border border-primary/20 rounded-xl px-4 py-3 text-xs font-bold text-gray-400 cursor-not-allowed transition-all"
                  />
                </div>
              )}
              <div className="flex gap-4 pt-2">
                {order.tracking_number ? (
                  <Button
                    className="flex-1 py-4 text-[10px] font-black tracking-widest italic"
                    onClick={() => api.shipping.openNacexLabel(undefined, order.tracking_number!)}
                  >
                    <FileImage className="w-4 h-4 mr-2" />
                    VER ETIQUETA NACEX
                  </Button>
                ) : (
                  <Button
                    className="flex-1 py-4 text-[10px] font-black tracking-widest italic"
                    onClick={() => onGenerateLabel(order.order_id)}
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    GENERAR ETIQUETA NACEX
                  </Button>
                )}
              </div>
            </div>
          </div>
          </div>
        </ScrollArea>

        <footer className="p-8 border-t border-(--border-main) flex justify-end bg-(--bg-main)">
           <Button variant="outline" onClick={onClose} className="px-10 font-black tracking-widest text-[10px] rounded-xl py-4">CERRAR</Button>
        </footer>
      </div>
    </div>
  );
};
