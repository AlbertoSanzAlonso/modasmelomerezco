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

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Missing token' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Buscar la suscripción por el token
    const { data, error: fetchError } = await supabase
      .from('subscriptions')
      .select('email')
      .eq('confirmation_token', token)
      .maybeSingle();

    if (fetchError || !data) {
      return res.status(404).json({ message: 'Token de confirmación no válido o expirado.' });
    }

    // 2. Marcar como activa y limpiar el token (Usando permisos de Service Role)
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'active',
        confirmation_token: null,
        subscribed_at: new Date().toISOString()
      })
      .eq('email', data.email);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true, message: 'Suscripción confirmada con éxito.' });
  } catch (error) {
    console.error('Confirmation API Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
}
