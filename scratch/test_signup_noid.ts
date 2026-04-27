
import bcrypt from 'bcryptjs';

const INSFORGE_URL = 'https://vyus42nj.eu-central.insforge.app';
const INSFORGE_API_KEY = 'ik_6442e7c45fe5a0bde337d8ce5d67ca2e';

const headers = {
  'Content-Type': 'application/json',
  'apikey': INSFORGE_API_KEY,
  'Authorization': `Bearer ${INSFORGE_API_KEY}`
};

async function testSignupNoId() {
  const email = `test_noid_${Date.now()}@example.com`;
  const password = 'password123';
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const customer = {
    email,
    name: 'Test No ID',
    password: hashedPassword,
    phone: '123456789',
    address: '[]' // Empty addresses list
  };

  console.log('Sending payload (NO ID):', JSON.stringify(customer, null, 2));

  const response = await fetch(`${INSFORGE_URL}/api/database/records/customers`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(customer)
  });

  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

testSignupNoId();
