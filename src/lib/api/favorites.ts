import { INSFORGE_URL, headers, handleResponse } from './client';
import type { Product } from '@/types';
import { SELECT, normalise } from './products';

export const favorites = {
  getByCustomer: async (customer_id: string): Promise<Product[]> => {
    // Primero obtenemos los product_ids de la tabla intermedia
    const favResponse = await fetch(
      `${INSFORGE_URL}/api/database/records/customer_favorites?customer_id=eq.${customer_id}&select=product_id`, 
      { headers }
    );
    const favData = await handleResponse(favResponse);
    
    if (!favData || favData.length === 0) return [];
    
    const productIds = favData.map((f: any) => f.product_id).join(',');
    
    // Luego obtenemos los productos (usando product_id en lugar de id)
    const productsResponse = await fetch(
      `${INSFORGE_URL}/api/database/records/products?product_id=in.(${productIds})&select=${encodeURIComponent(SELECT)}`, 
      { headers }
    );
    const productsData = await handleResponse(productsResponse);
    return (productsData || []).map((p: any) => normalise(p));
  },

  add: async (customer_id: string, product_id: string): Promise<void> => {
    await fetch(`${INSFORGE_URL}/api/database/records/customer_favorites`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({ customer_id, product_id })
    });
  },

  remove: async (customer_id: string, product_id: string): Promise<void> => {
    await fetch(
      `${INSFORGE_URL}/api/database/records/customer_favorites?customer_id=eq.${customer_id}&product_id=eq.${product_id}`, 
      { 
        method: 'DELETE',
        headers 
      }
    );
  }
};
