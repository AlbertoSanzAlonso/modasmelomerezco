const WEBP_QUALITY = 0.9;

function isWebpBytes(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
}

async function encodeWebpViaCanvas(
  source: Blob,
  quality: number
): Promise<Blob | null> {
  const bitmap = await createImageBitmap(source);
  try {
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', quality);
    });
    if (!blob) return null;

    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (!isWebpBytes(bytes)) return null;
    return new Blob([bytes], { type: 'image/webp' });
  } finally {
    bitmap.close();
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function encodeWebpViaApi(source: Blob): Promise<Blob> {
  const bytes = new Uint8Array(await source.arrayBuffer());
  const response = await fetch('/api/convert-webp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64: bytesToBase64(bytes) }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'No se pudo convertir la imagen a WebP');
  }

  const data = (await response.json()) as { webpBase64?: string };
  if (!data.webpBase64) {
    throw new Error('Respuesta de conversión WebP inválida');
  }

  const out = base64ToBytes(data.webpBase64);
  if (!isWebpBytes(out)) {
    throw new Error('La conversión no generó un WebP válido');
  }
  return new Blob([out], { type: 'image/webp' });
}

/**
 * Garantiza un Blob WebP real (cabecera RIFF/WEBP).
 * Primero intenta el encoder del navegador; si falla, usa /api/convert-webp (sharp).
 */
export async function toWebpBlob(
  source: Blob,
  quality = WEBP_QUALITY
): Promise<Blob> {
  const inputBytes = new Uint8Array(await source.arrayBuffer());
  if (isWebpBytes(inputBytes)) {
    return source.type === 'image/webp'
      ? source
      : new Blob([inputBytes], { type: 'image/webp' });
  }

  try {
    const viaCanvas = await encodeWebpViaCanvas(source, quality);
    if (viaCanvas) return viaCanvas;
  } catch (err) {
    console.warn('Conversión WebP en canvas falló, usando API:', err);
  }

  return encodeWebpViaApi(source);
}
