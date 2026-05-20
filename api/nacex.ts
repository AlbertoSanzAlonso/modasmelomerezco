
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

  // --- 4. SEGUIMIENTO ---
  if (method === 'get_tracking' || method === 'estado_envio') {
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

  // --- 2. OBTENER PUNTOS NACEX.SHOP ---
  if (method === 'getPoints' || method === 'get_puntos_shop') {
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
      // Método exacto encontrado en el WSDL para buscar puntos por CP
      const response = await fetch(`${NACEX_WS_URL}?method=getPuntoEntregaCP&user=${encodeURIComponent(NACEX_USER)}&pass=${encodeURIComponent(NACEX_PASS)}&data=${targetCP}`);

      // Nacex usa ISO-8859-1, necesitamos decodificarlo correctamente
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('iso-8859-1');
      const rawData = decoder.decode(buffer);

      const lines = rawData.split('\n').filter(l => l.trim() && l.includes('~'));
      const points = lines.map(line => {
        const p = line.split('~');

        // Limpiar el nombre: quitar códigos tipo "0800-00 " del principio
        let cleanName = (p[1] || 'Punto Nacex').replace(/^[0-9\-]+\s+/, '').trim();
        // Quitar también repeticiones tipo "AGENCIA 0800"
        cleanName = cleanName.replace(/AGENCIA\s+[0-9]+/gi, '').trim();

        return {
          id: p[0],
          name: cleanName,
          address: p[2] || '',
          city: p[3] || '',
          zip: p[4] || '',
          phone: p[5] || '',
          hours: p[6] || '',
          lat: p[p.length - 2] || '',
          lng: p[p.length - 1] || ''
        };
      });

      return res.status(200).json(points);
    } catch (err) {
      return res.status(500).json({ error: 'Error cargando puntos Nacex' });
    }
  }

  // --- 3. CREAR ENVÍO ---
  if (method === 'create_expedition' || method === 'crear_envio') {
    const body = req.body || {};
    const { orderId, customerName, address, city, zip, province, phone } = body;

    // Limpiar numero de cliente (Nacex a veces falla con ceros a la izquierda)
    const cleanCliente = NACEX_CLIENT.trim().replace(/\D/g, '').replace(/^0+/, '');
    
    // MODO PRUEBA: Detección ultra-robusta
    const paymentMethod = (body.payment_method || '').toString().toUpperCase();
    const isTestOrder = 
      (orderId || '').toString().toUpperCase().includes('TEST') || 
      body.isTest === true || 
      body.isTest === 'true' ||
      paymentMethod.includes('TEST') ||
      paymentMethod.includes('PRUEBA') ||
      paymentMethod.includes('SIN PAGO');

    console.log(`>>> [DEBUG API] Pedido: ${orderId} | Pago: ${paymentMethod} | MODO TEST: ${isTestOrder}`);

    if (!canUseRealAPI || isTestOrder) {
      console.log('>>> MODO SIMULACIÓN ACTIVADO');
      return res.status(200).json({ 
        success: true, 
        tracking: 'TEST-NX' + Date.now(), 
        label_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', 
        mode: 'mock' 
      });
    }

    try {
      // Solo construimos los datos reales si NO es modo test
      const nacexData = [
        `del_cli=${NACEX_AGENCY}`,
        `num_cli=${cleanCliente}`,
        `tip_ser=${body.isNacexShop ? '31' : '08'}`, // 31 para NacexShop, 08 para domicilio
        `tip_cob=O`,
        `ref_cli=${(orderId || 'ORD').split('-')[0]}`,
        `tip_env=1`,
        `bul=1`,
        `kil=1.0`,
        `nom_ent=${customerName || 'Cliente'}`,
        `dir_ent=${address || ''}`,
        `pais_ent=ES`,
        `cp_ent=${zip || ''}`,
        `pob_ent=${city || ''}`,
        `tel_ent=${phone || '000000000'}`,
      ].join('|');

      console.log('Nacex Data Payload:', nacexData);

      const response = await fetch(`${NACEX_WS_URL}?method=putExpedicion&user=${encodeURIComponent(NACEX_USER)}&pass=${encodeURIComponent(NACEX_PASS)}&data=${encodeURIComponent(nacexData)}`);
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
