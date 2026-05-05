import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Nacex API Handler (Proxy to avoid CORS and hide credentials)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, cp } = req.query;

  // NACEX CREDENTIALS (TO BE FILLED)
  const NACEX_AGENCY = '2924';
  const NACEX_CLIENT = '478';
  const NACEX_PASS = process.env.NACEX_PASSWORD || '';

  if (method === 'get_puntos_shop') {
    // Mock response for now until we have the password
    const mockPoints = [
      { id: 'S001', name: 'Nacex Shop - Librería Central', address: 'Calle Mayor, 15', city: 'Madrid', zip: cp || '28001' },
      { id: 'S002', name: 'Nacex Shop - Papelería El Corte', address: 'Av. de la Libertad, 4', city: 'Madrid', zip: cp || '28001' },
      { id: 'S003', name: 'Nacex Shop - Farmacia 24h', address: 'Plaza del Sol, 2', city: 'Madrid', zip: cp || '28001' },
    ];

    return res.status(200).json(mockPoints);
  }

  return res.status(400).json({ error: 'Method not supported or missing password' });
}
