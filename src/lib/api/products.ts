
import { INSFORGE_URL, headers, handleResponse } from './client';
import type { Product } from '@/types';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Normalise a raw DB row into a Product, joining product_images → images[] */
export const normalise = (p: any): Product => ({
  ...p,
  is_published: p.is_published === false ? false : true, // Default to true if null or undefined
  // Map joined names if they exist
  category: p.categories?.name || p.category,
  subcategory: p.subcategories?.name || p.subcategory,
  // Use the join data from product_images table exclusively
  images: Array.isArray(p.product_images) && p.product_images.length > 0
      ? [...p.product_images]
          .sort((a: any, b: any) => {
            // is_main first, then sort by orden
            if (a.is_main && !b.is_main) return -1;
            if (!a.is_main && b.is_main) return 1;
            return (a.orden ?? 0) - (b.orden ?? 0);
          })
          .map((img: any) => img.image_url)
      : [],
  variants: (p.variants || []).map((v: any) => ({
    ...v,
    id: v.variant_id.toString(),
  })),
});

/** The select string that brings product_images along */
export const SELECT = '*,variants:product_variants(*),product_images(id,image_url,orden,alt_text,is_main),categories:category_id(name),subcategories:subcategory_id(name)';

// ─── Image rows CRUD ─────────────────────────────────────────────────────────

/**
 * Replace all product_images rows for a product with a new ordered list of URLs.
 */
const replaceImages = async (product_id: string, imageUrls: string[]): Promise<void> => {
  const cleanId = String(product_id).split(':')[0];
  // Delete existing
  await handleResponse(
    await fetch(
      `${INSFORGE_URL}/api/database/records/product_images?product_id=eq.${cleanId}`,
      { method: 'DELETE', headers }
    )
  );

  if (imageUrls.length === 0) return;

  // Insert new rows
  const payload = imageUrls.map((url, idx) => ({
    product_id: cleanId,
    image_url: url,
    orden: idx,
    is_main: idx === 0, // The first one is the main one
  }));

  await handleResponse(
    await fetch(`${INSFORGE_URL}/api/database/records/product_images`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })
  );
};

// ─── Public API ──────────────────────────────────────────────────────────────

