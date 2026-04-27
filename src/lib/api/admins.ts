
import { INSFORGE_URL, headers, handleResponse } from './client';
import type { Admin } from '@/types';
import bcrypt from 'bcryptjs';

export const admins = {
  getByEmail: async (email: string): Promise<Admin | null> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/admins?email=eq.${email}&select=*`, { headers });
    const data = await handleResponse(response);
    return data[0] || null;
  },
  getByUsername: async (username: string): Promise<Admin | null> => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/admins?username=eq.${username}&select=*`, { headers });
    const data = await handleResponse(response);
    return data[0] || null;
  },
  update: async (admin_id: string, updates: Partial<Admin> & { password?: string }): Promise<Admin> => {
    const dataToUpdate: Record<string, unknown> = { ...updates };
    
    if (updates.password) {
      dataToUpdate.password = bcrypt.hashSync(updates.password, 10);
    }

    const response = await fetch(`${INSFORGE_URL}/api/database/records/admins?admin_id=eq.${admin_id}`, {
      method: 'PATCH',
      headers: { ...headers, 'Prefer': 'return=representation' },
      body: JSON.stringify(dataToUpdate)
    });
    
    const data = await handleResponse(response);
    return data[0];
  }
};
