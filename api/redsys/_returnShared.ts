import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCanonicalSiteUrl } from '../_siteUrl.js';

/**
 * Redsys hace POST a URLOK/URLKO. En una SPA el POST puede dejar al usuario
 * “colgado” o perder query params al redirigir a rutas protegidas.
 * Este endpoint acepta GET/POST y responde 303 hacia la página pública de resultado.
 */
function resolveOrigin(req: VercelRequest): string {
  const forwardedHost = req.headers['x-forwarded-host'];
  const hostHeader = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.headers.host;
  const host = hostHeader?.split(',')[0]?.trim();
  const forwardedProto = req.headers['x-forwarded-proto'];
  let proto =
    (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)?.split(',')[0]?.trim() ||
    'https';

  if (!host) return getCanonicalSiteUrl();

  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    proto = 'http';
  }

  return `${proto}://${host}`.replace(/\/$/, '');
}

function redirectToConfirmation(req: VercelRequest, res: VercelResponse, payment: 'success' | 'error') {
  const origin = resolveOrigin(req);
  const location = `${origin}/pedido-confirmado?payment=${payment}`;
  res.statusCode = 303;
  res.setHeader('Location', location);
  res.setHeader('Cache-Control', 'no-store');
  res.end();
}

export function handleRedsysOk(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  return redirectToConfirmation(req, res, 'success');
}

export function handleRedsysKo(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  return redirectToConfirmation(req, res, 'error');
}
