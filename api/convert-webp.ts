import type { VercelRequest, VercelResponse } from '@vercel/node';
import sharp from 'sharp';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

const ALLOWED_ORIGINS = [
  'https://www.modasmelomerezco.es',
  'https://modasmelomerezco.es',
  'https://modasmelomerezco.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const imageBase64 =
      typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64 : '';
    if (!imageBase64) {
      return res.status(400).json({ message: 'Missing imageBase64' });
    }

    const input = Buffer.from(imageBase64, 'base64');
    if (input.length < 24) {
      return res.status(400).json({ message: 'Image too small' });
    }

    const webp = await sharp(input).webp({ quality: 90 }).toBuffer();

    return res.status(200).json({
      webpBase64: webp.toString('base64'),
    });
  } catch (error: unknown) {
    console.error('convert-webp error:', error);
    const message =
      error instanceof Error ? error.message : 'Error converting to WebP';
    return res.status(500).json({ message });
  }
}
