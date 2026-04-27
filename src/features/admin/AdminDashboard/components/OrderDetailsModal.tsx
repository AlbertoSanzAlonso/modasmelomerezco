import React from 'react';
import { X, Truck } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import type { Order } from "@/types";

interface OrderDetailsModalProps {
  order: Order;
  trackingInfo: { number: string; carrier: string };
  onClose: () => void;
  onUpdateTracking: (number: string, carrier: string) => void;
  onGenerateLabel: (orderId: string) => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  trackingInfo,
  onClose,
  onUpdateTracking,
  onGenerateLabel
}) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-secondary/80 backdrop-blur-sm">
      <div className="bg-(--bg-main) border border-(--border-main) w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl shadow-primary/5 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
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

        <div className="flex-1 overflow-y-auto p-10 space-y-12">
          {/* Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Información del Cliente</h4>
              <div className="bg-(--bg-card) p-6 border border-(--border-main) rounded-2xl space-y-3">
                <p className="text-sm font-bold text-(--text-main) uppercase italic">{order.customer?.name} {order.customer?.surname}</p>
                <p className="text-xs text-gray-500 font-bold">{order.customer?.email}</p>
                <p className="text-xs text-gray-500 font-bold">{order.customer?.phone || 'No especificado'}</p>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Dirección de Envío</h4>
              <div className="bg-(--bg-card) p-6 border border-(--border-main) rounded-2xl text-xs text-gray-500 font-bold leading-relaxed space-y-1">
                <p>{order.shipping_street}</p>
                {order.shipping_floor && <p>Piso {order.shipping_floor} {order.shipping_door}</p>}
                <p>{order.shipping_zip} {order.shipping_city}</p>
                <p>{order.shipping_province}</p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Artículos en el Pedido</h4>
            <div className="bg-(--bg-card) border border-(--border-main) rounded-2xl overflow-hidden">
              {order.items?.map((item, idx) => (
                <div key={idx} className="p-4 flex items-center gap-4 border-b border-(--border-main) last:border-0">
                  <div className="w-12 h-16 bg-black rounded-lg overflow-hidden shrink-0">
                    <img src={item.image_url || undefined} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-black uppercase italic text-(--text-main)">{item.name}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Talla: {item.size} • Cantidad: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">{item.price.toFixed(2)}€</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Logística */}
          <div className="space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Logística y Seguimiento</h4>
            <div className="bg-primary/5 p-8 border border-primary/20 rounded-4xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-primary">Número de Seguimiento</label>
                  <input 
                    type="text"
                    value={trackingInfo.number}
                    onChange={(e) => onUpdateTracking(e.target.value, trackingInfo.carrier)}
                    placeholder="Escribir número..."
                    className="w-full bg-white border border-primary/20 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-primary">Transportista</label>
                  <select 
                    value={trackingInfo.carrier}
                    onChange={(e) => onUpdateTracking(trackingInfo.number, e.target.value)}
                    className="w-full bg-white border border-primary/20 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-primary transition-all"
                  >
                    <option value="NACEX">NACEX</option>
                    <option value="CORREOS">CORREOS</option>
                    <option value="UPS">UPS</option>
                    <option value="MRW">MRW</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button className="flex-1 py-4 text-[10px] font-black tracking-widest italic" onClick={() => onGenerateLabel(order.order_id)}>
                   <Truck className="w-4 h-4 mr-2" /> GENERAR ETIQUETA NACEX
                </Button>
                <Button variant="outline" className="flex-1 py-4 text-[10px] font-black tracking-widest border-primary/20 text-primary">
                   ACTUALIZAR ESTADO
                </Button>
              </div>
            </div>
          </div>
        </div>

        <footer className="p-8 border-t border-(--border-main) flex justify-end bg-(--bg-main)">
           <Button variant="outline" onClick={onClose} className="px-10 font-black tracking-widest text-[10px] rounded-xl py-4">CERRAR</Button>
        </footer>
      </div>
    </div>
  );
};
