import type { VercelRequest, VercelResponse } from '@vercel/node';
import sharp from 'sharp';

/** Un solo endpoint: chat/embed + convert-webp (límite Hobby: máx. 12 functions). */
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body as { action?: string };

  if (action === 'convert-webp') {
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

  if (action === 'embed') {
    const { input } = req.body as { input?: string };
    if (!input) return res.status(400).json({ error: 'Missing input' });

    const apiKey = process.env.VITE_OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured' });

    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ model: 'text-embedding-3-small', input }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[chat/embed] OpenAI error:', response.status, JSON.stringify(data));
        return res.status(response.status).json({ error: 'Embedding failed', detail: data });
      }
      return res.status(200).json(data);
    } catch (error) {
      console.error('[chat/embed]', error);
      return res.status(500).json({ error: 'Embedding failed' });
    }
  }

  if (action === 'chat') {
    const { messages, systemPrompt, model = 'llama-3.1-8b-instant' } = req.body as {
      messages?: { role: string; content: string }[];
      systemPrompt?: string;
      model?: string;
    };

    if (!messages || !systemPrompt) {
      return res.status(400).json({ error: 'Missing messages or systemPrompt' });
    }

    const apiKey = process.env.VITE_GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Groq API key not configured' });

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
          temperature: 0.6,
          max_tokens: 600,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('[chat/chat] Groq error:', response.status, JSON.stringify(data));
        return res.status(response.status).json({ error: 'Chat failed', detail: data });
      }
      return res.status(200).json(data);
    } catch (error) {
      console.error('[chat/chat]', error);
      return res.status(500).json({ error: 'Chat completion failed' });
    }
  }

  return res.status(400).json({ error: 'Invalid action' });
}
