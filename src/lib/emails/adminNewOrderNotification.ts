import nodemailer from 'nodemailer';
import type { Order, OrderItem } from '@/types';
import { getOrderContact } from '@/lib/orderContact';
import {
  buildOrderItemsEmailRows,
  buildOrderItemsEmailTableHead,
  buildOrderTotalsEmailHtml,
} from '@/lib/orderEmailHtml';

const LOGO_URL =
  'https://aoyafhjpgmxcygqnklvl.supabase.co/storage/v1/object/public/assets/logo/LOGO%20MELOMEREZCO%20completo%20color.png';

export function getAdminOrderNotifyEmail(): string {
  return (
    process.env.ADMIN_ORDER_EMAIL ||
    process.env.NACEX_USER ||
    'infobenalumox@gmail.com'
  ).trim();
}

export function getSiteUrl(): string {
  const url =
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    'https://modasmelomerezco.es';
  return url.replace(/\/$/, '');
}

export function buildAdminNewOrderEmailHtml(
  order: Order,
  items: OrderItem[],
  adminBaseUrl: string,
): string {
  const orderId = order.order_id.split('-')[0].toUpperCase();
  const contact = getOrderContact(order);
  const itemsHtml = items.length > 0 ? buildOrderItemsEmailRows(items) : '';
  const tableHead = buildOrderItemsEmailTableHead(items);
  const totalsHtml = buildOrderTotalsEmailHtml({ ...order, items });
  const adminUrl = `${adminBaseUrl}/admin`;
  const paymentLabel = order.payment_method || order.payment_status || '—';
  const carrierLabel = order.carrier || '—';

  const addressLines = [
    order.shipping_street,
    [order.shipping_floor, order.shipping_door].filter(Boolean).join(' ') &&
      `Piso ${order.shipping_floor || ''} ${order.shipping_door || ''}`.trim(),
    [order.shipping_zip, order.shipping_city, order.shipping_province].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .map((line) => `<p style="margin: 4px 0;">${line}</p>`)
    .join('');

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${LOGO_URL}" alt="Modas Me lo Merezco" style="width: 180px; height: auto;">
      </div>
      <h1 style="color: #000; text-transform: uppercase; font-style: italic; border-bottom: 2px solid #ff3366; padding-bottom: 16px; text-align: center; font-size: 22px;">
        Nuevo pedido <span style="color: #ff3366;">#${orderId}</span>
      </h1>
      <p style="text-align: center; font-size: 15px; color: #333;">
        Hay un pedido pagado listo para preparar. <strong>Genera la etiqueta Nacex</strong> desde el panel de administración.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${adminUrl}" style="background: #ff3366; color: #fff; padding: 16px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">
          Ir al admin → Pedidos
        </a>
      </div>

      <div style="background: #fff5f7; border: 1px solid #ffd6e0; padding: 20px; border-radius: 8px; margin: 24px 0; font-size: 14px;">
        <h3 style="margin: 0 0 12px 0; text-transform: uppercase; font-size: 11px; color: #ff3366; letter-spacing: 0.1em;">Cliente</h3>
        <p style="margin: 4px 0;"><strong>Nombre:</strong> ${contact.name || '—'}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${contact.email || '—'}</p>
        <p style="margin: 4px 0;"><strong>Teléfono:</strong> ${contact.phone || '—'}</p>
        <p style="margin: 4px 0;"><strong>Pago:</strong> ${paymentLabel}</p>
        <p style="margin: 4px 0;"><strong>Envío:</strong> ${carrierLabel}</p>
      </div>

      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; font-size: 13px;">
        <h4 style="margin: 0 0 10px 0; text-transform: uppercase; font-size: 11px; color: #888;">Dirección de envío</h4>
        ${addressLines || '<p>Sin dirección detallada</p>'}
      </div>

      ${
        items.length > 0
          ? `
      <div style="margin: 24px 0;">
        <h3 style="border-bottom: 1px solid #eee; padding-bottom: 8px; text-transform: uppercase; font-size: 11px; color: #888;">Artículos</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>${tableHead}</thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="margin-top: 16px; text-align: right; font-weight: bold;">${totalsHtml}</div>
      </div>`
          : ''
      }

      <p style="font-size: 12px; color: #666; text-align: center; margin-top: 24px;">
        ID completo del pedido: <code style="background: #f0f0f0; padding: 2px 6px;">${order.order_id}</code>
      </p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 11px; color: #999; text-align: center;">
        Panel admin: <a href="${adminUrl}">${adminUrl}</a>
      </p>
    </div>
  `;
}

/** Aviso a la tienda tras un pedido confirmado (pago OK o pedido test). */
export async function sendAdminNewOrderEmail(
  order: Order,
  items: OrderItem[] = [],
): Promise<void> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailPass) {
    console.warn('[admin-order-email] Gmail no configurado; no se envía aviso al admin.');
    return;
  }

  const to = getAdminOrderNotifyEmail();
  const adminBaseUrl = getSiteUrl();
  const orderItems = items.length > 0 ? items : order.items || [];
  const orderId = order.order_id.split('-')[0].toUpperCase();
  const contact = getOrderContact(order);
  const html = buildAdminNewOrderEmailHtml(order, orderItems, adminBaseUrl);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass },
  });

  await transporter.sendMail({
    from: `"Modas Me lo Merezco" <${gmailUser}>`,
    to,
    subject: `Nuevo pedido #${orderId} — generar etiqueta Nacex`,
    html,
    text: [
      `Nuevo pedido #${orderId}.`,
      `Cliente: ${contact.name || '—'} | ${contact.email || '—'} | ${contact.phone || '—'}`,
      `Total: ${Number(order.total_amount || 0).toFixed(2)}€`,
      `Entra en ${adminBaseUrl}/admin para generar la etiqueta Nacex.`,
    ].join('\n'),
  });
}
