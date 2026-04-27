import bcrypt from 'bcryptjs';

const INSFORGE_URL = 'https://vyus42nj.eu-central.insforge.app';
const INSFORGE_API_KEY = 'ik_6442e7c45fe5a0bde337d8ce5d67ca2e';

const headers = {
  'Content-Type': 'application/json',
  'apikey': INSFORGE_API_KEY,
  'Authorization': `Bearer ${INSFORGE_API_KEY}`
};

const createAdmin = async () => {
  const username = 'Melomerezco';
  const password = 'Chiqui302211';
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  const payload = {
    username,
    password: hashedPassword,
    name: 'Melomerezco'
  };

  console.log('Creating admin with payload:', { ...payload, password: '[HASHED]' });

  try {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/admins`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log('Admin created successfully!');
      const data = await response.json();
      console.log('Response:', data);
    } else {
      const error = await response.text();
      console.error('Error creating admin:', response.status, error);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

createAdmin();