export const products = {
  getAll: async (category?: string, subcategory?: string, page = 1, pageSize = 20, publishedOnly = false, search?: string): Promise<Product[]> => {
    const offset = (page - 1) * pageSize;
    let url = `${INSFORGE_URL}/api/database/records/products?select=${SELECT}&order=product_id.asc&limit=${pageSize}&offset=${offset}`;
    if (category) url += `&category_id=eq.${category}`;
    if (subcategory) url += `&subcategory_id=eq.${subcategory}`;
    if (search) url += `&name=ilike.*${encodeURIComponent(search)}*`;
    
    const fetchWithFilter = async (withFilter: boolean) => {
      let finalUrl = url;
      if (withFilter && publishedOnly) finalUrl += `&is_published=not.eq.false`;
      const response = await fetch(finalUrl, { headers });
      if (!response.ok && response.status === 400 && withFilter && publishedOnly) {
        // Fallback if column doesn't exist
        console.warn('The "is_published" column might be missing in the database. Returning all products.');
        return fetchWithFilter(false);
      }
      return await handleResponse(response);
    };

    const data = await fetchWithFilter(true);
    return (data || []).map(normalise);
  },

  getById: async (product_id: string): Promise<Product> => {
    const cleanId = String(product_id).split(':')[0];
    const data = await handleResponse(
      await fetch(
        `${INSFORGE_URL}/api/database/records/products?product_id=eq.${cleanId}&select=${SELECT}`,
        { headers }
      )
    );
    return normalise(data[0]);
  },

  getNewArrivals: async (publishedOnly = true): Promise<Product[]> => {
    // is_new is now the official column name
    const url = `${INSFORGE_URL}/api/database/records/products?is_new=eq.true&select=${SELECT}`;
    
    const fetchWithFilter = async (withFilter: boolean) => {
      let finalUrl = url;
      if (withFilter && publishedOnly) finalUrl += `&is_published=not.eq.false`;
      const response = await fetch(finalUrl, { headers });
      if (!response.ok && response.status === 400 && withFilter && publishedOnly) {
        // Fallback if column doesn't exist
        return fetchWithFilter(false);
      }
      return await handleResponse(response);
    };

    const data = await fetchWithFilter(true);
    return (data || []).map(normalise);
  },

  create: async (productData: Omit<Product, 'product_id'>): Promise<Product> => {
    const { variants, images } = productData;

    // We need to manually provide a product_id because the column is not auto-incrementing
    const allIdsResponse = await fetch(`${INSFORGE_URL}/api/database/records/products?select=product_id`, { headers });
    const allIds = await handleResponse(allIdsResponse);
    const numericIds = allIds.map((p: any) => parseInt(p.product_id)).filter((id: number) => !isNaN(id));
    const nextId = (numericIds.length > 0 ? Math.max(...numericIds) : 0) + 1;

    // Whitelist valid products table columns
    const allowedFields = ['name', 'price', 'category_id', 'subcategory_id', 'is_new', 'is_published'];
    const rest: any = { product_id: nextId.toString() };
    allowedFields.forEach((field) => {
      if (field in productData) rest[field] = (productData as any)[field];
    });

    if (!('is_published' in rest)) rest.is_published = true;
    
    const response = await fetch(`${INSFORGE_URL}/api/database/records/products`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify(rest),
    });

    const data = await handleResponse(response);
    const newProduct = data[0];

    // Insert variants
    if (variants && variants.length > 0) {
      await handleResponse(
        await fetch(`${INSFORGE_URL}/api/database/records/product_variants`, {
          method: 'POST',
          headers,
          body: JSON.stringify(
            variants.map((v) => ({
              product_id: newProduct.product_id,
              size: v.size,
              color: v.color || 'Único',
              stock: v.stock || 0,
            }))
          ),
        })
      );
    }

    // Insert images into product_images
    if (images && images.length > 0) {
      await replaceImages(newProduct.product_id, images);
    }

    return products.getById(newProduct.product_id);
  },

  update: async (product_id: string, updates: Partial<Product>): Promise<Product> => {
    const cleanId = String(product_id).split(':')[0];
    const { variants, images } = updates;

    const allowedFields = ['name', 'price', 'category_id', 'subcategory_id', 'is_new', 'is_published'];
    const rest: any = {};
    allowedFields.forEach((field) => {
      if (field in updates) rest[field] = (updates as any)[field];
    });

    if (Object.keys(rest).length > 0) {
      const response = await fetch(
        `${INSFORGE_URL}/api/database/records/products?product_id=eq.${cleanId}`,
        {
          method: 'PATCH',
          headers: { ...headers, Prefer: 'return=representation' },
          body: JSON.stringify(rest),
        }
      );
      await handleResponse(response);
    }

    if (variants !== undefined) {
      await handleResponse(
        await fetch(
          `${INSFORGE_URL}/api/database/records/product_variants?product_id=eq.${cleanId}`,
          { method: 'DELETE', headers }
        )
      );
      if (variants.length > 0) {
        await handleResponse(
          await fetch(`${INSFORGE_URL}/api/database/records/product_variants`, {
            method: 'POST',
            headers,
            body: JSON.stringify(
              variants.map((v) => ({
                product_id: cleanId,
                size: v.size,
                color: v.color || 'Único',
                stock: v.stock || 0,
              }))
            ),
          })
        );
      }
    }

    if (images !== undefined) {
      await replaceImages(cleanId, images);
    }

    return products.getById(cleanId);
  },

  delete: async (product_id: string): Promise<void> => {
    const cleanId = String(product_id).split(':')[0];
    await handleResponse(
      await fetch(
        `${INSFORGE_URL}/api/database/records/products?product_id=eq.${cleanId}`,
        { method: 'DELETE', headers }
      )
    );
  },

  decrementStock: async (variant_id: string, quantity: number): Promise<void> => {
    const data = await handleResponse(
      await fetch(
        `${INSFORGE_URL}/api/database/records/product_variants?variant_id=eq.${variant_id}&select=stock`,
        { headers }
      )
    );
    if (data.length === 0) return;
    const newStock = Math.max(0, data[0].stock - quantity);
    await handleResponse(
      await fetch(
        `${INSFORGE_URL}/api/database/records/product_variants?variant_id=eq.${variant_id}`,
        {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ stock: newStock }),
        }
      )
    );
  },
};
