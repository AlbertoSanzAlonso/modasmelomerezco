import type { VercelRequest, VercelResponse } from '@vercel/node';
import sharp from 'sharp';
import { deleteObject, getObject, isR2PublicUrl, keyFromPublicUrl, uploadObject } from './_r2.js';

/** Un solo endpoint: chat/embed + convert-webp + R2 upload (límite Hobby: máx. 12 functions). */
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function guessContentType(fileName: string, fallback?: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    case 'svg':
      return 'image/svg+xml';
    default:
      return fallback || 'application/octet-stream';
  }
}

function mediaKeyFromQuery(req: VercelRequest): string | null {
  const raw = req.query?.k;
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string' || !value.trim()) return null;
  let key = value.trim();
  try {
    key = decodeURIComponent(key);
  } catch {
    // ya viene decodificada
  }
  key = key.replace(/^\/+/, '');
  if (!key || key.includes('..') || /^https?:\/\//i.test(key)) return null;
  return key;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Proxy de imágenes R2 (r2.dev público no responde)
  if (req.method === 'GET') {
    try {
      const key = mediaKeyFromQuery(req);
      if (!key) {
        return res.status(400).json({ message: 'Missing or invalid k' });
      }
      const obj = await getObject(key);
      if (!obj) {
        return res.status(404).json({ message: 'Image not found' });
      }
      const contentType =
        obj.contentType && obj.contentType !== 'application/octet-stream'
          ? obj.contentType
          : guessContentType(key, obj.contentType);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).send(obj.body);
    } catch (error: unknown) {
      console.error('serve-image error:', error);
      const message =
        error instanceof Error ? error.message : 'Error serving image';
      return res.status(500).json({ message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body as { action?: string };

  if (action === 'upload-image') {
    try {
      const imageBase64 =
        typeof req.body?.imageBase64 === 'string' ? req.body.imageBase64 : '';
      const path =
        typeof req.body?.path === 'string' ? req.body.path.trim() : '';
      const contentType =
        typeof req.body?.contentType === 'string'
          ? req.body.contentType
          : undefined;

      if (!imageBase64) {
        return res.status(400).json({ message: 'Missing imageBase64' });
      }
      if (!path) {
        return res.status(400).json({ message: 'Missing path' });
      }

      const body = Buffer.from(imageBase64, 'base64');
      if (body.length < 24) {
        return res.status(400).json({ message: 'Image too small' });
      }

      const url = await uploadObject({
        key: path,
        body,
        contentType: guessContentType(path, contentType),
      });
      return res.status(200).json({ url });
    } catch (error: unknown) {
      console.error('upload-image error:', error);
      const message =
        error instanceof Error ? error.message : 'Error uploading image';
      return res.status(500).json({ message });
    }
  }

  if (action === 'delete-image') {
    try {
      const urlOrKey =
        typeof req.body?.url === 'string'
          ? req.body.url
          : typeof req.body?.key === 'string'
            ? req.body.key
            : '';
      if (!urlOrKey.trim()) {
        return res.status(400).json({ message: 'Missing url' });
      }
      await deleteObject(urlOrKey);
      return res.status(200).json({ ok: true });
    } catch (error: unknown) {
      console.error('delete-image error:', error);
      const message =
        error instanceof Error ? error.message : 'Error deleting image';
      return res.status(500).json({ message });
    }
  }

  if (action === 'fetch-image') {
    try {
      const rawUrl = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
      if (!rawUrl) {
        return res.status(400).json({ message: 'Missing url' });
      }

      let parsed: URL;
      try {
        parsed = new URL(rawUrl);
      } catch {
        return res.status(400).json({ message: 'Invalid url' });
      }

      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return res.status(400).json({ message: 'Invalid url protocol' });
      }

      const host = parsed.hostname.toLowerCase();
      const allowed =
        host.endsWith('.r2.dev') ||
        // legado: URLs antiguas de productos aún pueden apuntar aquí
        host.endsWith('.supabase.co') ||
        host.endsWith('.insforge.app') ||
        host === 'www.modasmelomerezco.es' ||
        host === 'modasmelomerezco.es' ||
        host === 'media.modasmelomerezco.es' ||
        host === 'localhost' ||
        host.endsWith('.vercel.app');
      if (!allowed) {
        return res.status(400).json({ message: 'Host not allowed' });
      }

      let buffer: Buffer;
      let contentType: string;

      // R2 vía API autenticada (CDN media / r2.dev / proxy)
      const r2Key =
        keyFromPublicUrl(rawUrl) ||
        (host.endsWith('.r2.dev') || host === 'media.modasmelomerezco.es'
          ? decodeURIComponent(parsed.pathname.replace(/^\//, ''))
          : null);
      if (
        r2Key &&
        (isR2PublicUrl(rawUrl) ||
          host.endsWith('.r2.dev') ||
          host === 'media.modasmelomerezco.es' ||
          parsed.pathname.endsWith('/api/chat'))
      ) {
        const obj = await getObject(r2Key);
        if (!obj) {
          return res.status(404).json({
            message:
              'La imagen ya no existe en el almacenamiento. Elimínala y sube una nueva.',
          });
        }
        buffer = obj.body;
        contentType = obj.contentType;
      } else {
        const upstream = await fetch(parsed.toString(), {
          headers: { Accept: 'image/*,*/*' },
        });
        if (!upstream.ok) {
          const status = upstream.status === 404 ? 404 : 502;
          return res.status(status).json({
            message:
              upstream.status === 404
                ? 'La imagen ya no existe. Elimínala y sube una nueva.'
                : `No se pudo descargar la imagen (${upstream.status})`,
          });
        }
        contentType = upstream.headers.get('content-type') || 'application/octet-stream';
        buffer = Buffer.from(await upstream.arrayBuffer());
      }

      if (buffer.length < 24) {
        return res.status(400).json({ message: 'Image too small' });
      }
      if (buffer.length > 12 * 1024 * 1024) {
        return res.status(400).json({ message: 'Image too large' });
      }

      return res.status(200).json({
        imageBase64: buffer.toString('base64'),
        contentType,
      });
    } catch (error: unknown) {
      console.error('fetch-image error:', error);
      const message =
        error instanceof Error ? error.message : 'Error fetching image';
      return res.status(500).json({ message });
    }
  }

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

    const apiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;
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
    const { messages, systemPrompt, model = 'openai/gpt-oss-20b' } = req.body as {
      messages?: { role: string; content: string }[];
      systemPrompt?: string;
      model?: string;
    };

    if (!messages || !systemPrompt) {
      return res.status(400).json({ error: 'Missing messages or systemPrompt' });
    }

    const apiKey = process.env.GROQ_API_KEY || process.env.VITE_GROQ_API_KEY;
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
