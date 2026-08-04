import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleRedsysOk } from './_returnShared.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return handleRedsysOk(req, res);
}
