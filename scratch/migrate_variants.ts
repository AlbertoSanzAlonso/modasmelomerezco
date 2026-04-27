
const INSFORGE_URL = 'https://vyus42nj.eu-central.insforge.app';
const INSFORGE_API_KEY = 'ik_6442e7c45fe5a0bde337d8ce5d67ca2e';

const headers = {
  'Content-Type': 'application/json',
  'apikey': INSFORGE_API_KEY,
  'Authorization': `Bearer ${INSFORGE_API_KEY}`
};

async function migrateVariants() {
  console.log('Starting migration...');
  
  // 1. Fetch all products
  const productsRes = await fetch(`${INSFORGE_URL}/api/database/records/products?select=*`, { headers });
  const products = await productsRes.json();
  
  console.log(`Found ${products.length} products.`);
  
  for (const product of products) {
    if (product.variants && Array.isArray(product.variants)) {
      console.log(`Migrating variants for product ${product.product_id}: ${product.name}`);
      
      for (const variant of product.variants) {
        const payload = {
          product_id: product.product_id,
          size: variant.size,
          color: variant.color || 'Único',
          stock: variant.stock || 0
        };
        
        const insertRes = await fetch(`${INSFORGE_URL}/api/database/records/product_variants`, {
          method: 'POST',
          headers: { ...headers, 'Prefer': 'return=representation' },
          body: JSON.stringify(payload)
        });
        
        if (insertRes.ok) {
          console.log(`  Inserted variant: ${variant.size}`);
        } else {
          const err = await insertRes.text();
          console.error(`  Error inserting variant: ${err}`);
        }
      }
    }
  }
  
  console.log('Migration finished.');
}

migrateVariants();
