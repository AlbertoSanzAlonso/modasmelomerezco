import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getCanonicalSiteUrl } from './_siteUrl.js';

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

function getPublicBase(): string {
  return requiredEnv('R2_PUBLIC_URL').replace(/\/+$/, '');
}

function getBucket(): string {
  return requiredEnv('R2_BUCKET');
}

let client: S3Client | null = null;

function getR2Client(): S3Client {
  if (client) return client;

  const accountId = requiredEnv('R2_ACCOUNT_ID');
  const endpoint =
    process.env.R2_ENDPOINT?.trim() ||
    `https://${accountId}.r2.cloudflarestorage.com`;

  client = new S3Client({
    region: 'auto',
    endpoint,
    // R2 (sobre todo buckets EU) suele requerir path-style
    forcePathStyle: true,
    credentials: {
      accessKeyId: requiredEnv('R2_ACCESS_KEY_ID'),
      secretAccessKey: requiredEnv('R2_SECRET_ACCESS_KEY'),
    },
  });

  return client;
}

/** URL pública servida por nuestro dominio (proxy). r2.dev público está caído/timeout. */
export function publicUrlForKey(key: string): string {
  const cleanKey = key.replace(/^\/+/, '');
  return `${getCanonicalSiteUrl()}/api/chat?k=${encodeURIComponent(cleanKey)}`;
}

/** Extrae la key de una URL de proxy, R2 pública o de un path relativo. */
export function keyFromPublicUrl(urlOrKey: string): string | null {
  const raw = urlOrKey.trim();
  if (!raw) return null;

  // Proxy del sitio: /api/chat?k=<key> (absoluta o relativa)
  try {
    const u = new URL(raw, getCanonicalSiteUrl());
    if (u.pathname === '/api/chat' || u.pathname.endsWith('/api/chat')) {
      const k = u.searchParams.get('k')?.trim();
      if (k) return decodeURIComponent(k).replace(/^\/+/, '');
    }
  } catch {
    // seguir con otros formatos
  }

  const withoutQuery = raw.split('?')[0];

  try {
    const u = new URL(withoutQuery);
    if (u.hostname.endsWith('.r2.dev')) {
      return decodeURIComponent(u.pathname.replace(/^\//, ''));
    }
  } catch {
    // no es URL absoluta
  }

  try {
    const publicBase = getPublicBase();
    if (withoutQuery.startsWith(publicBase + '/') || withoutQuery === publicBase) {
      return decodeURIComponent(withoutQuery.slice(publicBase.length).replace(/^\//, ''));
    }
  } catch {
    // R2_PUBLIC_URL ausente o URL no absoluta
  }

  if (!/^https?:\/\//i.test(withoutQuery)) {
    return withoutQuery.replace(/^\/+/, '');
  }

  return null;
}

export function isR2PublicUrl(url: string): boolean {
  return keyFromPublicUrl(url) != null && (
    /^https?:\/\//i.test(url.trim()) || url.trim().startsWith('/api/chat')
  );
}

export async function uploadObject(options: {
  key: string;
  body: Buffer;
  contentType?: string;
}): Promise<string> {
  const key = options.key.replace(/^\/+/, '');
  await getR2Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: options.body,
      ContentType: options.contentType || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );
  return publicUrlForKey(key);
}

export async function deleteObject(keyOrUrl: string): Promise<void> {
  const key = keyFromPublicUrl(keyOrUrl) || keyOrUrl.replace(/^\/+/, '');
  if (!key) return;

  await getR2Client().send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: key,
    }),
  );
}

/** Descarga un objeto R2 por key/URL pública. `null` si no existe. */
export async function getObject(
  keyOrUrl: string,
): Promise<{ body: Buffer; contentType: string } | null> {
  const key = keyFromPublicUrl(keyOrUrl) || keyOrUrl.replace(/^\/+/, '');
  if (!key) return null;

  try {
    const out = await getR2Client().send(
      new GetObjectCommand({
        Bucket: getBucket(),
        Key: key,
      }),
    );
    const bytes = await out.Body?.transformToByteArray();
    if (!bytes?.length) return null;
    return {
      body: Buffer.from(bytes),
      contentType: out.ContentType || 'application/octet-stream',
    };
  } catch (error: unknown) {
    const status =
      error &&
      typeof error === 'object' &&
      '$metadata' in error &&
      (error as { $metadata?: { httpStatusCode?: number } }).$metadata
        ?.httpStatusCode;
    const name =
      error && typeof error === 'object' && 'name' in error
        ? String((error as { name?: string }).name)
        : '';
    if (status === 404 || name === 'NoSuchKey' || name === 'NotFound') {
      return null;
    }
    throw error;
  }
}
