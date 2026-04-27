
import { INSFORGE_URL, headers, handleResponse } from './client';
import type { Category, Subcategory } from '@/types';

export const categories = {
  getAll: async (): Promise<Category[]> => {
    const url = `${INSFORGE_URL}/api/database/records/categories?order=id.asc`;
    return await handleResponse(await fetch(url, { headers }));
  },

  getByName: async (name: string): Promise<Category | undefined> => {
    const url = `${INSFORGE_URL}/api/database/records/categories?name=ilike.${name}`;
    const data = await handleResponse(await fetch(url, { headers }));
    return data[0];
  },

  getSubcategories: async (categoryId?: number): Promise<Subcategory[]> => {
    let url = `${INSFORGE_URL}/api/database/records/subcategories?order=id.asc`;
    if (categoryId) {
      url += `&category_id=eq.${categoryId}`;
    }
    return await handleResponse(await fetch(url, { headers }));
  },

  createCategory: async (name: string): Promise<Category> => {
    const url = `${INSFORGE_URL}/api/database/records/categories`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ name }),
    });
    const data = await handleResponse(response);
    return data[0];
  },

  createSubcategory: async (name: string, category_id: number): Promise<Subcategory> => {
    const url = `${INSFORGE_URL}/api/database/records/subcategories`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify({ name, category_id }),
    });
    const data = await handleResponse(response);
    return data[0];
  }
};
