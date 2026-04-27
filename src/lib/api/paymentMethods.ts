
import { INSFORGE_URL, headers, handleResponse } from './client';
import type { PaymentMethod } from '@/types';

export const paymentMethods = {
  getByCustomer: async (user_id: string): Promise<PaymentMethod[]> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/payment_methods?user_id=eq.${user_id}&order=created_at.desc`, { headers });
    return handleResponse(response);
  },
  create: async (data: Omit<PaymentMethod, 'id' | 'created_at'>): Promise<PaymentMethod> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/payment_methods`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(data)
    });
    const result = await handleResponse(response);
    return result[0];
  },
  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/payment_methods?id=eq.${id}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error('Error al eliminar el método de pago');
  },
  setDefault: async (user_id: string, id: number): Promise<void> => {
    // 1. Unset current default
    await fetch(`${INSFORGE_URL}/api/database/records/payment_methods?user_id=eq.${user_id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_default: false })
    });
    // 2. Set new default
    await fetch(`${INSFORGE_URL}/api/database/records/payment_methods?id=eq.${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ is_default: true })
    });
  }
};
