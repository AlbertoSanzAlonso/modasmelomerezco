
const INSFORGE_URL = 'https://vyus42nj.eu-central.insforge.app';
const INSFORGE_API_KEY = 'ik_6442e7c45fe5a0bde337d8ce5d67ca2e';

const headers = {
  'Content-Type': 'application/json',
  'apikey': INSFORGE_API_KEY,
  'Authorization': `Bearer ${INSFORGE_API_KEY}`
};

async function testApi() {
  try {
    const url = `${INSFORGE_URL}/api/database/records/products?select=*&order=id.asc`;
    console.log('Fetching from:', url);
    const response = await fetch(url, { headers });
    console.log('Status:', response.status);
    if (!response.ok) {
      const text = await response.text();
      console.error('Error body:', text);
      return;
    }
    const data = await response.json();
    console.log('Products found:', data.length);
    console.log('First product:', data[0]);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testApi();
