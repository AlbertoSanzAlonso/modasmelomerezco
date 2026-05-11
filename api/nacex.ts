
import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Nacex API Handler (Proxy para evitar CORS y ocultar credenciales)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configuración de cabeceras para CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, cp, tracking } = req.query;

  // CREDENCIALES (Prioridad a Variables de Entorno)
  const NACEX_USER = process.env.NACEX_USER || 'INFOBENALUMOX@GMAIL.COM';
  const NACEX_PASS = process.env.NACEX_PASSWORD || '';
  const NACEX_AGENCY = process.env.NACEX_AGENCIA || '2924';
  const NACEX_CLIENT = process.env.NACEX_CLIENTE || '00472';
  const NACEX_CP_RECOGIDA = process.env.NACEX_CP_RECOGIDA || '29631';
  
  const NACEX_WS_URL = 'https://pda.nacex.com/nacex_ws/ws'; 

  const canUseRealAPI = NACEX_PASS && NACEX_PASS !== 'tu_password' && NACEX_PASS !== 'PON_AQUI_TU_CLAVE_MD5';

  // --- 1. TEST CONNECTION ---
  if (method === 'test_connection') {
    if (!canUseRealAPI) return res.status(200).json({ success: true, mode: 'mock' });

    try {
      const response = await fetch(`${NACEX_WS_URL}?method=getAgencia&user=${encodeURIComponent(NACEX_USER)}&pass=${encodeURIComponent(NACEX_PASS)}&data=28001`);
      const data = await response.text();
      if (response.ok && !data.includes('ERROR')) {
        return res.status(200).json({ success: true, mode: 'real' });
      }
      return res.status(401).json({ success: false, error: 'Credenciales inválidas', detail: data });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Error de red' });
    }
  }

  // --- 2. PUNTOS DE RECOGIDA (NacexShop) ---
  if (method === 'get_puntos_shop') {
    const targetCP = cp || NACEX_CP_RECOGIDA;
    
    if (!canUseRealAPI) {
      // Mock points if no API key
      const mockPoints = [
        { id: 'S292401', name: 'Nacex Shop - Papelería Gema', address: 'Av. Constitución, 12', city: 'Benalmádena', zip: '29631', distance: '0.5km' },
        { id: 'S292402', name: 'Nacex Shop - Estanco Nº3', address: 'Calle Las Flores, 5', city: 'Benalmádena', zip: '29630', distance: '1.2km' },
        { id: 'S292403', name: 'Nacex Shop - Supermercado Local', address: 'Plaza de la Mezquita, s/n', city: 'Benalmádena', zip: '29631', distance: '0.8km' },
      ];
      return res.status(200).json(mockPoints);
    }

    try {
      // Probamos con getAgencias (plural)
      const response = await fetch(`${NACEX_WS_URL}?method=getAgencias&user=${encodeURIComponent(NACEX_USER)}&pass=${encodeURIComponent(NACEX_PASS)}&data=${targetCP}`);
      const rawData = await response.text();
      
      // Parsear respuesta por tuberías
      const lines = rawData.split('\n').filter(l => l.trim());
      const points = lines.map(line => {
        const p = line.split('|');
        return {
          id: p[0],
          name: p[1],
          address: p[2],
          zip: p[3],
          city: p[4],
          distance: p[5] ? `${p[5]}km` : ''
        };
      });

      return res.status(200).json(points);
    } catch (err) {
      return res.status(500).json({ error: 'Error cargando puntos Nacex' });
    }
  }

  // --- 3. CREAR ENVÍO ---
  if (method === 'crear_envio') {
    if (!canUseRealAPI) {
      return res.status(200).json({ success: true, tracking: 'NX' + Date.now(), label_url: '#', mode: 'mock' });
    }

    try {
      const orderData = req.body || {};
      const dataParams = [
        NACEX_AGENCY, NACEX_CLIENT, '', '', '', NACEX_CP_RECOGIDA, '',
        orderData.nombre || 'Cliente', orderData.direccion || '', orderData.poblacion || '', 
        orderData.cp || '', orderData.telefono || '', orderData.servicio || '1',
        '2', '1', '1.0', '0', orderData.obs || '', '', orderData.orderId || 'ORD', 'P', '0'
      ].join('|');

      const response = await fetch(`${NACEX_WS_URL}?method=putExpedicion&user=${encodeURIComponent(NACEX_USER)}&pass=${encodeURIComponent(NACEX_PASS)}&data=${encodeURIComponent(dataParams)}`);
      const rawData = await response.text();
      const parts = rawData.split('|');
      
      if (parts[0] === 'OK') {
        return res.status(200).json({ success: true, tracking: parts[1], label_url: parts[2], mode: 'real' });
      }
      return res.status(400).json({ success: false, error: rawData });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Error interno' });
    }
  }

  return res.status(400).json({ error: 'Método no soportado' });
}
