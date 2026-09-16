import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Product } from '@/types';

function base64ToBlob(base64: string, contentType: string): Blob {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return new Blob([out], { type: contentType || 'application/octet-stream' });
}

function needsCorsProxy(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === 'media.modasmelomerezco.es' ||
      host.endsWith('.r2.dev') ||
      host.endsWith('.supabase.co') ||
      host.endsWith('.insforge.app')
    );
  } catch {
    return false;
  }
}

function extensionFromUrl(url: string, contentType?: string): string {
  const fromPath = url.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (fromPath && /^[a-z0-9]{2,5}$/.test(fromPath)) return fromPath;
  if (contentType?.includes('webp')) return 'webp';
  if (contentType?.includes('png')) return 'png';
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return 'jpg';
  return 'jpg';
}

async function fetchImageBlob(url: string): Promise<{ blob: Blob; contentType: string }> {
  const cleanUrl = url.split('?')[0];

  if (!needsCorsProxy(cleanUrl)) {
    const response = await fetch(cleanUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const blob = await response.blob();
    if (!blob.size) throw new Error('Imagen vacía');
    return { blob, contentType: blob.type || 'application/octet-stream' };
  }

  // R2 público no envía CORS: hay que pasar por el proxy del servidor
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'fetch-image', url: cleanUrl }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message || `HTTP ${res.status}`
    );
  }
  const data = (await res.json()) as {
    imageBase64?: string;
    contentType?: string;
  };
  if (!data.imageBase64) {
    throw new Error('Respuesta de imagen inválida');
  }
  const contentType = data.contentType || 'application/octet-stream';
  return {
    blob: base64ToBlob(data.imageBase64, contentType),
    contentType,
  };
}

export const downloadProductImagesAsZip = async (products: Product[]) => {
  const zip = new JSZip();
  const folder = zip.folder('imagenes-productos');
  let added = 0;
  let failed = 0;

  const downloadPromises = products.flatMap((product) => {
    const productName = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const productFolder = folder?.folder(productName);

    return (product.images || []).map(async (url, index) => {
      try {
        const { blob, contentType } = await fetchImageBlob(url);
        const extension = extensionFromUrl(url, contentType);
        productFolder?.file(`${productName}_${index + 1}.${extension}`, blob);
        added += 1;
      } catch (error) {
        failed += 1;
        console.error(`Error downloading image ${url}:`, error);
      }
    });
  });

  await Promise.all(downloadPromises);

  if (added === 0) {
    throw new Error(
      failed > 0
        ? 'No se pudo descargar ninguna imagen (archivos ausentes o error de red).'
        : 'Este producto no tiene imágenes.'
    );
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const fileName =
    products.length === 1
      ? `fotos_${products[0].name.toLowerCase().replace(/\s+/g, '_')}.zip`
      : `fotos_seleccion_${products.length}_productos.zip`;

  saveAs(content, fileName);
};
