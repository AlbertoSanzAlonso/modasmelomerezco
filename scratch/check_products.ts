
const INSFORGE_URL = 'https://vyus42nj.eu-central.insforge.app';
const INSFORGE_API_KEY = 'ik_6442e7c45fe5a0bde337d8ce5d67ca2e';

const headers = {
  'Content-Type': 'application/json',
  'apikey': INSFORGE_API_KEY,
  'Authorization': `Bearer ${INSFORGE_API_KEY}`
};

async function checkProductsColumns() {
  const url = `${INSFORGE_URL}/api/database/records/products?limit=5`;
  const response = await fetch(url, { headers });
  const data = await response.json();
  if (data.length > 0) {
    console.log('All columns found across 5 records:', Array.from(new Set(data.flatMap(Object.keys))));
    data.forEach((r: any) => {
        console.log(`Record ${r.product_id}:`, JSON.stringify(r, null, 2));
    });
  } else {
    console.log('No products found to check columns.');
  }
}

checkProductsColumns();
