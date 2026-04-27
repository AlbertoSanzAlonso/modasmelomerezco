import { api } from '../src/lib/api';

async function checkData() {
  try {
    const customers = await api.customers.getAll();
    for (const customer of customers) {
      if (customer.addresses) {
        console.log('Customer with addresses found:', customer.email);
        console.log(JSON.stringify(customer.addresses, null, 2));
        return;
      }
    }
    console.log('No customers with addresses found.');
  } catch (error) {
    console.error('Error fetching customers:', error);
  }
}

checkData();
