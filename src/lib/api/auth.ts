
import { supabase } from '../supabase';
import type { Customer, Admin } from '@/types';

export const auth = {
  login: async (email: string, password: string): Promise<{ user: Customer, token: string }> => {
    const cleanEmail = email.toLowerCase().trim();
    
    // 1. Login oficial en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo recuperar el usuario');

    // 2. Recuperar el perfil de nuestra tabla customers usando el auth_id
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_id', authData.user.id)
      .maybeSingle();

    if (custError || !customer) throw new Error('Perfil de usuario no encontrado.');

    // 3. Recuperar direcciones por separado para evitar errores 400
    const { data: addrData } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('customer_id', customer.customer_id);

    const addresses = (addrData || []).map((addr: any) => ({
      shipping_address_id: addr.shipping_address_id,
      type: addr.address_type,
      street: addr.street,
      floor: addr.floor,
      door: addr.door,
      stair: addr.stair,
      province: addr.province,
      city: addr.city,
      zip: addr.zip,
      isDefault: addr.is_default
    }));

    // 4. Recuperar favoritos
    const { data: favoritesData } = await supabase
      .from('customer_favorites')
      .select('product_id')
      .eq('customer_id', customer.customer_id);

    const favorites = (favoritesData || []).map((f: any) => f.product_id);

    return {
      user: { ...customer, addresses, favorites },
      token: authData.session?.access_token || ''
    };
  },

  signup: async (customer: Omit<Customer, 'customer_id'> & { password: string }): Promise<{ user: Customer, token: string }> => {
    const cleanEmail = customer.email.toLowerCase().trim();

    // 1. Crear el usuario en Supabase Auth (Oficial)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: customer.password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Error al crear la cuenta de autenticación');

    // 2. Crear el perfil en nuestra tabla customers vinculado al auth_id
    const { data: newCustomer, error: custError } = await supabase
      .from('customers')
      .insert([{
        auth_id: authData.user.id,
        email: cleanEmail,
        name: customer.name.trim(),
        surname: customer.surname?.trim() || '',
        phone: customer.phone?.trim() || ''
      }])
      .select()
      .maybeSingle();

    if (custError || !newCustomer) throw custError || new Error('Error al crear perfil');

    // 3. Crear direcciones si existen
    if (customer.addresses && customer.addresses.length > 0) {
      await supabase
        .from('shipping_addresses')
        .insert(customer.addresses.map(addr => ({
          customer_id: newCustomer.customer_id,
          address_type: addr.type,
          street: addr.street,
          floor: addr.floor,
          door: addr.door,
          stair: addr.stair,
          province: addr.province,
          city: addr.city,
          zip: addr.zip,
          is_default: addr.isDefault
        })));
    }
    
    return {
      user: { ...newCustomer, addresses: customer.addresses || [], favorites: [] },
      token: authData.session?.access_token || ''
    };
  },

  adminLogin: async (email: string, password: string): Promise<{ admin: Admin, token: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    const { user, session } = data;
    if (!user || !session) throw new Error('No se pudo iniciar sesión');

    const admin: Admin = {
      admin_id: user.id,
      username: user.email?.split('@')[0] || 'admin',
      email: user.email || '',
      role: 'admin',
      created_at: user.created_at
    };

    return {
      admin,
      token: session.access_token
    };
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  resetPassword: async (email: string, redirectTo: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });
    if (error) throw error;
    return true;
  }
};
