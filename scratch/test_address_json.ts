
const INSFORGE_URL = 'https://vyus42nj.eu-central.insforge.app';
const INSFORGE_API_KEY = 'ik_6442e7c45fe5a0bde337d8ce5d67ca2e';

const headers = {
  'Content-Type': 'application/json',
  'apikey': INSFORGE_API_KEY,
  'Authorization': `Bearer ${INSFORGE_API_KEY}`
};

async function testSingleAddressUpdate() {
  const customerId = '7c77a23a-c831-44e3-8cd9-e735eac20a34'; // From sample
  const addresses = [
    {
      id: 'addr1',
      type: 'Principal',
      street: 'Calle Test JSON',
      province: 'Madrid',
      city: 'Madrid',
      zip: '28001',
      phone: '123456789',
      isDefault: true
    }
  ];

  const payload = {
    address: JSON.stringify(addresses)
  };

  console.log('Sending payload to "address" column:', JSON.stringify(payload, null, 2));

  const response = await fetch(`${INSFORGE_URL}/api/database/records/customers?id=eq.${customerId}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(payload)
  });

  console.log('Status:', response.status);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

testSingleAddressUpdate();
