import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

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

export function publicUrlForKey(key: string): string {
  const cleanKey = key.replace(/^\/+/, '');
  return `${getPublicBase()}/${cleanKey}`;
}

/** Extrae la key de una URL pública R2 o de un path relativo. */
export function keyFromPublicUrl(urlOrKey: string): string | null {
  const raw = urlOrKey.trim().split('?')[0];
  if (!raw) return null;

  try {
    const u = new URL(raw);
    if (u.hostname.endsWith('.r2.dev')) {
      return decodeURIComponent(u.pathname.replace(/^\//, ''));
    }
  } catch {
    // no es URL absoluta
  }

  try {
    const publicBase = getPublicBase();
    if (raw.startsWith(publicBase + '/') || raw === publicBase) {
      return decodeURIComponent(raw.slice(publicBase.length).replace(/^\//, ''));
    }
  } catch {
    // R2_PUBLIC_URL ausente o URL no absoluta
  }

  if (!/^https?:\/\//i.test(raw)) {
    return raw.replace(/^\/+/, '');
  }

  return null;
}

export function isR2PublicUrl(url: string): boolean {
  return keyFromPublicUrl(url) != null && /^https?:\/\//i.test(url.trim());
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
