import type { Order, OrderItem } from '@/types';
import {
  getOrderDiscountAmount,
  getOrderItemLineDiscount,
  getOrderItemLineFinal,
  getOrderItemLineOriginal,
  getOrderItemOriginalUnit,
  orderHasDiscount,
  orderItemHasDiscount,
} from './orderPricing';

function formatItemSize(item: OrderItem): string {
  if (!item.size) return '';
  const color =
    item.color && item.color !== 'Único' ? ` · ${item.color}` : '';
  return `<span style="color: #ff3366;">(Talla: ${item.size}${color})</span>`;
}

export function buildOrderItemsEmailRows(items: OrderItem[]): string {
  const showDiscountCol = items.some(orderItemHasDiscount);

  if (!showDiscountCol) {
    return items
      .map(
        (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0; font-size: 12px;">${item.name || `Producto #${item.product_id}`} ${formatItemSize(item)}</td>
        <td style="padding: 10px 0; text-align: center; font-size: 12px;">${item.quantity}</td>
        <td style="padding: 10px 0; text-align: right; font-size: 12px;">${getOrderItemOriginalUnit(item).toFixed(2)}€</td>
        <td style="padding: 10px 0; text-align: right; font-size: 12px; font-weight: bold;">${getOrderItemLineFinal(item).toFixed(2)}€</td>
      </tr>
    `
      )
      .join('');
  }

  return items
    .map((item) => {
      const lineDiscount = getOrderItemLineDiscount(item);
      const hasLineDiscount = orderItemHasDiscount(item);
      return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0; font-size: 12px;">${item.name || `Producto #${item.product_id}`} ${formatItemSize(item)}</td>
        <td style="padding: 10px 0; text-align: center; font-size: 12px;">${item.quantity}</td>
        <td style="padding: 10px 0; text-align: right; font-size: 12px;">${getOrderItemLineOriginal(item).toFixed(2)}€</td>
        <td style="padding: 10px 0; text-align: right; font-size: 12px; color: #ff3366;">${hasLineDiscount ? `−${lineDiscount.toFixed(2)}€` : '—'}</td>
        <td style="padding: 10px 0; text-align: right; font-size: 12px; font-weight: bold;">${getOrderItemLineFinal(item).toFixed(2)}€</td>
      </tr>
    `;
    })
    .join('');
}

export function buildOrderItemsEmailTableHead(items: OrderItem[]): string {
  const showDiscountCol = items.some(orderItemHasDiscount);
  if (!showDiscountCol) {
    return `
      <tr style="border-bottom: 2px solid #eee; text-align: left; color: #888; text-transform: uppercase; font-size: 10px;">
        <th style="padding-bottom: 10px;">Artículo</th>
        <th style="padding-bottom: 10px; text-align: center;">Cant.</th>
        <th style="padding-bottom: 10px; text-align: right;">P. unit.</th>
        <th style="padding-bottom: 10px; text-align: right;">Total</th>
      </tr>
    `;
  }
  return `
      <tr style="border-bottom: 2px solid #eee; text-align: left; color: #888; text-transform: uppercase; font-size: 10px;">
        <th style="padding-bottom: 10px;">Artículo</th>
        <th style="padding-bottom: 10px; text-align: center;">Cant.</th>
        <th style="padding-bottom: 10px; text-align: right;">Precio</th>
        <th style="padding-bottom: 10px; text-align: right;">Descuento</th>
        <th style="padding-bottom: 10px; text-align: right;">Total</th>
      </tr>
    `;
}

export function buildOrderTotalsEmailHtml(order: Order): string {
  const hasDiscount = orderHasDiscount(order);
  const discountAmount = getOrderDiscountAmount(order);
  const subtotal = order.subtotal ?? order.total_amount - (order.shipping_cost || 0);

  let html = `<p style="margin: 5px 0; font-size: 12px; color: #888; font-weight: normal;">Subtotal: ${subtotal.toFixed(2)}€</p>`;
  if (hasDiscount) {
    html += `<p style="margin: 5px 0; font-size: 12px; color: #ff3366; font-weight: normal;">Descuento${order.discount_code ? ` (${order.discount_code})` : ''}: −${discountAmount.toFixed(2)}€</p>`;
  }
  html += `<p style="margin: 5px 0; font-size: 12px; color: #888; font-weight: normal;">Envío: ${order.shipping_cost?.toFixed(2) || '0.00'}€</p>`;
  html += `<p style="margin: 10px 0; font-size: 18px; color: #000;">TOTAL: ${order.total_amount.toFixed(2)}€</p>`;
  return html;
}
