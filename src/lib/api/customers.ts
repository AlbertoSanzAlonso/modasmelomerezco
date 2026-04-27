
import { INSFORGE_URL, headers, handleResponse } from './client';
import type { Customer, Address } from '@/types';
import bcrypt from 'bcryptjs';

export const customers = {
  getAll: async (page = 1, pageSize = 20): Promise<Customer[]> => {
    const offset = (page - 1) * pageSize;
    const response = await fetch(`${INSFORGE_URL}/api/database/records/customers?select=*&limit=${pageSize}&offset=${offset}`, { headers });
    return handleResponse(response);
  },
  getByEmail: async (email: string): Promise<Customer | null> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/customers?email=eq.${email}&select=*`, { headers });
    const data = await handleResponse(response);
    return data[0] || null;
  },
  getById: async (customer_id: string): Promise<Customer> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/customers?customer_id=eq.${customer_id}&select=*,shipping_addresses(*)`, { headers });
    const data = await handleResponse(response);
    const rawUser = data[0];
    
    // Fetch payment methods separately to avoid schema cache join issues
    const pmResponse = await fetch(`${INSFORGE_URL}/api/database/records/payment_methods?user_id=eq.${customer_id}&select=*`, { headers });
    const paymentMethods = await handleResponse(pmResponse) || [];
    
    // Map database field names to interface property names if they differ
    const addresses: Address[] = (rawUser.shipping_addresses || []).map((addr: any) => ({
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

    // Fetch favorites separately
    const favResponse = await fetch(`${INSFORGE_URL}/api/database/records/customer_favorites?customer_id=eq.${customer_id}&select=product_id`, { headers });
    const favoritesData = await handleResponse(favResponse) || [];
    const favorites = favoritesData.map((f: any) => f.product_id);

    return { ...rawUser, addresses, paymentMethods, favorites };
  },
  create: async (customer: Omit<Customer, 'customer_id'> & { password?: string }): Promise<Customer> => {
    const rawPassword = customer.password || Math.random().toString(36).slice(-10);
    const hashedPassword = bcrypt.hashSync(rawPassword, 10);
    
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
    return { ...rawUser, addresses: customer.addresses || [] };
  },
  update: async (customer_id: string, updates: Partial<Customer> & { password?: string }): Promise<Customer> => {
    const dataToUpdate: Record<string, unknown> = { ...updates };
    
    if (updates.password) {
      dataToUpdate.password = bcrypt.hashSync(updates.password, 10);
    }

    if (updates.addresses && customer_id) {
      // Sync addresses with shipping_addresses table
      const syncAddresses = async () => {
        try {
          await Promise.all(updates.addresses!.map(async (addr) => {
            const isNew = !addr.shipping_address_id;
            const url = isNew 
              ? `${INSFORGE_URL}/api/database/records/shipping_addresses`
              : `${INSFORGE_URL}/api/database/records/shipping_addresses?shipping_address_id=eq.${addr.shipping_address_id}`;
            
            const payload = {
              customer_id: customer_id,
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
            };

            const response = await fetch(url, {
              method: isNew ? 'POST' : 'PATCH',
              headers: { ...headers, 'Prefer': 'return=representation' },
              body: JSON.stringify(payload)
            });
            return handleResponse(response);
          }));
        } catch (error) {
          console.error('Error syncing addresses:', error);
        }
      };
      
      // We don't await here to keep the customer update fast, 
      // but we do it before returning the final response
      await syncAddresses();
      delete dataToUpdate.addresses;
    }

    // Explicitly remove city and zip from updates if they exist
    delete dataToUpdate.city;
    delete dataToUpdate.zip;

    const response = await fetch(`${INSFORGE_URL}/api/database/records/customers?customer_id=eq.${customer_id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(dataToUpdate)
    });
    
    const data = await handleResponse(response);
    const rawUser = data[0];
    
    // If addresses were updated, we'd ideally update the shipping_addresses table here.
    // For now, we fetch the current addresses from the table.
    const addrResponse = await fetch(`${INSFORGE_URL}/api/database/records/shipping_addresses?customer_id=eq.${customer_id}&select=*`, { headers });
    const addrData = await handleResponse(addrResponse);
    
    const addresses: Address[] = (addrData || []).map((addr: any) => ({
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

    const pmResponse = await fetch(`${INSFORGE_URL}/api/database/records/payment_methods?user_id=eq.${customer_id}&select=*`, { headers });
    const paymentMethods = await handleResponse(pmResponse);
    
    // Fetch favorites to keep state consistent
    const favResponse = await fetch(`${INSFORGE_URL}/api/database/records/customer_favorites?customer_id=eq.${customer_id}&select=product_id`, { headers });
    const favoritesData = await handleResponse(favResponse) || [];
    const favorites = favoritesData.map((f: any) => f.product_id);
    
    return { ...rawUser, addresses, paymentMethods, favorites };
  },
  delete: async (customer_id: string): Promise<void> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/customers?customer_id=eq.${customer_id}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error('Failed to delete customer');
  }
};
