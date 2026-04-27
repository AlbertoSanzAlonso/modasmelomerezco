
import React from 'react';
import type { Order, Product } from "@/types";
import { Button } from "@/components/ui/Button";

interface OverviewTabProps {
  orders?: Order[];
  products?: Product[];
  onViewAllOrders: () => void;
  onOrderClick: (order: Order) => void;
  onEditProduct: (product: Product) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  orders,
  products,
  onViewAllOrders,
  onOrderClick,
  onEditProduct
}) => {
  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 md:gap-0">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Vista General</h2>
          <p className="text-gray-500 text-sm">Resumen de actividad en tiempo real.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] overflow-hidden rounded-3xl shadow-sm">
          <div className="p-8 border-b border-[var(--border-main)] flex justify-between items-center">
            <h3 className="font-black uppercase tracking-widest text-xs text-[var(--text-main)]">Últimos Pedidos</h3>
            <button onClick={onViewAllOrders} className="text-primary text-[10px] font-black tracking-widest uppercase hover:underline">Ver todos</button>
          </div>
          <div className="divide-y divide-[var(--border-main)]">
            {orders?.slice(0, 5).map(order => (
              <div key={order.order_id} 
                   onClick={() => onOrderClick(order)}
                   className="p-6 hover:bg-primary/5 transition-colors flex justify-between items-center group cursor-pointer">
                <div className="flex gap-4 items-center">
                  <div className="px-4 h-10 bg-[var(--bg-main)] border border-[var(--border-main)] flex items-center justify-center font-mono text-[9px] text-primary font-black group-hover:border-primary/30 transition-all rounded-xl min-w-[90px]">
                    #{order.order_id.split('-')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase italic text-[var(--text-main)]">{order.customer?.name} {order.customer?.surname}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                      {new Date(order.order_date).toLocaleDateString()} • {order.items?.length || 0} artículos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-sm text-primary">{order.total_amount.toFixed(2)}€</p>
                  <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Ver Detalle</p>
                </div>
              </div>
            ))}
            {(!orders || orders.length === 0) && (
              <div className="p-12 text-center text-gray-500 text-xs font-bold uppercase italic">No hay pedidos registrados</div>
            )}
          </div>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border-main)] overflow-hidden rounded-3xl shadow-sm border-primary/20">
          <div className="p-8 border-b border-[var(--border-main)] bg-primary/5">
            <h3 className="font-black uppercase tracking-widest text-xs text-primary">Alertas de Stock</h3>
          </div>
          <div className="p-8 space-y-6">
            {(() => {
              const alerts = products?.flatMap(p => {
                if (!p.variants || p.variants.length === 0) {
                  return p.stock === 1 ? [{ p, size: 'Única' }] : [];
                }
                return p.variants.filter(v => v.stock === 1).map(v => ({ p, size: v.size }));
              }) || [];
              
              const displayedAlerts = alerts.slice(-5).reverse();

              if (displayedAlerts.length === 0) {
                return <p className="p-4 text-center text-gray-500 text-xs font-bold uppercase italic">Todo el stock está al día</p>;
              }

              return displayedAlerts.map((alert, idx) => (
                <div key={`${alert.p.product_id}-${alert.size}-${idx}`} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold uppercase italic text-[var(--text-main)]">{alert.p.name} - TALLA {alert.size}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{alert.p.category}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] font-black uppercase text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">ÚLTIMA UNIDAD</span>
                    <Button size="sm" variant="outline" className="text-[10px] h-8 px-4 font-black rounded-xl" onClick={() => onEditProduct(alert.p)}>EDITAR</Button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </>
  );
};
