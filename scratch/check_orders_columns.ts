
const INSFORGE_URL = 'https://vyus42nj.eu-central.insforge.app';
const INSFORGE_API_KEY = 'ik_6442e7c45fe5a0bde337d8ce5d67ca2e';

const headers = {
  'Content-Type': 'application/json',
  'apikey': INSFORGE_API_KEY,
  'Authorization': `Bearer ${INSFORGE_API_KEY}`
};

async function debugOrders() {
  const url = `${INSFORGE_URL}/api/database/records/orders?select=*&limit=1`;
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
        console.error('Error fetching orders:', await response.text());
        return;
    }
    const data = await response.json();
    if (data.length > 0) {
      console.log('Columns found in orders:', Object.keys(data[0]));
      console.log('Sample order:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('No orders found.');
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

debugOrders();
