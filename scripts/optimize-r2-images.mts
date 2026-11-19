/**
 * Re-optimiza las imágenes de producto existentes en Cloudflare R2:
 * - Redimensiona a máx. 720x960 (o 960x720 si es apaisada) sin ampliar.
 * - Recomprime a WebP (calidad 76, effort 6) si el tamaño resultante ahorra >15% o supera 120 KB.
 * - Actualiza `image_url` en `product_images` con nuevo parámetro `?v=<timestamp>` para invalidar caché CDN.
 *
 * Uso:
 *   npx tsx scripts/optimize-r2-images.mts
 */
import 'dotenv/config';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { getObject, keyFromPublicUrl, publicUrlForKey, uploadObject } from '../api/_r2.ts';

const MAX_DIM = 960;
const QUALITY = 76;
const MIN_BYTES_TO_PROCESS = 80 * 1024; // 80 KB

function withCacheBust(url: string): string {
  const base = url.split('?')[0];
  return `${base}?v=${Date.now()}`;
}

async function main() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Faltan VITE_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: rows, error } = await supabase
    .from('product_images')
    .select('id, product_id, image_url, original_url')
    .order('id', { ascending: false });

  if (error) throw error;

  console.log(`Encontradas ${rows?.length || 0} filas en product_images.`);

  let optimized = 0;
  let skipped = 0;
  let failed = 0;
  let savedBytesTotal = 0;

  for (const row of rows || []) {
    const rawUrl = (row.image_url as string | null)?.trim() || '';
    if (!rawUrl) {
      skipped += 1;
      continue;
    }

    const key = keyFromPublicUrl(rawUrl);
    if (!key) {
      skipped += 1;
      continue;
    }

    try {
      const obj = await getObject(key);
      if (!obj || !obj.body?.length) {
        skipped += 1;
        continue;
      }

      const originalSize = obj.body.length;
      const meta = await sharp(obj.body).metadata();
      const w = meta.width || 0;
      const h = meta.height || 0;
      const maxCurrentDim = Math.max(w, h);

      if (originalSize < MIN_BYTES_TO_PROCESS && maxCurrentDim <= MAX_DIM) {
        skipped += 1;
        continue;
      }

      const nextBuffer = await sharp(obj.body)
        .rotate()
        .resize(MAX_DIM, MAX_DIM, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: QUALITY, effort: 6 })
        .toBuffer();

      const nextSize = nextBuffer.length;
      if (nextSize >= originalSize * 0.9 && maxCurrentDim <= MAX_DIM) {
        skipped += 1;
        continue;
      }

      await uploadObject({
        key,
        body: nextBuffer,
        contentType: 'image/webp',
      });

      const canonicalUrl = withCacheBust(publicUrlForKey(key));
      const { error: updateErr } = await supabase
        .from('product_images')
        .update({ image_url: canonicalUrl })
        .eq('id', row.id);

      if (updateErr) throw updateErr;

      const saved = originalSize - nextSize;
      savedBytesTotal += Math.max(0, saved);
      optimized += 1;
      console.log(
        `[OK] #${row.id} (${key}): ${(originalSize / 1024).toFixed(1)} KB (${w}x${h}) → ${(nextSize / 1024).toFixed(1)} KB`
      );
    } catch (err) {
      failed += 1;
      console.error(`[FAIL] #${row.id} (${key}):`, err);
    }
  }

  console.log(
    `\nResumen: optimizadas=${optimized}, omitidas=${skipped}, fallos=${failed}, ahorro=${(
      savedBytesTotal /
      (1024 * 1024)
    ).toFixed(2)} MB`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
