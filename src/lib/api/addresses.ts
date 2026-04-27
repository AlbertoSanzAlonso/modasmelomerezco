
import { INSFORGE_URL, headers, handleResponse } from './client';
import type { Address } from '@/types';

export const addresses = {
  getByCustomer: async (customer_id: string): Promise<Address[]> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/shipping_addresses?customer_id=eq.${customer_id}`, { headers });
    const data = await handleResponse(response);
    return data.map((addr: any) => ({
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
  create: async (customer_id: string, address: Address): Promise<void> => {
    await fetch(`${INSFORGE_URL}/api/database/records/shipping_addresses`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({
        customer_id,
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
      })
    });
  },
  update: async (shipping_address_id: number, address: Partial<Address>): Promise<void> => {
    const dbPayload: any = {};
    if (address.type) dbPayload.address_type = address.type;
    if (address.street) dbPayload.street = address.street;
    if (address.floor !== undefined) dbPayload.floor = address.floor;
    if (address.door !== undefined) dbPayload.door = address.door;
    if (address.stair !== undefined) dbPayload.stair = address.stair;
    if (address.province) dbPayload.province = address.province;
    if (address.city) dbPayload.city = address.city;
    if (address.zip) dbPayload.zip = address.zip;
    if (address.location_id !== undefined) dbPayload.location_id = address.location_id;
    if (address.isDefault !== undefined) dbPayload.is_default = address.isDefault;

    await fetch(`${INSFORGE_URL}/api/database/records/shipping_addresses?shipping_address_id=eq.${shipping_address_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(dbPayload)
    });
  },
  delete: async (shipping_address_id: number): Promise<void> => {
    await fetch(`${INSFORGE_URL}/api/database/records/shipping_addresses?shipping_address_id=eq.${shipping_address_id}`, {
      method: 'DELETE',
      headers
    });
  },
  setDefault: async (customer_id: string, shipping_address_id: number): Promise<void> => {
    // Reset all to false
    await fetch(`${INSFORGE_URL}/api/database/records/shipping_addresses?customer_id=eq.${customer_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_default: false })
    });
    // Set one to true
    await fetch(`${INSFORGE_URL}/api/database/records/shipping_addresses?shipping_address_id=eq.${shipping_address_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_default: true })
    });
  }
};
