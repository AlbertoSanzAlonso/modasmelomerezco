
import { supabase } from '../supabase';
import type { Customer, Admin, Address } from '@/types';
import bcrypt from 'bcryptjs';

export const auth = {
  login: async (email: string, password: string): Promise<{ user: Customer, token: string }> => {
    const cleanEmail = email.toLowerCase().trim();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle(); // Usamos maybeSingle para evitar el error 406 si no existe
    
    if (error || !data) throw new Error('El email no está registrado o las credenciales son incorrectas');
    
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
    // Nota: El hashing en el frontend es lento para móviles. 
    // Lo ideal sería hacerlo en una Edge Function, pero para mantener compatibilidad 
    // seguiremos con bcryptjs pero asegurándonos de que no bloquee.
    const hashedPassword = bcrypt.hashSync(customer.password, 10);
    
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        email: customer.email.toLowerCase().trim(),
        name: customer.name.trim(),
        surname: customer.surname?.trim() || '',
        password: hashedPassword,
        phone: customer.phone?.trim() || ''
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
      user: { ...rawUser, addresses: customer.addresses || [], favorites: [] },
      token: 'supabase-jwt-' + rawUser.customer_id
    };
  },

  adminLogin: async (email: string, password: string): Promise<{ admin: Admin, token: string }> => {
    console.log('Login attempt for:', email);
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL?.substring(0, 30));
    // Usar Supabase Auth oficial (Sistema Profesional)
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Admin login error:', error);
      // Intentar fallback por si el usuario aún usa el "username" (opcional pero recomendado)
      if (email.includes('@')) throw error;
      
      // Si no es un email, podría ser el antiguo username. 
      // Pero hemos decidido ir a la profesional, así que forzamos email.
      throw new Error('Por favor, usa tu email de administrador para entrar.');
    }
    
    const { user, session } = data;
    if (!user || !session) throw new Error('No se pudo iniciar sesión');

    // Mapear el usuario de Auth al tipo Admin de nuestra app
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
  }
};
