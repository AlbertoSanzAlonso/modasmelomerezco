function base64ToBlob(base64: string, contentType: string): Blob {
  const bin = atob(base64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return new Blob([out], { type: contentType || 'application/octet-stream' });
}

/**
 * Devuelve una URL usable en canvas (blob:) a partir de un archivo local o URL remota.
 * Si el fetch directo falla por CORS, usa el proxy /api/chat (fetch-image).
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

  try {
    const res = await fetch(trimmed);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    if (!blob.size) throw new Error('Imagen vacía');
    return URL.createObjectURL(blob);
  } catch {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'fetch-image', url: trimmed.split('?')[0] }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'No se pudo cargar la imagen para recortar');
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
}
