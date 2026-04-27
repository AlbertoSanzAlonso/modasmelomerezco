
const INSFORGE_URL = 'https://vyus42nj.eu-central.insforge.app';
const INSFORGE_API_KEY = 'ik_6442e7c45fe5a0bde337d8ce5d67ca2e';

const headers = {
  'Content-Type': 'application/json',
  'apikey': INSFORGE_API_KEY,
  'Authorization': `Bearer ${INSFORGE_API_KEY}`
};

async function checkVariantsColumns() {
  const url = `${INSFORGE_URL}/api/database/records/product_variants?limit=1`;
  const response = await fetch(url, { headers });
  const data = await response.json();
  if (data.length > 0) {
    console.log('Columns found in product_variants:', Object.keys(data[0]));
  } else {
    console.log('No variants found.');
  }
}

checkVariantsColumns();
