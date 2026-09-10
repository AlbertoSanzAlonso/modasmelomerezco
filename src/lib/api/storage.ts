import { supabase } from '../supabase';

const SUPABASE_BUCKET = 'products';

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function isSupabaseStorageUrl(url: string): boolean {
  return (
    url.includes('.supabase.co/storage/') ||
    url.includes(`/object/public/${SUPABASE_BUCKET}/`)
  );
}

function isR2PublicUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.endsWith('.r2.dev');
  } catch {
    return false;
  }
}

async function uploadToR2(file: File, filePath: string): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'upload-image',
      path: filePath,
      contentType: file.type || undefined,
      imageBase64: bytesToBase64(bytes),
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Error al subir la imagen a R2');
  }

  const data = (await response.json()) as { url?: string };
  if (!data.url) throw new Error('Respuesta de subida sin URL');
  return data.url;
}

async function deleteFromR2(url: string): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'delete-image', url }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('Error deleting from R2:', err.message || response.status);
  }
}

async function deleteFromSupabase(url: string): Promise<void> {
  try {
    const marker = `/object/public/${SUPABASE_BUCKET}/`;
    const idx = url.indexOf(marker);
    let filePath = '';
    if (idx !== -1) {
      filePath = decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
    } else {
      const parts = url.split('/');
      filePath = decodeURIComponent((parts.pop() || '').split('?')[0]);
    }
    if (!filePath) return;

    const { error } = await supabase.storage.from(SUPABASE_BUCKET).remove([filePath]);
    if (error) console.error('Error deleting from storage:', error);
  } catch (err) {
    console.error('Error deleting from storage:', err);
  }
}

export const storage = {
  /**
   * Sube un archivo a Cloudflare R2 y devuelve la URL pública.
   */
  upload: async (file: File, customPath?: string): Promise<string> => {
    const fileExt = file.name.split('.').pop() || 'bin';
    const filePath =
      customPath || `${Math.random().toString(36).substring(2)}.${fileExt}`;
    return uploadToR2(file, filePath);
  },

  /**
   * Borra un archivo. Soporta URLs de R2 y, en legado, Supabase Storage.
   */
  delete: async (url: string): Promise<void> => {
    if (!url?.trim()) return;
    if (isR2PublicUrl(url)) {
      await deleteFromR2(url);
      return;
    }
    if (isSupabaseStorageUrl(url)) {
      await deleteFromSupabase(url);
    }
  },
};
