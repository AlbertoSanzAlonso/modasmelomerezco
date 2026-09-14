
import { supabase } from '../supabase';
import type { Customer } from '@/types';

export const customers = {
  getAll: async (page = 1, pageSize = 20, searchTerm?: string): Promise<{ customers: Customer[], total: number }> => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('customers')
      .select('*, shipping_addresses(*)', { count: 'exact' });

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,surname.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;
    return {
      customers: data || [],
      total: count || 0
    };
  },

  getById: async (id: string): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*, shipping_addresses(*)')
      .eq('customer_id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return data;

    return {
      ...data,
      addresses: (data.shipping_addresses || []).map((addr: any) => ({
        ...addr,
        isDefault: addr.is_default
      }))
    };
  },

  getByEmail: async (email: string): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*, shipping_addresses(*)')
      .eq('email', email)
      .maybeSingle();

    if (error) throw error;
    if (!data) return data;

    return {
      ...data,
      addresses: (data.shipping_addresses || []).map((addr: any) => ({
        ...addr,
        isDefault: addr.is_default
      }))
    };
  },

  create: async (customer: Omit<Customer, 'customer_id'>): Promise<Customer> => {
    const { password: _password, favorites, addresses, paymentMethods, orders, ...rest } = customer as any;
    const payload = {
      ...rest,
      customer_id: crypto.randomUUID(),
      email: String(rest.email || '').toLowerCase().trim(),
      name: String(rest.name || '').trim(),
      surname: String(rest.surname || '').trim(),
      phone: rest.phone ? String(rest.phone).trim() : null,
    };

    const { data, error } = await supabase
      .from('customers')
      .insert([payload])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  update: async (id: string, updates: Partial<Customer>): Promise<Customer> => {
    const { favorites, addresses, paymentMethods, orders, password, ...rest } = updates as any;
    const payload: Record<string, unknown> = { ...rest };
    if (typeof payload.email === 'string') payload.email = payload.email.toLowerCase().trim();
    if (typeof payload.name === 'string') payload.name = payload.name.trim();
    if (typeof payload.surname === 'string') payload.surname = payload.surname.trim();
    if (typeof payload.phone === 'string') payload.phone = payload.phone.trim() || null;

    const { data, error } = await supabase
      .from('customers')
      .update(payload)
      .eq('customer_id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  delete: async (id: string): Promise<void> => {
    const relatedDeletes = await Promise.all([
      supabase.from('shipping_addresses').delete().eq('customer_id', id),
      supabase.from('customer_favorites').delete().eq('customer_id', id),
      supabase.from('payment_methods').delete().eq('customer_id', id),
    ]);

    const relatedError = relatedDeletes.find((r) => r.error)?.error;
    if (relatedError) throw relatedError;

    // Desvincular pedidos para no bloquear el borrado por FK
    const { error: ordersError } = await supabase
      .from('orders')
      .update({ customer_id: null })
      .eq('customer_id', id);
    if (ordersError) throw ordersError;

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('customer_id', id);

    if (error) throw error;
  },
};
