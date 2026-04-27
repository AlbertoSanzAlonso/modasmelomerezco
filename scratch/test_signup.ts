
import bcrypt from 'bcryptjs';

const INSFORGE_URL = 'https://vyus42nj.eu-central.insforge.app';
const INSFORGE_API_KEY = 'ik_6442e7c45fe5a0bde337d8ce5d67ca2e';

const headers = {
  'Content-Type': 'application/json',
  'apikey': INSFORGE_API_KEY,
  'Authorization': `Bearer ${INSFORGE_API_KEY}`
};

async function testSignup() {
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const customer = {
    id: Math.random().toString(36).substr(2, 9),
    email,
    name: 'Test User',
    password: hashedPassword,
    phone: '123456789',
    addresses: [
      {
        id: 'addr1',
        type: 'Principal',
        street: 'Calle Test 1',
        province: 'Madrid',
        city: 'Madrid',
        zip: '28001',
        phone: '123456789',
        isDefault: true
      }
    ]
  };

  console.log('Sending payload:', JSON.stringify(customer, null, 2));

  const response = await fetch(`${INSFORGE_URL}/api/database/records/customers`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(customer)
  });

  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

testSignup();
