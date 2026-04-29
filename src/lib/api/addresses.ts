
import { supabase } from '../supabase';
import type { Address } from '@/types';

export const addresses = {
  getByCustomer: async (customer_id: string): Promise<Address[]> => {
    const { data, error } = await supabase
      .from('shipping_addresses')
      .select('*')
      .eq('customer_id', customer_id);

    if (error) throw error;
    return (data || []).map((addr: any) => ({
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
  },

  create: async (address: Omit<Address, 'shipping_address_id'> & { customer_id: string }): Promise<Address> => {
    const { data, error } = await supabase
      .from('shipping_addresses')
      .insert([{
        customer_id: address.customer_id,
        address_type: address.type,
        street: address.street,
        floor: address.floor,
        door: address.door,
        stair: address.stair,
        province: address.province,
        city: address.city,
        zip: address.zip,
        location_id: address.location_id,
        is_default: address.isDefault
      }])
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      type: data.address_type,
      isDefault: data.is_default
    };
  },

  update: async (shipping_address_id: number, updates: Partial<Address>): Promise<Address> => {
    const dbUpdates: any = { ...updates };
    if (updates.type) dbUpdates.address_type = updates.type;
    if (updates.isDefault !== undefined) dbUpdates.is_default = updates.isDefault;
    delete dbUpdates.type;
    delete dbUpdates.isDefault;

    const { data, error } = await supabase
      .from('shipping_addresses')
      .update(dbUpdates)
      .eq('shipping_address_id', shipping_address_id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      type: data.address_type,
      isDefault: data.is_default
    };
  },

  delete: async (shipping_address_id: number): Promise<void> => {
    const { error } = await supabase
      .from('shipping_addresses')
      .delete()
      .eq('shipping_address_id', shipping_address_id);

    if (error) throw error;
  },

  setDefault: async (customer_id: string, shipping_address_id: number): Promise<void> => {
    // Reset all others
    await supabase
      .from('shipping_addresses')
      .update({ is_default: false })
      .eq('customer_id', customer_id);

    // Set new default
    await supabase
      .from('shipping_addresses')
      .update({ is_default: true })
      .eq('shipping_address_id', shipping_address_id);
  }
};
