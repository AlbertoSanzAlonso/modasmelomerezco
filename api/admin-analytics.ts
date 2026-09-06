import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Stub temporal para diagnosticar fallos de deploy.
 * La implementación completa está en api/_lib/admin-analytics.ts
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  return res.status(503).json({
    code: 'NOT_CONFIGURED',
    message: 'Analíticas temporalmente en mantenimiento',
  });
}
