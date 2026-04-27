
import { INSFORGE_URL, headers, handleResponse } from './client';

export const collections = {
  getAll: async () => {
    const response = await fetch(`${INSFORGE_URL}/api/database/records/collections?select=*`, { headers });
    return handleResponse(response);
  }
};
