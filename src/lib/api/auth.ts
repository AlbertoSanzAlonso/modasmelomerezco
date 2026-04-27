
import { INSFORGE_URL, headers, handleResponse } from './client';
import type { Customer, Admin, Address } from '@/types';
import bcrypt from 'bcryptjs';

export const auth = {
  login: async (email: string, password: string): Promise<{ user: Customer, token: string }> => {
    const url = `${INSFORGE_URL}/api/database/records/customers?email=eq.${email}&select=*`;
    const response = await fetch(url, { headers });
    const data = await handleResponse(response);
    
    if (data.length === 0) throw new Error('Credenciales incorrectas');
    
    const rawUser = data[0];
    const isPasswordValid = bcrypt.compareSync(password, rawUser.password);
    if (!isPasswordValid) throw new Error('Credenciales incorrectas');

    let addresses: Address[] = [];
    const addrResponse = await fetch(`${INSFORGE_URL}/api/database/records/shipping_addresses?customer_id=eq.${rawUser.customer_id}&select=*`, { headers });
    const addrData = await handleResponse(addrResponse);
    addresses = (addrData || []).map((addr: any) => ({
      shipping_address_id: addr.shipping_address_id,
      type: addr.address_type,
      street: addr.street,
      floor: addr.floor,
      door: addr.door,
      stair: addr.stair,
      province: addr.province,
      city: addr.city,
      zip: addr.zip,
      location_id: addr.location_id,
      isDefault: addr.is_default
    }));

    // Fetch favorites from the junction table
    const favResponse = await fetch(`${INSFORGE_URL}/api/database/records/customer_favorites?customer_id=eq.${rawUser.customer_id}&select=product_id`, { headers });
    const favoritesData = await handleResponse(favResponse) || [];
    const favorites = favoritesData.map((f: any) => f.product_id);

    const cleanRawUser = rawUser;
    delete (cleanRawUser as any).password;

    return {
      user: { ...cleanRawUser, addresses, favorites },
      token: 'fake-jwt-' + rawUser.customer_id
    };
  },
  signup: async (customer: Omit<Customer, 'customer_id'> & { password: string }): Promise<{ user: Customer, token: string }> => {
    const hashedPassword = bcrypt.hashSync(customer.password, 10);
    
    const dbPayload = {
      email: customer.email,
      name: customer.name,
      surname: customer.surname || '',
      password: hashedPassword,
      phone: customer.phone || ''
    };

    const response = await fetch(`${INSFORGE_URL}/api/database/records/customers`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(dbPayload)
    });
    
    const data = await handleResponse(response);
    const rawUser = data[0];

    // Create shipping address if provided
    if (customer.addresses && customer.addresses.length > 0) {
      await Promise.all(customer.addresses.map(addr => 
        fetch(`${INSFORGE_URL}/api/database/records/shipping_addresses`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            customer_id: rawUser.customer_id,
            address_type: addr.type,
            street: addr.street,
            floor: addr.floor,
            door: addr.door,
            stair: addr.stair,
            province: addr.province,
            city: addr.city,
            zip: addr.zip,
            location_id: addr.location_id,
            is_default: addr.isDefault
          })
        })
      ));
    }
    
    return {
      user: { ...rawUser, addresses: customer.addresses || [] },
      token: 'fake-jwt-' + rawUser.customer_id
    };
  },
  adminLogin: async (username: string, password: string): Promise<{ admin: Admin, token: string }> => {
    const url = `${INSFORGE_URL}/api/database/records/admins?username=eq.${username}&select=*`;
    const response = await fetch(url, { headers });
    const data = await handleResponse(response);
    
    if (data.length === 0) throw new Error('Credenciales incorrectas');
    
    const admin = data[0];
    const isPasswordValid = bcrypt.compareSync(password, admin.password);
    if (!isPasswordValid) throw new Error('Credenciales incorrectas');

    return {
      admin,
      token: 'fake-admin-jwt-' + admin.admin_id
    };
  }
};
