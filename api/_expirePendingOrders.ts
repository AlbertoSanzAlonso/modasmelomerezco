import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

/** Pedidos Pending sin pagar más antiguos que esto se cancelan. */
export const PENDING_ORDER_TTL_MS = 2 * 60 * 60 * 1000;

function isAuthorizedCron(req: VercelRequest): boolean {
  // Vercel Cron envía este header en invocaciones programadas.
  const vercelCron = req.headers['x-vercel-cron'];
  if (vercelCron === '1' || vercelCron === 'true') return true;

  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret) {
    const auth = req.headers.authorization || '';
    if (auth === `Bearer ${cronSecret}`) return true;
  }

  // Local / preview sin secret: permitir fuera de production.
  return process.env.VERCEL_ENV !== 'production';
}

/**
 * Cancela pedidos Pending (sin pago) con más de 2 horas.
 * Montado en notify-admin-order para no gastar una Serverless Function extra (Hobby).
 */
export async function handleExpirePendingOrders(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!isAuthorizedCron(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ message: 'Base de datos no configurada' });
  }

  const cutoff = new Date(Date.now() - PENDING_ORDER_TTL_MS).toISOString();
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        order_status: 'Cancelled',
        payment_status: 'Cancelled',
      })
      .eq('order_status', 'Pending')
      .lt('order_date', cutoff)
      .select('order_id');

    if (error) throw error;

    const cancelled = data?.length ?? 0;
    console.log(`[expire-pending-orders] Cancelados ${cancelled} pedidos Pending anteriores a ${cutoff}`);

    return res.status(200).json({
      success: true,
      cancelled,
      cutoff,
    });
  } catch (error) {
    console.error('[expire-pending-orders]', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error al cancelar pedidos',
    });
  }
}
