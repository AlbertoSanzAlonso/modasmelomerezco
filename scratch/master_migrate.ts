import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const {
  VITE_INSFORGE_URL: INSFORGE_URL,
  VITE_INSFORGE_API_KEY: INSFORGE_API_KEY,
  VITE_SUPABASE_URL: SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: SERVICE_ROLE_KEY
} = process.env;

if (!INSFORGE_URL || !INSFORGE_API_KEY || !SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Faltan variables de entorno.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const insHeaders = { 'apikey': INSFORGE_API_KEY, 'Authorization': `Bearer ${INSFORGE_API_KEY}` };

async function fetchInsforge(path: string) {
  const res = await fetch(`${INSFORGE_URL}/api/database/records/${path}`, { headers: insHeaders });
  return res.json();
}

async function uploadImage(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${url}`);
    const buffer = await res.buffer();
    const filename = url.split('/').pop()?.split('?')[0] || `img_${Date.now()}.jpg`;
    
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filename, buffer, {
        contentType: res.headers.get('content-type') || 'image/jpeg',
        upsert: true
      });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filename);
    return publicUrl;
  } catch (err) {
    console.error(`❌ Error subiendo imagen ${url}:`, err);
    return url; // Fallback to original URL
  }
}

async function masterMigrate() {
  console.log('🚀 INICIANDO MIGRACIÓN MAESTRA...');

  const { pipeline } = await import('@xenova/transformers');
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  // 1. CATEGORÍAS Y SUBCATEGORÍAS
  console.log('📂 Migrando categorías...');
  const cats = await fetchInsforge('categories');
  await supabase.from('categories').upsert(cats);
  
  const subcats = await fetchInsforge('subcategories');
  await supabase.from('subcategories').upsert(subcats);

  // 2. CLIENTES Y DIRECCIONES
  console.log('👥 Migrando clientes...');
  const customers = await fetchInsforge('customers');
  await supabase.from('customers').upsert(customers.map((c: any) => ({
    customer_id: c.customer_id,
    email: c.email,
    name: c.name,
    surname: c.surname,
    phone: c.phone,
    password: c.password,
    created_at: c.created_at
  })));

  console.log('🏠 Migrando direcciones...');
  const addresses = await fetchInsforge('shipping_addresses');
  await supabase.from('shipping_addresses').upsert(addresses);

  // 3. PRODUCTOS E IMÁGENES
  console.log('📦 Migrando productos e imágenes (esto puede tardar)...');
  const products = await fetchInsforge('products?select=*,product_images(image_url,orden,is_main)');
  
  for (const p of products) {
    console.log(`🖼️ Procesando imágenes de: ${p.name}...`);
    const imageUrls = p.product_images?.sort((a: any, b: any) => (a.orden || 0) - (b.orden || 0)).map((img: any) => img.image_url) || [];
    
    const newUrls = [];
    for (const url of imageUrls) {
      const newUrl = await uploadImage(url);
      newUrls.push(newUrl);
    }

    console.log(`🧠 Generando vector para: ${p.name}...`);
    const textToEmbed = `${p.name} ${p.description || ''}`.trim();
    const output = await embedder(textToEmbed, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data);

    const { error } = await supabase.from('products').upsert({
      product_id: p.product_id,
      name: p.name,
      description: p.description,
      price: p.price,
      category_id: p.category_id,
      subcategory_id: p.subcategory_id,
      images: newUrls,
      is_published: p.is_published,
      is_new: p.is_new,
      stock: p.stock,
      embedding: embedding,
      created_at: p.created_at
    });

    if (error) console.error(`❌ Error producto ${p.name}:`, error.message);
  }

  // 4. VARIANTES
  console.log('📏 Migrando variantes...');
  const variants = await fetchInsforge('product_variants');
  await supabase.from('product_variants').upsert(variants);

  // 5. PEDIDOS
  console.log('🛒 Migrando pedidos...');
  const orders = await fetchInsforge('orders');
  await supabase.from('orders').upsert(orders);

  // 6. SUSCRIPCIONES
  console.log('📧 Migrando suscripciones...');
  const subs = await fetchInsforge('subscriptions');
  await supabase.from('subscriptions').upsert(subs);

  console.log('✨ MIGRACIÓN MAESTRA COMPLETADA ✨');
}

masterMigrate().catch(console.error);
