import React from 'react';
import { Button } from "@/components/ui/Button";
import type { Order } from "@/types";
import { api } from '@/lib/api';
import type { AdminOrderListFilter } from '@/lib/api/orders';
import { canFulfillOrder } from '@/lib/orderPayment';
import { getOrderContact } from '@/lib/orderContact';

interface OrdersTabProps {
  orders?: Order[];
  orderPage: number;
  pageSize: number;
  listFilter: AdminOrderListFilter;
  onListFilterChange: (filter: AdminOrderListFilter) => void;
  onPageChange: (page: number) => void;
  onOrderClick: (order: Order) => void;
  onGenerateLabel: (orderId: string) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  orderPage,
  pageSize,
  listFilter,
  onListFilterChange,
  onPageChange,
  onOrderClick,
  onGenerateLabel
}) => {
  const isAwaiting = listFilter === 'awaiting_payment';
  const isFulfilled = listFilter === 'fulfilled';

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Gestión de Pedidos</h2>
          <p className="text-gray-500 text-sm">
            {isAwaiting
              ? 'Borradores de cobro: el cliente aún no ha pagado en Redsys.'
              : isFulfilled
                ? 'Controla las ventas confirmadas y genera etiquetas de envío.'
                : 'Controla todos los pedidos, pagos pendientes y genera etiquetas de envío.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={listFilter === 'all' ? 'default' : 'outline'}
            className="text-[9px] font-black tracking-widest px-4 rounded-xl"
            onClick={() => onListFilterChange('all')}
          >
            TODOS
          </Button>
          <Button
            size="sm"
            variant={isFulfilled ? 'default' : 'outline'}
            className="text-[9px] font-black tracking-widest px-4 rounded-xl"
            onClick={() => onListFilterChange('fulfilled')}
          >
            VENTAS
          </Button>
          <Button
            size="sm"
            variant={isAwaiting ? 'default' : 'outline'}
            className="text-[9px] font-black tracking-widest px-4 rounded-xl"
            onClick={() => onListFilterChange('awaiting_payment')}
          >
            PAGO PENDIENTE
          </Button>
        </div>
      </div>

      <div className="bg-(--bg-card) border border-(--border-main) overflow-hidden rounded-[2.5rem] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-(--border-main) bg-(--bg-main)/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Pedido</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Cliente</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Total</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Estado</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary text-right">Logística</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-main)">
              {orders?.map((order) => {
                const contact = getOrderContact(order);
                const isPaidStatus =
                  order.order_status === 'Paid' ||
                  order.order_status === 'Shipped' ||
                  order.order_status === 'Delivered';
                const isCancelled = order.order_status === 'Cancelled';
                return (
                <tr key={order.order_id} 
                    onClick={() => onOrderClick(order)}
                    className="hover:bg-primary/5 transition-colors group cursor-pointer">
                  <td className="px-8 py-6 text-sm font-black italic text-(--text-main)">#{order.order_id.split('-')[0].toUpperCase()}</td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold uppercase italic text-(--text-main)">
                      {contact.name || 'Sin nombre'}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{new Date(order.order_date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-6 text-sm font-black italic text-(--text-main)">{order.total_amount.toFixed(2)}€</td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 border rounded-lg ${
                      isPaidStatus
                        ? 'border-green-500/30 bg-green-500/5 text-green-500'
                        : isCancelled
                          ? 'border-red-500/30 bg-red-500/5 text-red-500'
                          : 'border-yellow-500/30 bg-yellow-500/5 text-yellow-500'
                    }`}>
                      {order.order_status === 'Pending' ? 'ESPERANDO PAGO' : (order.order_status || '').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {order.tracking_number ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[9px] font-black tracking-widest px-4 border-green-500/40 text-green-600 hover:bg-green-500 hover:text-white rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          api.shipping.openNacexLabel(undefined, order.tracking_number!);
                        }}
                      >
                        VER ETIQUETA
                      </Button>
                    ) : canFulfillOrder(order) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[9px] font-black tracking-widest px-4 border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          onGenerateLabel(order.order_id);
                        }}
                      >
                        GENERAR NACEX
                      </Button>
                    ) : isCancelled ? (
                      <span className="text-[9px] font-black uppercase tracking-widest text-red-500 px-2">
                        Cancelado
                      </span>
                    ) : (
                      <span className="text-[9px] font-black uppercase tracking-widest text-yellow-600 px-2">
                        Pago pendiente
                      </span>
                    )}
                  </td>
                </tr>
              );
              })}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-gray-500 text-xs font-bold uppercase italic">
                    {isAwaiting
                      ? 'No hay pagos pendientes'
                      : isFulfilled
                        ? 'No hay ventas registradas'
                        : 'No hay pedidos registrados'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center items-center gap-4 mt-10 pb-10">
          <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, orderPage - 1))} disabled={orderPage === 1} className="text-[10px] font-black uppercase tracking-widest px-6">Anterior</Button>
          <span className="text-[10px] font-black text-primary bg-primary/10 px-4 py-2 rounded-lg">PÁGINA {orderPage}</span>
          <Button variant="outline" size="sm" onClick={() => onPageChange(orderPage + 1)} disabled={!orders || orders.length < pageSize} className="text-[10px] font-black uppercase tracking-widest px-6">Siguiente</Button>
        </div>
      </div>
    </div>
  );
};
