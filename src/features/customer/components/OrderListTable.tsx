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
              <td className="py-6">
                {(() => {
                  const isPaid = order.payment_status?.toLowerCase() === 'paid' || order.order_status === 'Paid';
                  return (
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border w-fit ${
                      isPaid 
                        ? 'border-green-500/30 text-green-500 bg-green-500/5' 
                        : 'border-orange-500/30 text-orange-500 bg-orange-500/5'
                    }`}>
                      {isPaid ? 'Pagado' : 'Pendiente'}
                    </span>
                  );
                })()}
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
