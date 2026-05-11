
import { VercelRequest, VercelResponse } from '@vercel/node';
import { NACEX_CONFIG } from '../src/constants/nacex';

/**
 * Nacex API Handler (Proxy to avoid CORS and hide credentials)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method, cp, tracking } = req.query;

  // NACEX CREDENTIALS
  const NACEX_USER = process.env.NACEX_USER || NACEX_CONFIG.usuario;
  const NACEX_PASS = process.env.NACEX_PASSWORD || '';
  const NACEX_AGENCY = process.env.NACEX_AGENCIA || NACEX_CONFIG.agencia;
  const NACEX_CLIENT = process.env.NACEX_CLIENTE || NACEX_CONFIG.cliente;
  const NACEX_CP = process.env.NACEX_CP_RECOGIDA || NACEX_CONFIG.codigoPostalRecogida;
  
  const NACEX_WS_URL = 'https://pda.nacex.com/nacex_ws/ws'; 

  // Helper to check if we should use real API
  const canUseRealAPI = NACEX_PASS && NACEX_PASS !== 'tu_password';

  // --- 1. TEST CONNECTION ---
  if (method === 'test_connection') {
    if (!canUseRealAPI) {
      return res.status(200).json({ 
        success: true, 
        message: 'Modo MOCK activo (sin contraseña real)',
        mode: 'mock'
      });
    }

    try {
      const response = await fetch(`${NACEX_WS_URL}?method=getAgencias&user=${encodeURIComponent(NACEX_USER)}&pass=${encodeURIComponent(NACEX_PASS)}&data=`);
      const data = await response.text();
      if (response.ok && !data.includes('ERROR')) {
        return res.status(200).json({ success: true, message: 'Conexión REAL establecida', mode: 'real' });
      }
      return res.status(401).json({ success: false, error: 'Credenciales inválidas en Nacex', detail: data });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Error de red con Nacex' });
    }
  }

  // --- 2. PUNTOS DE RECOGIDA (NacexShop) ---
  if (method === 'get_puntos_shop') {
    // Si tuviéramos API real, llamaríamos aquí. Mientras tanto, devolvemos puntos reales de ejemplo.
    const mockPoints = [
      { id: 'S292401', name: 'Nacex Shop - Papelería Gema', address: 'Av. Constitución, 12', city: 'Benalmádena', zip: '29631', distance: '0.5km' },
      { id: 'S292402', name: 'Nacex Shop - Estanco Nº3', address: 'Calle Las Flores, 5', city: 'Benalmádena', zip: '29630', distance: '1.2km' },
      { id: 'S292403', name: 'Nacex Shop - Supermercado Local', address: 'Plaza de la Mezquita, s/n', city: 'Benalmádena', zip: '29631', distance: '0.8km' },
    ];
    return res.status(200).json(mockPoints);
  }

  // --- 3. CREAR ENVÍO ---
  if (method === 'crear_envio') {
    if (!canUseRealAPI) {
      return res.status(200).json({
        success: true,
        message: 'Envío simulado correctamente',
        tracking: 'NX' + Math.floor(Math.random() * 1000000000),
        label_url: '#',
        mode: 'mock'
      });
    }

    try {
      // Obtenemos datos del body para el envío real
      const orderData = req.body || {};
      
      /* 
        Formato DATA para putExpedicion (simplificado):
        del_cli|num_cli|nom_rec|dir_rec|pob_rec|cp_rec|tel_rec|nom_ent|dir_ent|pob_ent|cp_ent|tel_ent|tip_ser|tip_env|num_pac|pes_pac|val_dec|obs_1|obs_2|ref_cli|tip_cob|imp_cob
      */
      const dataParams = [
        NACEX_AGENCY,                        // del_cli
        NACEX_CLIENT,                        // num_cli
        '',                                  // nom_rec (vacio = usa datos cliente)
        '',                                  // dir_rec
        '',                                  // pob_rec
        NACEX_CP,                            // cp_rec
        '',                                  // tel_rec
        orderData.nombre || 'Cliente Test',  // nom_ent
        orderData.direccion || 'Calle Falsa 123', // dir_ent
        orderData.poblacion || 'Madrid',     // pob_ent
        orderData.cp || '28001',             // cp_ent
        orderData.telefono || '600000000',   // tel_ent
        orderData.servicio || '1',           // tip_ser (1=Nacex 10:00, 2=19:00, etc)
        '2',                                 // tip_env (2=Paquete)
        '1',                                 // num_pac
        '1.0',                               // pes_pac
        '0',                                 // val_dec
        orderData.obs || '',                 // obs_1
        '',                                  // obs_2
        orderData.orderId || 'ORD-123',      // ref_cli
        'P',                                 // tip_cob (P=Pagado)
        '0'                                  // imp_cob
      ].join('|');

      const response = await fetch(`${NACEX_WS_URL}?method=putExpedicion&user=${encodeURIComponent(NACEX_USER)}&pass=${encodeURIComponent(NACEX_PASS)}&data=${encodeURIComponent(dataParams)}`);
      const rawData = await response.text();
      
      // La respuesta de Nacex suele ser: "OK|12345678|URL_ETIQUETA" o "ERROR|Mensaje"
      const parts = rawData.split('|');
      
      if (parts[0] === 'OK') {
        return res.status(200).json({
          success: true,
          tracking: parts[1],
          label_url: parts[2] || '#',
          mode: 'real'
        });
      } else {
        return res.status(400).json({
          success: false,
          error: 'Error de Nacex API',
          detail: rawData
        });
      }
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Error interno procesando envío' });
    }
  }

  // --- 4. ESTADO ENVÍO ---
  if (method === 'estado_envio') {
    if (!canUseRealAPI || !tracking) {
      return res.status(200).json({
        success: true,
        tracking: tracking || 'NX_MOCK_123',
        estado: 'SIMULADO',
        detalle: 'Envío en proceso de pruebas'
      });
    }

    try {
      const response = await fetch(`${NACEX_WS_URL}?method=getEstado&user=${encodeURIComponent(NACEX_USER)}&pass=${encodeURIComponent(NACEX_PASS)}&data=${tracking}`);
      const rawData = await response.text();
      const parts = rawData.split('|');

      return res.status(200).json({
        success: true,
        tracking: tracking,
        estado: parts[0] || 'DESCONOCIDO',
        detalle: parts[1] || rawData
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Error consultando estado' });
    }
  }

  return res.status(400).json({ error: 'Método no soportado' });
}
