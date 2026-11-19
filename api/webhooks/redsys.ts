import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processRedsysPayment } from '../_redsysConfirm.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const result = await processRedsysPayment(req, 'webhook');

    switch (result.status) {
      case 'missing_params':
        return res.status(400).json({ message: 'Missing parameters' });
      case 'config_error':
        return res.status(500).json({ message: 'Server configuration error' });
      case 'invalid_signature':
        return res.status(401).json({ message: 'Invalid signature' });
      case 'payment_failed':
        return res.status(200).json({ message: 'Payment not successful' });
      case 'order_not_found':
        return res.status(404).json({ message: 'Order not found' });
      case 'already_paid':
        return res.status(200).json({ success: true, alreadyProcessed: true });
      case 'skipped':
        return res.status(200).json({ success: true, skipped: true });
      case 'confirmed':
        return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('[redsys-webhook] Error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
}
