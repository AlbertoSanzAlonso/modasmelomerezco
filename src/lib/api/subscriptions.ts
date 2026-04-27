
import { INSFORGE_URL, headers, handleResponse } from './client';
import type { Subscription } from '@/types';

export const subscriptions = {
  getAll: async (page = 1, pageSize = 20): Promise<Subscription[]> => {
    const offset = (page - 1) * pageSize;
    const response = await fetch(`${INSFORGE_URL}/api/database/records/subscriptions?select=*&limit=${pageSize}&offset=${offset}&order=subscribed_at.desc`, { headers });
    return handleResponse(response);
  },
  getByEmail: async (email: string): Promise<Subscription | null> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/subscriptions?email=eq.${email}&select=*`, { headers });
    const data = await handleResponse(response);
    return data[0] || null;
  },
  getByUser: async (user_id: string): Promise<Subscription[]> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/subscriptions?user_id=eq.${user_id}&select=*`, { headers });
    return handleResponse(response);
  },
  create: async (data: Omit<Subscription, 'id' | 'subscribed_at'>): Promise<Subscription> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/subscriptions`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    const result = await handleResponse(response);
    return result[0];
  },
  update: async (id: number, updates: Partial<Subscription>): Promise<Subscription> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/subscriptions?id=eq.${id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(updates)
    });
    const result = await handleResponse(response);
    return result[0];
  },
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/subscriptions?id=eq.${id}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error('Error al eliminar la suscripción');
  },
  getByToken: async (token: string): Promise<Subscription | null> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/subscriptions?confirmation_token=eq.${token}&select=*`, { headers });
    const data = await handleResponse(response);
    return data[0] || null;
  },
  confirm: async (token: string): Promise<Subscription> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/subscriptions?confirmation_token=eq.${token}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify({ status: 'active' })
    });
    const result = await handleResponse(response);
    if (!result || result.length === 0) throw new Error('Token inválido o expirado');
    return result[0];
  }
};
