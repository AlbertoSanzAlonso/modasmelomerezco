
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
      .upload(filePath, file, { upsert: true });

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
    // Extraer el nombre del archivo de la URL
    const parts = url.split('/');
    const fileName = parts.pop();

    if (!fileName) return;

    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([fileName]);

    if (error) {
      console.error('Error deleting from storage:', error);
    }
  },
};
