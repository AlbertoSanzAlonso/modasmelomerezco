/** Recogida en la tienda física (checkout: método `local`). */

export const STORE_PICKUP_LABEL = 'Recogida en tienda';
export const STORE_PICKUP_ADDRESS = 'C/ Sol, 5 — Benalmádena';

type PickupOrder = {
  carrier?: string | null;
  order_status?: string | null;
};

export function isStorePickup(order: { carrier?: string | null }): boolean {
  const carrier = (order.carrier || '').trim().toLowerCase();
  if (!carrier) return false;
  if (carrier === 'local' || carrier === 'recogida') return true;
  return carrier.includes('recogida en local') || carrier.includes('recogida en tienda');
}

export function isOrderPickedUp(order: PickupOrder): boolean {
  return isStorePickup(order) && order.order_status === 'Delivered';
}

/** Etiqueta del estado en el panel de administración. */
export function getAdminOrderStatusLabel(order: PickupOrder): string {
  if (isOrderPickedUp(order)) return 'RECOGIDO';
  if (isStorePickup(order) && order.order_status === 'Paid') return 'PENDIENTE RECOGIDA';
  switch (order.order_status) {
    case 'Pending':
      return 'ESPERANDO PAGO';
    case 'Paid':
      return 'PAGADO';
    case 'Shipped':
      return 'ENVIADO';
    case 'Delivered':
      return 'ENTREGADO';
    case 'Cancelled':
      return 'CANCELADO';
    default:
      return (order.order_status || '').toUpperCase();
  }
}

/** Etiqueta del estado en el área de cliente. */
export function getCustomerOrderStatusLabel(order: PickupOrder): string {
  if (isOrderPickedUp(order)) return 'Recogido';
  switch (order.order_status) {
    case 'Paid':
      return 'Pagado';
    case 'Shipped':
      return 'Enviado';
    case 'Delivered':
      return 'Entregado';
    case 'Cancelled':
      return 'Cancelado';
    default:
      return 'Pendiente';
  }
}

export function formatCarrierLabel(carrier?: string | null): string {
  if (isStorePickup({ carrier })) return STORE_PICKUP_LABEL;
  if (!carrier?.trim()) return '—';
  if (carrier === 'home') return 'Envío a domicilio';
  if (carrier === 'nacex_point') return 'Punto Nacex';
  return carrier;
}
