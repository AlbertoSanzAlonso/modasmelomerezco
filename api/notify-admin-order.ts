import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import type { Order, OrderItem } from '../src/types/index.js';
import { sendAdminNewOrderEmail } from '../src/lib/emails/adminNewOrderNotification.js';
import { handleAdminAnalytics } from './_adminAnalytics.js';

/**
 * POST: aviso de nuevo pedido al admin.
 * GET: analíticas Vercel (vía rewrite /api/admin-analytics).
 * Un solo endpoint para no superar el límite Hobby (máx. 12 functions).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, Accept'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return handleAdminAnalytics(req, res);
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const orderId = String(req.body?.orderId || '').trim();
  if (!orderId) {
    return res.status(400).json({ message: 'Falta orderId' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ message: 'Supabase no configurado' });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const { data: itemsRows } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    const items: OrderItem[] =
      itemsRows && itemsRows.length > 0
        ? itemsRows
        : Array.isArray((order as Order).items)
          ? (order as Order).items
          : [];

    await sendAdminNewOrderEmail(order as Order, items);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[notify-admin-order]', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al enviar aviso',
    });
  }
}
