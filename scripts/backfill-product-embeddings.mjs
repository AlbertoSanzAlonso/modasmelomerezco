/**
 * Regenera embeddings en `product_embeddings` para el chatbot (OpenAI text-embedding-3-small).
 *
 * Uso:
 *   node --env-file=.env scripts/backfill-product-embeddings.mjs
 *   node --env-file=.env scripts/backfill-product-embeddings.mjs --all
 *   node --env-file=.env scripts/backfill-product-embeddings.mjs --only=missing
 *
 * Por defecto solo rellena productos sin embedding (`--only=missing`).
 * Con `--all` regenera todos (útil si cambió el modelo o el texto indexado).
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

const args = new Set(process.argv.slice(2));
const reindexAll = args.has('--all');

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Faltan VITE_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}
if (!openaiKey) {
  console.error('Falta OPENAI_API_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function embed(input) {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input }),
  });
  const json = await response.json();
  if (!response.ok) {
    throw new Error(`OpenAI ${response.status}: ${JSON.stringify(json)}`);
  }
  const vector = json?.data?.[0]?.embedding;
  if (!Array.isArray(vector)) throw new Error('Respuesta OpenAI sin embedding');
  return vector;
}

async function syncOne(product, categoryName) {
  const content = `Producto: ${product.name}. Categoría: ${categoryName || ''}. Descripción: ${product.description || ''}`;
  const embedding = await embed(content);

  const { error: deleteErr } = await supabase
    .from('product_embeddings')
    .delete()
    .eq('product_id', product.product_id);
  if (deleteErr) throw deleteErr;

  const { error: insertErr } = await supabase.from('product_embeddings').insert({
    product_id: product.product_id,
    content,
    embedding,
  });
  if (insertErr) throw insertErr;
}

async function main() {
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('product_id, name, description, category_id, is_published, created_at')
    .order('created_at', { ascending: false });
  if (productsError) throw productsError;

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name');
  if (categoriesError) throw categoriesError;
  const categoryById = Object.fromEntries((categories || []).map((c) => [c.id, c.name]));

  const { data: embeddings, error: embError } = await supabase
    .from('product_embeddings')
    .select('product_id');
  if (embError) throw embError;

  const withEmb = new Set((embeddings || []).map((e) => e.product_id));
  const targets = (products || []).filter((p) => reindexAll || !withEmb.has(p.product_id));

  console.log(
    `Productos: ${products?.length ?? 0} | con embedding: ${withEmb.size} | a procesar: ${targets.length}` +
      (reindexAll ? ' (--all)' : ' (solo faltantes)'),
  );

  let ok = 0;
  let fail = 0;
  for (const product of targets) {
    const cat = categoryById[product.category_id] || '';
    try {
      await syncOne(product, cat);
      ok += 1;
      console.log(`OK  ${product.product_id}  ${product.name}`);
      // Evitar rate limit suave
      await new Promise((r) => setTimeout(r, 120));
    } catch (err) {
      fail += 1;
      console.error(`FAIL ${product.product_id}  ${product.name}:`, err.message || err);
    }
  }

  console.log(`Hecho. ok=${ok} fail=${fail}`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
