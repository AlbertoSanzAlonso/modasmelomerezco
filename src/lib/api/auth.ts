
import { supabase } from '../supabase';
import type { Address, Customer, Admin, Order } from '@/types';
import { orders } from './orders';
import { addresses } from './addresses';

function mapAddresses(addrData: any[] | null | undefined): Address[] {
  return (addrData || []).map((addr: any) => ({
    shipping_address_id: addr.shipping_address_id,
    type: addr.address_type ?? addr.type,
    street: addr.street,
    floor: addr.floor,
    door: addr.door,
    stair: addr.stair,
    province: addr.province,
    city: addr.city,
    zip: addr.zip,
    location_id: addr.location_id,
    isDefault: addr.is_default ?? addr.isDefault ?? false,
  }));
}

async function importAddressFromGuestOrders(
  customerId: string,
  guestOrders: Order[],
  existing: Address[]
): Promise<Address[]> {
  if (existing.length > 0) return existing;

  const source = guestOrders.find((o) => o.shipping_street?.trim());
  if (!source?.shipping_street?.trim()) return existing;

  try {
    const created = await addresses.create(customerId, {
      type: 'Dirección de envío',
      street: source.shipping_street.trim(),
      floor: source.shipping_floor || '',
      door: source.shipping_door || '',
      stair: source.shipping_stair || '',
      province: source.shipping_province || '',
      city: source.shipping_city || '',
      zip: source.shipping_zip || '',
      isDefault: true,
    });
    return [created];
  } catch (error) {
    console.error('No se pudo importar la dirección del pedido invitado:', error);
    return existing;
  }
}

async function enrichProfileFromGuestOrders(
  customer: Customer,
  guestOrders: Order[]
): Promise<Customer> {
  if (!guestOrders.length) return customer;

  const latest = guestOrders[0];
  const updates: Partial<Customer> = {};

  if (!customer.phone?.trim() && latest.guest_phone?.trim()) {
    updates.phone = latest.guest_phone.trim();
  }
  if (!customer.name?.trim() && latest.guest_name?.trim()) {
    updates.name = latest.guest_name.trim();
  }
  if (!customer.surname?.trim() && latest.guest_surname?.trim()) {
    updates.surname = latest.guest_surname.trim();
  }

  if (Object.keys(updates).length === 0) return customer;

  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('customer_id', customer.customer_id)
    .select('*')
    .maybeSingle();

  if (error || !data) {
    console.error('No se pudo enriquecer el perfil desde pedidos invitados:', error);
    return { ...customer, ...updates };
  }

  return { ...customer, ...data };
}

/**
 * Tras login/registro: reclama pedidos invitados del mismo email
 * y, si falta, importa dirección / datos de contacto al perfil.
 */
async function attachGuestHistory(customer: Customer): Promise<Customer> {
  try {
    const claimed = await orders.claimGuestOrdersByEmail(
      customer.email,
      customer.customer_id
    );

    let next: Customer = { ...customer, addresses: customer.addresses || [] };

    if (claimed.length > 0) {
      next = await enrichProfileFromGuestOrders(next, claimed);
      next.addresses = await importAddressFromGuestOrders(
        next.customer_id,
        claimed,
        next.addresses || []
      );
    }

    return next;
  } catch (error) {
    console.error('Error vinculando pedidos de invitado al perfil:', error);
    return customer;
  }
}

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

    const addressesMapped = mapAddresses(addrData);

    // 4. Recuperar favoritos
    const { data: favoritesData } = await supabase
      .from('customer_favorites')
      .select('product_id')
      .eq('customer_id', customer.customer_id);

    const favorites = (favoritesData || []).map((f: any) => f.product_id);

    const withHistory = await attachGuestHistory({
      ...customer,
      addresses: addressesMapped,
      favorites,
    });

    return {
      user: withHistory,
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

    if (authError) {
      console.error('Supabase Auth Signup Error:', authError);
      throw authError;
    }
    if (!authData.user) throw new Error('Error al crear la cuenta de autenticación');

    // 2. Vincular o crear el perfil en nuestra tabla customers
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('email', cleanEmail)
      .maybeSingle();

    let finalCustomer: Customer | null = null;

    if (existingCustomer) {
      // Si el cliente existe pero no tiene auth_id (o queremos actualizarlo), lo vinculamos
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({ 
          auth_id: authData.user.id,
          name: customer.name.trim(),
          surname: customer.surname?.trim() || '',
          phone: customer.phone?.trim() || ''
        })
        .eq('email', cleanEmail)
        .select()
        .maybeSingle();

      if (updateError) throw updateError;
      finalCustomer = updatedCustomer;
    } else {
      // Si no existe, lo creamos de cero con un ID generado manualmente
      const { data: newCustomer, error: insertError } = await supabase
        .from('customers')
        .insert([{
          customer_id: crypto.randomUUID(),
          auth_id: authData.user.id,
          email: cleanEmail,
          name: customer.name.trim(),
          surname: customer.surname?.trim() || '',
          phone: customer.phone?.trim() || ''
        }])
        .select()
        .maybeSingle();

      if (insertError) throw insertError;
      finalCustomer = newCustomer;
    }

    if (!finalCustomer) throw new Error('Error al gestionar el perfil de cliente');

    // 3. Crear direcciones si existen
    let savedAddresses: Address[] = [];
    if (customer.addresses && customer.addresses.length > 0) {
      const { data: insertedAddresses, error: addrError } = await supabase
        .from('shipping_addresses')
        .insert(customer.addresses.map(addr => ({
          customer_id: finalCustomer!.customer_id,
          address_type: addr.type,
          street: addr.street,
          floor: addr.floor,
          door: addr.door,
          stair: addr.stair,
          province: addr.province,
          city: addr.city,
          zip: addr.zip,
          is_default: addr.isDefault
        })))
        .select();

      if (addrError) {
        console.error('Error al guardar direcciones en el registro:', addrError);
        savedAddresses = customer.addresses;
      } else {
        savedAddresses = mapAddresses(insertedAddresses);
      }
    }

    const withHistory = await attachGuestHistory({
      ...finalCustomer,
      addresses: savedAddresses,
      favorites: [],
    });
    
    return {
      user: withHistory,
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
