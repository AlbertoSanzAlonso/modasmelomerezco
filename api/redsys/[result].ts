import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleRedsysKo, handleRedsysOk } from './_returnShared.js';

/**
 * Una sola Serverless Function para /api/redsys/return-ok y /api/redsys/return-ko
 * (Hobby plan: máx. 12 funciones).
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const raw = req.query.result;
  const result = Array.isArray(raw) ? raw[0] : raw;

  if (result === 'return-ok') return handleRedsysOk(req, res);
  if (result === 'return-ko') return handleRedsysKo(req, res);

  return res.status(404).json({ message: 'Not found' });
}
