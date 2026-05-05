import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  const allowedOrigins = [
    'https://modasmelomerezco.com',
    'https://modasmelomerezco.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, status = 'pending', confirmation_token } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Missing email' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Usar UPSERT para evitar el error 409 (Conflict)
    // Si el email existe, actualiza el token y el estado.
    const { data, error } = await supabase
      .from('subscriptions')
      .upsert(
        [{ 
          email, 
          status, 
          confirmation_token,
          subscribed_at: new Date().toISOString()
        }],
        { onConflict: 'email' }
      )
      .select()
      .maybeSingle();

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Subscription API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
}
