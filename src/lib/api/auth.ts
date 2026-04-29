
import { supabase } from '../supabase';
import type { Customer, Admin, Address } from '@/types';
import bcrypt from 'bcryptjs';

export const auth = {
  login: async (email: string, password: string): Promise<{ user: Customer, token: string }> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) throw new Error('Credenciales incorrectas');
    
    const rawUser = data;
    const isPasswordValid = bcrypt.compareSync(password, rawUser.password);
    if (!isPasswordValid) throw new Error('Credenciales incorrectas');

    // Fetch addresses
    const { data: addrData } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('customer_id', rawUser.customer_id);

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

    // Fetch favorites
    const { data: favoritesData } = await supabase
      .from('customer_favorites')
      .select('product_id')
      .eq('customer_id', rawUser.customer_id);

    const favorites = (favoritesData || []).map((f: any) => f.product_id);

    const cleanUser = { ...rawUser };
    delete (cleanUser as any).password;

    return {
      user: { ...cleanUser, addresses, favorites },
      token: 'supabase-jwt-' + rawUser.customer_id
    };
  },

  signup: async (customer: Omit<Customer, 'customer_id'> & { password: string }): Promise<{ user: Customer, token: string }> => {
    const hashedPassword = bcrypt.hashSync(customer.password, 10);
    
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        email: customer.email,
        name: customer.name,
        surname: customer.surname || '',
        password: hashedPassword,
        phone: customer.phone || ''
      }])
      .select()
      .single();
    
    if (error) throw error;
    const rawUser = data;

    // Create shipping address if provided
    if (customer.addresses && customer.addresses.length > 0) {
      await supabase
        .from('shipping_addresses')
        .insert(customer.addresses.map(addr => ({
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
        })));
    }
    
    return {
      user: { ...rawUser, addresses: customer.addresses || [] },
      token: 'supabase-jwt-' + rawUser.customer_id
    };
  },

  adminLogin: async (username: string, password: string): Promise<{ admin: Admin, token: string }> => {
    // Note: If admins table is not in Supabase yet, this will fail.
    // However, we migration everything else to Supabase for consistency.
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error || !data) throw new Error('Credenciales incorrectas');
    
    const admin = data;
    const isPasswordValid = bcrypt.compareSync(password, admin.password);
    if (!isPasswordValid) throw new Error('Credenciales incorrectas');

    return {
      admin,
      token: 'supabase-admin-jwt-' + admin.admin_id
    };
  }
};
