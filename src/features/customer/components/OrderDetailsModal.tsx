import React from 'react';
import { X } from 'lucide-react';
import type { Order, Customer } from '@/types';

interface OrderDetailsModalProps {
  order: Order;
  user: Customer | null;
  onClose: () => void;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  order,
  user,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-secondary/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl p-10 rounded-[2.5rem] shadow-2xl space-y-8 overflow-y-auto max-h-[90vh]">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-display font-black uppercase tracking-tighter italic">
              Detalles del <span className="text-primary italic font-serif lowercase">pedido</span>
            </h2>
            <p className="text-[10px] text-secondary/40 font-black uppercase tracking-widest mt-1">#{order.order_id}</p>
          </div>
          <button 
            onClick={onClose}
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
              <p>{order.shipping_street}</p>
              <p>{order.shipping_zip} {order.shipping_city}</p>
              <p>{order.shipping_province}</p>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Resumen de Pago</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-secondary/40">Método:</span>
                <span>{order.payment_method}</span>
              </div>
              {order.payment_status && (
                <div className="flex justify-between text-xs font-bold uppercase">
                  <span className="text-secondary/40">Estado Pago:</span>
                  <span className={order.payment_status.toLowerCase() === 'paid' ? 'text-green-600' : 'text-orange-600'}>
                    {order.payment_status}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xs font-bold uppercase">
                <span className="text-secondary/40">Total:</span>
                <span className="text-lg font-black">{order.total_amount.toFixed(2)}€</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-primary">Artículos</h4>
          <div className="space-y-3">
            {order.items?.map((item: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                <div className="flex gap-4 items-center">
                  <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center text-[10px] font-black">
                    {item.quantity}x
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-tight">{item.name || `Producto #${item.product_id}`}</p>
                    {item.size && (
                      <p className="text-[9px] font-bold text-primary uppercase tracking-widest mt-0.5">Talla: {item.size}</p>
                    )}
                  </div>
                </div>
                <p className="text-sm font-black">{item.price.toFixed(2)}€</p>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={onClose}
          className="w-full py-5 bg-secondary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-primary transition-all"
        >
          Cerrar Detalles
        </button>
      </div>
    </div>
  );
};
