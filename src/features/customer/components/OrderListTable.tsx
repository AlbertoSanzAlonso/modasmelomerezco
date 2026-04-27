import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Download } from 'lucide-react';
import type { Order } from '@/types';

interface OrderListTableProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onDownloadPDF: (order: Order) => void;
}

export const OrderListTable: React.FC<OrderListTableProps> = ({
  orders,
  onViewDetails,
  onDownloadPDF
}) => {
  return (
    <div className="hidden md:block">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-white/5">
            <th className="pb-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">ID Pedido</th>
            <th className="pb-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Fecha</th>
            <th className="pb-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Estado</th>
            <th className="pb-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Artículos</th>
            <th className="pb-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Total</th>
            <th className="pb-6 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {orders.map((order) => (
            <tr key={order.order_id || Math.random()} className="group hover:bg-white/2 transition-colors">
              <td className="py-6 font-black text-[11px] truncate max-w-[120px]" title={order.order_id}>
                #{order.order_id ? order.order_id.split('-')[0].toUpperCase() : 'N/A'}
              </td>
              <td className="py-6 text-xs text-gray-400 font-medium lowercase italic">
                {order.order_date ? format(new Date(order.order_date), "d 'de' MMMM, yyyy", { locale: es }) : 'N/A'}
              </td>
              <td className="py-6 flex flex-col gap-1">
                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border w-fit ${
                  order.order_status === 'Shipped' || order.order_status === 'Paid' ? 'border-primary/30 text-primary bg-primary/5' :
                  order.order_status === 'Delivered' ? 'border-green-500/30 text-green-500 bg-green-500/5' :
                  'border-red-500/30 text-red-500 bg-red-500/5'
                }`}>
                  {order.order_status === 'Paid' ? 'Pagado' : 
                  order.order_status === 'Shipped' ? 'Enviado' : 
                  order.order_status === 'Delivered' ? 'Entregado' : 'Pendiente'}
                </span>
                {order.payment_status && (
                  <span className={`text-[7px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border w-fit ${
                    order.payment_status.toLowerCase() === 'paid' ? 'border-green-500/20 text-green-500/70' : 'border-orange-500/20 text-orange-500/70'
                  }`}>
                    Pago: {order.payment_status}
                  </span>
                )}
              </td>
              <td className="py-6 text-sm font-bold">
                {Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0}
              </td>
              <td className="py-6 text-sm font-black">{(order.total_amount || 0).toFixed(2)}€</td>
              <td className="py-6 text-right">
                <div className="flex items-center justify-end gap-3">
                  <button 
                    onClick={() => onViewDetails(order)}
                    className="p-2 hover:bg-primary/20 hover:text-primary rounded-lg transition-all" 
                    title="Ver Detalles"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => onDownloadPDF(order)}
                    className="p-2 hover:bg-primary/20 hover:text-primary rounded-lg transition-all" 
                    title="Descargar Factura"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
