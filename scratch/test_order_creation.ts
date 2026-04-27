
const INSFORGE_URL = 'https://vyus42nj.eu-central.insforge.app';
const INSFORGE_API_KEY = 'ik_6442e7c45fe5a0bde337d8ce5d67ca2e';

const headers = {
  'Content-Type': 'application/json',
  'apikey': INSFORGE_API_KEY,
  'Authorization': `Bearer ${INSFORGE_API_KEY}`
};

async function testOrderCreation() {
  const orderData = {
    customer_id: '1c98340f-e966-4d62-9108-65a538c51f85', // Sample customer from previous check
    subtotal: 100,
    total_amount: 100,
    order_status: 'Paid',
    payment_method: 'Test (Sin pago)',
    shipping_city: 'Madrid',
    shipping_province: 'Madrid',
    shipping_zip: '28034',
    shipping_street: 'Calle de la Prueba, 1',
    tax_amount: 0,
    shipping_cost: 0,
    items: [{ product_id: '1', quantity: 1, price: 100 }]
  };

  try {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/orders`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(orderData)
    });
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testOrderCreation();
