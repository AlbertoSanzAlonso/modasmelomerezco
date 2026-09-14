import { supabase } from '../supabase';
import type { Label } from '@/types';

export function slugifyLabel(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function isLabelsTableMissing(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const text = `${error.message || ''} ${(error as { details?: string }).details || ''}`.toLowerCase();
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    text.includes('labels') ||
    text.includes('does not exist')
  );
}

export const labels = {
  getAll: async (): Promise<Label[]> => {
    const { data, error } = await supabase
      .from('labels')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      if (isLabelsTableMissing(error)) {
        console.warn(
          '[labels] Tabla no encontrada. Aplica supabase/migrations/labels.sql en la base Postgres.'
        );
        return [];
      }
      throw error;
    }
    return data || [];
  },

  create: async (name: string): Promise<Label> => {
    const trimmed = name.trim();
    const slug = slugifyLabel(trimmed);
    const { data, error } = await supabase
      .from('labels')
      .insert([{ name: trimmed, slug }])
      .select()
      .single();

    if (error) {
      if (isLabelsTableMissing(error)) {
        throw new Error(
          'La tabla de etiquetas no existe. Aplica supabase/migrations/labels.sql en la base Postgres.'
        );
      }
      if (error.code === '23505') {
        const { data: existing } = await supabase
          .from('labels')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();
        if (existing) return existing;
      }
      throw error;
    }
    return data;
  },
};
