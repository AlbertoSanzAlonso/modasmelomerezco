import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Download } from 'lucide-react';
import type { Order } from '@/types';

interface OrderListMobileProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onDownloadPDF: (order: Order) => void;
}

export const OrderListMobile: React.FC<OrderListMobileProps> = ({
  orders,
  onViewDetails,
  onDownloadPDF
}) => {
  return (
    <div className="md:hidden space-y-4">
      {orders.map((order) => (
        <div key={order.order_id || Math.random()} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Pedido</p>
              <p className="font-black text-sm">#{order.order_id ? order.order_id.split('-')[0].toUpperCase() : 'N/A'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Total</p>
              <p className="font-black text-sm text-primary">{(order.total_amount || 0).toFixed(2)}€</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center py-4 border-y border-white/5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Estado</p>
              <div className="flex flex-col gap-1">
                <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border w-fit ${
                  order.order_status === 'Shipped' || order.order_status === 'Paid' ? 'border-primary/30 text-primary bg-primary/5' :
                  order.order_status === 'Delivered' ? 'border-green-500/30 text-green-500 bg-green-500/5' :
                  'border-red-500/30 text-red-500 bg-red-500/5'
                }`}>
                  {order.order_status === 'Paid' ? 'Pagado' : 
                   order.order_status === 'Shipped' ? 'Enviado' : 
                   order.order_status === 'Delivered' ? 'Entregado' : 'Pendiente'}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Fecha</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase italic">
                {order.order_date ? format(new Date(order.order_date), "d MMM yyyy", { locale: es }) : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => onViewDetails(order)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              <Eye className="w-3 h-3" /> Ver Detalles
            </button>
            <button 
              onClick={() => onDownloadPDF(order)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary/10 border border-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all"
            >
              <Download className="w-3 h-3" /> Factura
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
