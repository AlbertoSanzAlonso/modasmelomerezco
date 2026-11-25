import nodemailer from 'nodemailer';
import type { Order, OrderItem } from '../../types/index.js';
import { getOrderContact } from '../orderContact.js';
import { formatCarrierLabel, isStorePickup } from '../orderFulfillment.js';
import {
  buildOrderItemsEmailRows,
  buildOrderItemsEmailTableHead,
  buildOrderTotalsEmailHtml,
} from '../orderEmailHtml.js';

const LOGO_URL = 'https://www.modasmelomerezco.es/logo.png';

const DEFAULT_ADMIN_ORDER_EMAIL = 'infobenalumox@gmail.com';

export function getAdminOrderNotifyEmail(): string {
  const configured = process.env.ADMIN_ORDER_EMAIL?.trim();
  return configured || DEFAULT_ADMIN_ORDER_EMAIL;
}

function createGmailTransporter() {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (!gmailUser || !gmailPass) return null;

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: { user: gmailUser, pass: gmailPass },
  });
}

export function getSiteUrl(): string {
  const url =
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    'https://www.modasmelomerezco.es';
  return url.replace(/\/$/, '');
}

function buildAdminOrderUrl(adminBaseUrl: string, orderId: string): string {
  return `${adminBaseUrl}/admin?tab=orders&order=${encodeURIComponent(orderId)}`;
}

