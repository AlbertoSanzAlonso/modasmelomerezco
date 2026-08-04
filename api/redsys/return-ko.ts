import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleRedsysKo } from './_returnShared.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return handleRedsysKo(req, res);
}
