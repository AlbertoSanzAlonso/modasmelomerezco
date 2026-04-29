export const INSFORGE_URL = import.meta.env.VITE_INSFORGE_URL || '';
export const INSFORGE_API_KEY = import.meta.env.VITE_INSFORGE_API_KEY || '';

export const headers = {
  'Content-Type': 'application/json',
  'apikey': INSFORGE_API_KEY,
  'Authorization': `Bearer ${INSFORGE_API_KEY}`
};

export const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || `Error: ${response.status}`);
  }
  
  // Handle empty bodies (e.g., 204 No Content)
  const contentType = response.headers.get('content-type');
  if (response.status === 204 || !contentType || !contentType.includes('application/json')) {
    return null;
  }
  
  return response.json();
};