export function describeRedsysFailureCode(responseCode?: number): string {
  if (responseCode === undefined || !Number.isFinite(responseCode)) {
    return 'El cliente salió de la pasarela o no completó el pago.';
  }
  const padded = String(Math.trunc(responseCode)).padStart(4, '0');
  const map: Record<string, string> = {
    '0101': 'Tarjeta caducada (cód. 0101)',
    '0102': 'Tarjeta bloqueada temporalmente o bajo sospecha de fraude (cód. 0102)',
    '0106': 'Intentos de PIN excedidos (cód. 0106)',
    '0116': 'Saldo insuficiente en la tarjeta (cód. 0116)',
    '0118': 'Tarjeta no registrada (cód. 0118)',
    '0129': 'Código de seguridad (CVV2/CVC2) incorrecto (cód. 0129)',
    '0180': 'Tarjeta ajena al servicio (cód. 0180)',
    '0184': 'Error en la autenticación del titular (cód. 0184)',
    '0190': 'Denegación del banco emisor sin especificar motivo (cód. 0190)',
    '0191': 'Fecha de caducidad errónea (cód. 0191)',
    '9051': 'Número de pedido repetido (cód. 9051)',
    '9104': 'Comercio con titular seguro y titular sin clave (cód. 9104)',
    '9915': 'Cancelado por el cliente en la pasarela de pago (cód. 9915)',
  };
  return map[padded] || `Pago rechazado o no completado en Redsys (cód. ${padded})`;
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
  const adminUrl = buildAdminOrderUrl(adminBaseUrl, order.order_id);
  const paymentLabel = order.payment_method || order.payment_status || '—';
  const storePickup = isStorePickup(order);
  const carrierLabel = formatCarrierLabel(order.carrier);

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
        Hay un pedido pagado listo para preparar.
        ${storePickup
          ? ' El cliente lo recogerá en tienda (C/ Sol, 5, Benalmádena). Márcalo como recogido en el panel cuando se lo lleve.'
          : ' <strong>Genera la etiqueta Nacex</strong> desde el panel de administración.'}
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${adminUrl}" style="background: #ff3366; color: #fff; padding: 16px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">
          Ver pedido en admin →
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

export function buildAdminPaymentFailedEmailHtml(
  order: Order,
  items: OrderItem[],
  adminBaseUrl: string,
  responseCode?: number,
): string {
  const orderId = order.order_id.split('-')[0].toUpperCase();
  const contact = getOrderContact(order);
  const itemsHtml = items.length > 0 ? buildOrderItemsEmailRows(items) : '';
  const tableHead = buildOrderItemsEmailTableHead(items);
  const totalsHtml = buildOrderTotalsEmailHtml({ ...order, items });
  const adminOrderUrl = buildAdminOrderUrl(adminBaseUrl, order.order_id);
  const paymentLink = `${adminBaseUrl}/pagar/${order.order_id}`;
  const reason = describeRedsysFailureCode(responseCode);
  const paymentLabel = order.payment_method || 'Redsys';

  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #fde68a; padding: 40px; border-radius: 10px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <img src="${LOGO_URL}" alt="Modas Me lo Merezco" style="width: 180px; height: auto;">
      </div>

      <div style="background: #fffbeb; border: 1px solid #f59e0b; color: #92400e; padding: 12px 16px; border-radius: 8px; text-align: center; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 20px;">
        Pago NO completado — No enviar todavía
      </div>

      <h1 style="color: #000; text-transform: uppercase; font-style: italic; border-bottom: 2px solid #d97706; padding-bottom: 16px; text-align: center; font-size: 22px;">
        Intento sin pago <span style="color: #d97706;">#${orderId}</span>
      </h1>

      <p style="text-align: center; font-size: 14px; color: #333; line-height: 1.5;">
        Un cliente ha intentado comprar pero <strong>el pago no se ha completado</strong>.<br />
        <strong>Motivo:</strong> ${reason}
      </p>

      <p style="text-align: center; font-size: 13px; color: #555; line-height: 1.5;">
        Puedes abrir el pedido en el panel de administración para revisar los detalles y <strong>enviarle el correo con el enlace de pago</strong>.
      </p>

      <div style="text-align: center; margin: 28px 0;">
        <a href="${adminOrderUrl}" style="background: #d97706; color: #fff; padding: 16px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">
          Ver pedido en admin y enviar enlace de pago
        </a>
      </div>

      <div style="background: #fffbeb; border: 1px solid #fde68a; padding: 20px; border-radius: 8px; margin: 24px 0; font-size: 14px;">
        <h3 style="margin: 0 0 12px 0; text-transform: uppercase; font-size: 11px; color: #b45309; letter-spacing: 0.1em;">Cliente</h3>
        <p style="margin: 4px 0;"><strong>Nombre:</strong> ${contact.name || '—'}</p>
        <p style="margin: 4px 0;"><strong>Email:</strong> ${contact.email || '—'}</p>
        <p style="margin: 4px 0;"><strong>Teléfono:</strong> ${contact.phone || '—'}</p>
        <p style="margin: 4px 0;"><strong>Método:</strong> ${paymentLabel}</p>
      </div>

      ${
        items.length > 0
          ? `
      <div style="margin: 24px 0;">
        <h3 style="border-bottom: 1px solid #eee; padding-bottom: 8px; text-transform: uppercase; font-size: 11px; color: #888;">Artículos del intento</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>${tableHead}</thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="margin-top: 16px; text-align: right; font-weight: bold;">${totalsHtml}</div>
      </div>`
          : ''
      }

      <div style="background: #f9f9f9; padding: 14px 18px; border-radius: 8px; margin-top: 20px; font-size: 12px; color: #555;">
        <p style="margin: 0 0 6px 0; font-weight: bold; text-transform: uppercase; font-size: 10px; color: #888;">Enlace de pago directo (por si quieres copiarlo):</p>
        <p style="margin: 0; word-break: break-all;"><a href="${paymentLink}" style="color: #b45309;">${paymentLink}</a></p>
      </div>

      <p style="font-size: 12px; color: #666; text-align: center; margin-top: 24px;">
        ID completo del pedido: <code style="background: #f0f0f0; padding: 2px 6px;">${order.order_id}</code>
      </p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="font-size: 11px; color: #999; text-align: center;">
        Abrir pedido en admin: <a href="${adminOrderUrl}">${adminOrderUrl}</a>
      </p>
    </div>
  `;
}

function resolveOrderItems(order: Order, items: OrderItem[]): OrderItem[] {
  return items.length > 0 ? items : order.items || [];
}

/** Confirmación al cliente tras pago OK (webhook Redsys). */
export async function sendCustomerOrderConfirmationEmail(
  order: Order,
  items: OrderItem[] = [],
): Promise<void> {
  const customerEmail = order.customer_email?.trim();
  if (!customerEmail) {
    console.warn('[customer-order-email] Pedido sin customer_email; no se envía confirmación.');
    return;
  }

  const transporter = createGmailTransporter();
  if (!transporter) {
    console.warn('[customer-order-email] Gmail no configurado.');
    return;
  }

  const orderItems = resolveOrderItems(order, items);
  const orderId = order.order_id.split('-')[0].toUpperCase();
  const itemsHtml = orderItems.length > 0 ? buildOrderItemsEmailRows(orderItems) : '';
  const tableHead = buildOrderItemsEmailTableHead(orderItems);
  const totalsHtml = buildOrderTotalsEmailHtml({ ...order, items: orderItems });

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 10px;">
        <img src="${LOGO_URL}" alt="Modas Me lo Merezco" style="width: 200px; height: auto;">
      </div>
      <h1 style="color: #000; text-transform: uppercase; font-style: italic; border-bottom: 2px solid #000; padding-bottom: 20px; text-align: center;">
        Pedido <span style="color: #ff3366;">#${orderId}</span> Confirmado
      </h1>
      <p style="text-align: center;">¡Hola!</p>
      <p style="text-align: center;">Gracias por tu compra en <strong>Modas Me lo Merezco</strong>. Tu pedido ya ha sido pagado y está siendo preparado.</p>
      <div style="margin: 30px 0;">
        <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px; text-transform: uppercase; font-size: 12px; color: #888;">Detalles de tu compra</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>${tableHead}</thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="margin-top: 20px; text-align: right; font-weight: bold;">${totalsHtml}</div>
      </div>
      <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; font-size: 13px;">
        <h4 style="margin-top: 0; text-transform: uppercase; font-size: 11px; color: #888;">Dirección de Envío</h4>
        <p style="margin: 5px 0;">${order.shipping_street || ''}</p>
        <p style="margin: 5px 0;">${order.shipping_zip || ''} ${order.shipping_city || ''}, ${order.shipping_province || ''}</p>
      </div>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 11px; color: #999; text-align: center;">Si tienes alguna pregunta, simplemente responde a este email. Gracias por confiar en nosotros.</p>
    </div>
  `;

  const gmailUser = process.env.GMAIL_USER!;
  await transporter.sendMail({
    from: `"Modas Me lo Merezco" <${gmailUser}>`,
    to: customerEmail,
    subject: `Confirmación de pedido #${orderId} - Modas Me lo Merezco`,
    html,
  });
}

/** Aviso a la tienda tras un pedido confirmado (pago OK). */
export async function sendAdminNewOrderEmail(
  order: Order,
  items: OrderItem[] = [],
): Promise<void> {
  const transporter = createGmailTransporter();
  if (!transporter) {
    console.warn('[admin-order-email] Gmail no configurado; no se envía aviso al admin.');
    return;
  }

  const to = getAdminOrderNotifyEmail();
  const adminBaseUrl = getSiteUrl();
  const adminOrderUrl = buildAdminOrderUrl(adminBaseUrl, order.order_id);
  const orderItems = resolveOrderItems(order, items);
  const orderId = order.order_id.split('-')[0].toUpperCase();
  const contact = getOrderContact(order);
  const html = buildAdminNewOrderEmailHtml(order, orderItems, adminBaseUrl);
  const gmailUser = process.env.GMAIL_USER!;

  await transporter.sendMail({
    from: `"Modas Me lo Merezco" <${gmailUser}>`,
    to,
    subject: `Nuevo pedido #${orderId} — generar etiqueta Nacex`,
    html,
    text: [
      `Nuevo pedido pagado #${orderId}.`,
      `Cliente: ${contact.name || '—'} | ${contact.email || '—'} | ${contact.phone || '—'}`,
      `Total: ${Number(order.total_amount || 0).toFixed(2)}€`,
      `Ver pedido en admin: ${adminOrderUrl}`,
    ].join('\n'),
  });
}

/** Aviso distinto al admin cuando un pago falla o es cancelado en Redsys. */
export async function sendAdminPaymentFailedEmail(
  order: Order,
  items: OrderItem[] = [],
  responseCode?: number,
): Promise<boolean> {
  const transporter = createGmailTransporter();
  if (!transporter) {
    console.warn('[admin-payment-failed-email] Gmail no configurado; no se envía aviso al admin.');
    return false;
  }

  const to = getAdminOrderNotifyEmail();
  const adminBaseUrl = getSiteUrl();
  const adminOrderUrl = buildAdminOrderUrl(adminBaseUrl, order.order_id);
  const paymentLink = `${adminBaseUrl}/pagar/${order.order_id}`;
  const orderItems = resolveOrderItems(order, items);
  const orderId = order.order_id.split('-')[0].toUpperCase();
  const contact = getOrderContact(order);
  const reason = describeRedsysFailureCode(responseCode);
  const html = buildAdminPaymentFailedEmailHtml(order, orderItems, adminBaseUrl, responseCode);
  const gmailUser = process.env.GMAIL_USER!;

  try {
    await transporter.sendMail({
      from: `"Modas Me lo Merezco" <${gmailUser}>`,
      to,
      subject: `⚠️ Pago no completado en pedido #${orderId} — revisar en admin`,
      html,
      text: [
        `PAGO NO COMPLETADO — Pedido #${orderId} (NO ENVIAR TODAVÍA).`,
        `Motivo: ${reason}`,
        `Cliente: ${contact.name || '—'} | ${contact.email || '—'} | ${contact.phone || '—'}`,
        `Total: ${Number(order.total_amount || 0).toFixed(2)}€`,
        `Abrir pedido en admin para enviar correo de pago: ${adminOrderUrl}`,
        `Enlace directo de pago: ${paymentLink}`,
      ].join('\n'),
    });
    return true;
  } catch (err) {
    console.error('[admin-payment-failed-email] Error enviando aviso de pago fallido:', err);
    return false;
  }
}

/** Cliente + admin a la vez tras confirmar el pago. */
export async function sendOrderPaidEmails(
  order: Order,
  items: OrderItem[] = [],
): Promise<{ customer: boolean; admin: boolean }> {
  const orderItems = resolveOrderItems(order, items);
  const [customerResult, adminResult] = await Promise.allSettled([
    sendCustomerOrderConfirmationEmail(order, orderItems),
    sendAdminNewOrderEmail(order, orderItems),
  ]);

  if (customerResult.status === 'rejected') {
    console.error('[order-paid-email] Error confirmación cliente:', customerResult.reason);
  }
  if (adminResult.status === 'rejected') {
    console.error('[order-paid-email] Error aviso admin:', adminResult.reason);
  }

  return {
    customer: customerResult.status === 'fulfilled',
    admin: adminResult.status === 'fulfilled',
  };
}
