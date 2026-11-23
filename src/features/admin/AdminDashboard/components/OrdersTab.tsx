import React from 'react';
import { Trash2, X } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import type { Order } from "@/types";
import type { AdminOrderListFilter } from '@/lib/api/orders';
import { canFulfillOrder } from '@/lib/orderPayment';
import { getOrderContact } from '@/lib/orderContact';

interface OrdersTabProps {
  orders?: Order[];
  orderPage: number;
  pageSize: number;
  listFilter: AdminOrderListFilter;
  selectedIds: string[];
  isDeleting?: boolean;
  onListFilterChange: (filter: AdminOrderListFilter) => void;
  onPageChange: (page: number) => void;
  onOrderClick: (order: Order) => void;
  onGenerateLabel: (orderId: string) => void;
  onViewLabel: (order: Order) => void;
  onToggleSelectAll: () => void;
  onToggleSelect: (orderId: string) => void;
  onClearSelection: () => void;
  onDeleteOrder: (order: Order) => void;
  onBulkDelete: () => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({
  orders,
  orderPage,
  pageSize,
  listFilter,
  selectedIds,
  isDeleting = false,
  onListFilterChange,
  onPageChange,
  onOrderClick,
  onGenerateLabel,
  onViewLabel,
  onToggleSelectAll,
  onToggleSelect,
  onClearSelection,
  onDeleteOrder,
  onBulkDelete,
}) => {
  const isAwaiting = listFilter === 'awaiting_payment';
  const isFulfilled = listFilter === 'fulfilled';
  const allOnPageSelected = Boolean(
    orders && orders.length > 0 && orders.every((o) => selectedIds.includes(o.order_id))
  );

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

      {selectedIds.length > 0 && (
        <div className="bg-primary text-white p-4 sm:p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-4 animate-in slide-in-from-top duration-300 min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 shrink-0 rounded-full bg-white/20 flex items-center justify-center font-black text-xs">
                {selectedIds.length}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest truncate">
                {selectedIds.length === 1 ? 'Pedido seleccionado' : 'Pedidos seleccionados'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClearSelection}
              disabled={isDeleting}
              className="sm:hidden p-2 text-white/60 hover:text-white transition-colors disabled:opacity-50"
              aria-label="Quitar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onBulkDelete}
              disabled={isDeleting}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Eliminando…' : 'Eliminar seleccionados'}
            </button>
            <button
              type="button"
              onClick={onClearSelection}
              disabled={isDeleting}
              className="hidden sm:inline-flex px-3 py-2.5 text-white/60 hover:text-white transition-colors items-center justify-center disabled:opacity-50"
              aria-label="Quitar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-(--bg-card) border border-(--border-main) overflow-hidden rounded-[2.5rem] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[860px]">
            <thead>
              <tr className="border-b border-(--border-main) bg-(--bg-main)/50">
                <th className="pl-6 pr-2 py-6 w-10">
                  <input
                    type="checkbox"
                    className="accent-primary w-4 h-4 rounded cursor-pointer"
                    checked={allOnPageSelected}
                    disabled={!orders || orders.length === 0 || isDeleting}
                    onChange={onToggleSelectAll}
                    aria-label="Seleccionar todos los pedidos de esta página"
                  />
                </th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Pedido</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Cliente</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Total</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Estado</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary text-right">Logística</th>
                <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-main)">
              {orders?.map((order) => {
                const contact = getOrderContact(order);
                const isSelected = selectedIds.includes(order.order_id);
                const isPaidStatus =
                  order.order_status === 'Paid' ||
                  order.order_status === 'Shipped' ||
                  order.order_status === 'Delivered';
                const isCancelled = order.order_status === 'Cancelled';
                return (
                <tr key={order.order_id} 
                    onClick={() => onOrderClick(order)}
                    className={`hover:bg-primary/5 transition-colors group cursor-pointer ${isSelected ? 'bg-primary/5' : ''}`}>
                  <td className="pl-6 pr-2 py-6" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      className="accent-primary w-4 h-4 rounded cursor-pointer"
                      checked={isSelected}
                      disabled={isDeleting}
                      onChange={() => onToggleSelect(order.order_id)}
                      aria-label={`Seleccionar pedido #${order.order_id.split('-')[0].toUpperCase()}`}
                    />
                  </td>
                  <td className="px-6 py-6 text-sm font-black italic text-(--text-main)">#{order.order_id.split('-')[0].toUpperCase()}</td>
                  <td className="px-6 py-6">
                    <p className="text-sm font-bold uppercase italic text-(--text-main)">
                      {contact.name || 'Sin nombre'}
                    </p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{new Date(order.order_date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-6 text-sm font-black italic text-(--text-main)">{order.total_amount.toFixed(2)}€</td>
                  <td className="px-6 py-6">
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
                  <td className="px-6 py-6 text-right">
                    {order.tracking_number ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-[9px] font-black tracking-widest px-4 border-green-500/40 text-green-600 hover:bg-green-500 hover:text-white rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewLabel(order);
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
                  <td className="px-6 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      disabled={isDeleting}
                      className="p-2.5 text-gray-400 hover:text-red-500 transition-colors bg-transparent rounded-full hover:bg-red-500/10 disabled:opacity-40"
                      title="Eliminar pedido"
                      aria-label={`Eliminar pedido #${order.order_id.split('-')[0].toUpperCase()}`}
                      onClick={() => onDeleteOrder(order)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
              })}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-8 py-16 text-center text-gray-500 text-xs font-bold uppercase italic">
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
