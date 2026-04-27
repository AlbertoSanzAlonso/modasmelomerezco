import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Cargar variables de entorno
dotenv.config();

const INSFORGE_URL = process.env.VITE_INSFORGE_URL;
const INSFORGE_API_KEY = process.env.VITE_INSFORGE_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!INSFORGE_URL || !INSFORGE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Faltan variables de entorno en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function migrate() {
  console.log('🚀 Iniciando migración semántica...');

  // 1. Importar dinámicamente transformers (solo funciona en Node)
  const { pipeline } = await import('@xenova/transformers');
  const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

  // 2. Obtener productos de Insforge
  console.log('📦 Obteniendo productos de Insforge...');
  const response = await fetch(`${INSFORGE_URL}/api/database/records/products?select=*`, {
    headers: { 'apikey': INSFORGE_API_KEY, 'Authorization': `Bearer ${INSFORGE_API_KEY}` }
  });
  const products = await response.json();
  console.log(`✅ ${products.length} productos encontrados.`);

  // 3. Procesar y subir a Supabase
  for (const product of products) {
    console.log(`🧠 Procesando: ${product.name}...`);

    // Crear texto para el embedding (Nombre + Categoría + Descripción)
    const textToEmbed = `${product.name} ${product.category || ''} ${product.description || ''}`.trim();
    
    // Generar el vector
    const output = await embedder(textToEmbed, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data);

    // Mapear al nuevo esquema de Supabase
    const { error } = await supabase.from('products').upsert({
      product_id: product.product_id,
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      subcategory: product.subcategory,
      images: product.images,
      variants: product.variants,
      is_published: product.is_published,
      is_new: product.is_new,
      stock: product.stock,
      embedding: embedding
    });

    if (error) {
      console.error(`❌ Error con ${product.name}:`, error.message);
    } else {
      console.log(`✅ ${product.name} subido con éxito.`);
    }
  }

  console.log('✨ Migración completada con éxito.');
}

migrate().catch(console.error);
