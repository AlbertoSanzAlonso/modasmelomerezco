function base64ToBlob(base64: string, contentType: string): Blob {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return new Blob([out], { type: contentType || 'application/octet-stream' });
}

function needsCorsProxy(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    // R2 público (*.r2.dev) no envía Access-Control-Allow-Origin
    return (
      host.endsWith('.r2.dev') ||
      host.endsWith('.supabase.co') ||
      host.endsWith('.insforge.app')
    );
  } catch {
    return false;
  }
}

async function fetchViaProxy(url: string): Promise<string> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'fetch-image', url: url.split('?')[0] }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { message?: string }).message ||
        'No se pudo cargar la imagen para recortar'
    );
  }
  const data = (await res.json()) as {
    imageBase64?: string;
    contentType?: string;
  };
  if (!data.imageBase64) {
    throw new Error('Respuesta de imagen inválida');
  }
  return URL.createObjectURL(
    base64ToBlob(data.imageBase64, data.contentType || 'image/jpeg')
  );
}

/**
 * Devuelve una URL usable en canvas (blob:) a partir de un archivo local o URL remota.
 * URLs R2 van directo al proxy (no tienen CORS). Otras URLs intentan fetch y caen al proxy.
 */
export async function resolveImageForCrop(source: string | Blob): Promise<string> {
  if (typeof source !== 'string') {
    return URL.createObjectURL(source);
  }

  const trimmed = source.trim();
  if (!trimmed) throw new Error('Imagen vacía');
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  if (needsCorsProxy(trimmed)) {
    return fetchViaProxy(trimmed);
  }

  try {
    const res = await fetch(trimmed);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    if (!blob.size) throw new Error('Imagen vacía');
    return URL.createObjectURL(blob);
  } catch {
    return fetchViaProxy(trimmed);
  }
}
