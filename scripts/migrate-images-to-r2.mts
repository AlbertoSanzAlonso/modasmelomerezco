/**
 * Migra image_url / swatch_url de Supabase Storage → Cloudflare R2.
 *
 * Uso (desde la raíz del repo, con .env cargado):
 *   npx tsx scripts/migrate-images-to-r2.mts
 *
 * No borra archivos en Supabase; solo sube a R2 y actualiza URLs en BD.
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { uploadObject } from '../api/_r2.ts';

const SUPABASE_MARKER = '/storage/v1/object/public/';

function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('.supabase.co/storage/') || url.includes(SUPABASE_MARKER);
}

async function download(url: string): Promise<{ body: Buffer; contentType?: string }> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Download failed ${res.status}: ${url}`);
  }
  const contentType = res.headers.get('content-type') || undefined;
  const ab = await res.arrayBuffer();
  return { body: Buffer.from(ab), contentType };
}

function keyFromSupabaseUrl(url: string): string {
  const idx = url.indexOf(SUPABASE_MARKER);
  if (idx !== -1) {
    return decodeURIComponent(url.slice(idx + SUPABASE_MARKER.length).split('?')[0]);
  }
  const parts = url.split('/');
  return decodeURIComponent((parts.pop() || `migrated-${Date.now()}`).split('?')[0]);
}

async function migrateUrl(url: string): Promise<string | null> {
  if (!url || !isSupabaseStorageUrl(url)) return null;
  const key = keyFromSupabaseUrl(url);
  const { body, contentType } = await download(url);
  return uploadObject({ key, body, contentType });
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  let ok = 0;
  let skip = 0;
  let fail = 0;

  const { data: images, error: imagesError } = await supabase
    .from('product_images')
    .select('id, image_url');

  if (imagesError) throw imagesError;

  for (const row of images || []) {
    const current = row.image_url as string;
    try {
      const next = await migrateUrl(current);
      if (!next) {
        skip += 1;
        continue;
      }
      const { error } = await supabase
        .from('product_images')
        .update({ image_url: next })
        .eq('id', row.id);
      if (error) throw error;
      ok += 1;
      console.log(`OK product_images#${row.id} → ${next}`);
    } catch (err) {
      fail += 1;
      console.error(`FAIL product_images#${row.id}:`, err);
    }
  }

  const { data: colors, error: colorsError } = await supabase
    .from('colors')
    .select('id, swatch_url')
    .not('swatch_url', 'is', null);

  if (colorsError) throw colorsError;

  for (const row of colors || []) {
    const current = row.swatch_url as string;
    try {
      const next = await migrateUrl(current);
      if (!next) {
        skip += 1;
        continue;
      }
      const { error } = await supabase
        .from('colors')
        .update({ swatch_url: next })
        .eq('id', row.id);
      if (error) throw error;
      ok += 1;
      console.log(`OK colors#${row.id} → ${next}`);
    } catch (err) {
      fail += 1;
      console.error(`FAIL colors#${row.id}:`, err);
    }
  }

  console.log(`\nHecho. ok=${ok} skip=${skip} fail=${fail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
