
import { supabase } from '../supabase';

const BUCKET = 'products';

export const storage = {
  /**
   * Sube un archivo al bucket 'products' de Supabase Storage.
   */
  upload: async (file: File, customPath?: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const filePath = customPath || `${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, { 
        upsert: true,
        cacheControl: '0'
      });

    if (error) {
      throw error;
    }

    // Obtener la URL pública
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    return publicUrl;
  },

  /**
   * Borra un archivo del bucket.
   */
  delete: async (url: string): Promise<void> => {
    try {
      const marker = `/object/public/${BUCKET}/`;
      const idx = url.indexOf(marker);
      let filePath = '';
      if (idx !== -1) {
        filePath = decodeURIComponent(url.slice(idx + marker.length).split('?')[0]);
      } else {
        const parts = url.split('/');
        filePath = decodeURIComponent((parts.pop() || '').split('?')[0]);
      }
      if (!filePath) return;

      const { error } = await supabase.storage.from(BUCKET).remove([filePath]);
      if (error) console.error('Error deleting from storage:', error);
    } catch (err) {
      console.error('Error deleting from storage:', err);
    }
  },
};
