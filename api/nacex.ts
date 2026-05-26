
import { VercelRequest, VercelResponse } from '@vercel/node';

/** Evita romper el formato pipe-separated de Nacex. */
function nacexField(value: string): string {
  return value.replace(/\|/g, ' ').trim();
}

/** Nacex responde en ISO-8859-1; response.text() asume UTF-8 y rompe tildes (Parmetros). */
async function decodeNacexResponse(response: Response): Promise<string> {
  const buffer = await response.arrayBuffer();
  return new TextDecoder('iso-8859-1').decode(buffer);
}

/** Convierte "ERROR|mensaje|5412" en texto legible para el admin. */
function formatNacexError(raw: string): string {
  const text = raw.trim();
  if (!text) return 'No se pudo crear el envío en Nacex.';

  const parts = text.split('|').map((p) => p.trim());
  const isError = parts[0]?.toUpperCase() === 'ERROR';
  const code =
    isError && parts.length > 2 && /^\d+$/.test(parts[parts.length - 1] ?? '')
      ? parts[parts.length - 1]
      : '';
  const mainMessage =
    (isError ? (code ? parts.slice(1, -1) : parts.slice(1)).join('|') : text) ||
    'Error al comunicar con Nacex.';

  const hints: string[] = [];
  if (/num_cli/i.test(mainMessage)) {
    hints.push('Número de cliente: revisa NACEX_CLIENTE en Vercel (máximo 5 dígitos).');
  }
  if (/cp_ent/i.test(mainMessage)) {
    hints.push('Código postal: el pedido debe tener un CP de envío válido.');
  }
  if (/dir_ent/i.test(mainMessage)) {
    hints.push('Dirección: comprueba calle y número en el pedido.');
  }
  if (/tel_ent/i.test(mainMessage)) {
    hints.push('Teléfono: añade un número de contacto del cliente.');
  }
  if (/nom_ent/i.test(mainMessage)) {
    hints.push('Nombre: revisa nombre y apellidos del destinatario.');
  }
  if (/del_cli/i.test(mainMessage)) {
    hints.push('Delegación: revisa NACEX_AGENCIA en la configuración.');
  }
  if (/recogida|nom_rec|dir_rec|cp_rec|pob_rec|5610/i.test(mainMessage) || code === '5610') {
    hints.push(
      'Dirección de recogida (tienda): añade en Vercel NACEX_NOMBRE_RECOGIDA, NACEX_DIR_RECOGIDA, NACEX_POBLACION_RECOGIDA, NACEX_CP_RECOGIDA y NACEX_TEL_RECOGIDA, y redeploy.',
    );
  }

  let message = mainMessage.trim();
  if (hints.length > 0) {
    message += '\n\n' + [...new Set(hints)].map((h) => `→ ${h}`).join('\n');
  }
  if (code) {
    message += `\n\n(Ref. Nacex: ${code})`;
  }
  return message;
}

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
  const NACEX_NOMBRE_RECOGIDA = process.env.NACEX_NOMBRE_RECOGIDA || 'Modas Me lo Merezco';
  const NACEX_DIR_RECOGIDA = (process.env.NACEX_DIR_RECOGIDA || 'C/ Aragon, 2, L2').slice(0, 45);
  const NACEX_POBLACION_RECOGIDA = process.env.NACEX_POBLACION_RECOGIDA || 'Benalmadena';
  const NACEX_TEL_RECOGIDA = (process.env.NACEX_TEL_RECOGIDA || '951000000').replace(/\D/g, '').slice(0, 15);

  const NACEX_WS_URL = 'https://pda.nacex.com/nacex_ws/ws';

  const canUseRealAPI = NACEX_PASS && NACEX_PASS !== 'tu_password' && NACEX_PASS !== 'PON_AQUI_TU_CLAVE_MD5';

  // --- 4. SEGUIMIENTO ---
  if (method === 'get_tracking' || method === 'estado_envio') {
    if (!canUseRealAPI) return res.status(200).json({ success: true, mode: 'mock' });

    try {
      const response = await fetch(`${NACEX_WS_URL}?method=getAgencia&user=${encodeURIComponent(NACEX_USER)}&pass=${encodeURIComponent(NACEX_PASS)}&data=28001`);
      const data = await decodeNacexResponse(response);
      if (response.ok && !data.includes('ERROR')) {
        return res.status(200).json({ success: true, mode: 'real' });
      }
      return res.status(401).json({ success: false, error: 'Credenciales inválidas', detail: formatNacexError(data) });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Error de red' });
    }
  }

  // --- 1. TEST CONNECTION ---
  if (method === 'test_connection') {
    if (!canUseRealAPI) return res.status(200).json({ success: true, mode: 'mock' });

    try {
      const response = await fetch(`${NACEX_WS_URL}?method=getAgencia&user=${encodeURIComponent(NACEX_USER)}&pass=${encodeURIComponent(NACEX_PASS)}&data=28001`);
      const data = await decodeNacexResponse(response);
      if (response.ok && !data.includes('ERROR')) {
        return res.status(200).json({ success: true, mode: 'real' });
      }
      return res.status(401).json({ success: false, error: 'Credenciales inválidas', detail: formatNacexError(data) });
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

      const rawData = await decodeNacexResponse(response);

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
    const { orderId, province } = body;

    // Admin envía nombre/cp/...; aceptar también nombres en inglés
    const customerName = (body.customerName || body.nombre || 'Cliente').toString().trim();
    const address = (body.address || body.direccion || '').toString().trim();
    const city = (body.city || body.poblacion || '').toString().trim();
    const zip = String(body.zip ?? body.cp ?? '').trim();
    const phone = String(body.phone || body.telefono || '000000000').trim();

    // Nacex: num_cli = máximo 5 dígitos (conservar ceros a la izquierda si caben)
    const cleanCliente = NACEX_CLIENT.trim().replace(/\D/g, '').slice(0, 5);
    
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

    if (!cleanCliente) {
      return res.status(400).json({
        success: false,
        error: 'NACEX_CLIENTE no configurado o inválido (máx. 5 dígitos). Revisa las variables de entorno.',
      });
    }

    if (!zip || zip.length > 15) {
      return res.status(400).json({
        success: false,
        error: 'Código postal de entrega inválido. El pedido debe tener shipping_zip / cp (1-15 caracteres).',
      });
    }

    if (!city) {
      return res.status(400).json({
        success: false,
        error: 'Ciudad de entrega obligatoria. El pedido debe tener población/ciudad en la dirección de envío.',
      });
    }

    if (!NACEX_CP_RECOGIDA || !NACEX_DIR_RECOGIDA || !NACEX_NOMBRE_RECOGIDA) {
      return res.status(400).json({
        success: false,
        error: 'Faltan datos de recogida de la tienda. Configura NACEX_DIR_RECOGIDA, NACEX_CP_RECOGIDA y NACEX_NOMBRE_RECOGIDA.',
      });
    }

    try {
      // Solo construimos los datos reales si NO es modo test
      const isNacexShop = Boolean(body.isNacexShop);
      const nacexData = [
        `del_cli=${NACEX_AGENCY}`,
        `num_cli=${cleanCliente}`,
        `tip_ser=${isNacexShop ? '31' : '08'}`,
        `tip_cob=O`,
        `ref_cli=${(orderId || 'ORD').split('-')[0]}`,
        `tip_env=${isNacexShop ? '1' : '2'}`,
        `bul=001`,
        `kil=00001.000`,
        // Recogida (remitente / tienda) — obligatorio
        `nom_rec=${nacexField(NACEX_NOMBRE_RECOGIDA)}`,
        `dir_rec=${nacexField(NACEX_DIR_RECOGIDA)}`,
        `pais_rec=ES`,
        `cp_rec=${nacexField(NACEX_CP_RECOGIDA)}`,
        `pob_rec=${nacexField(NACEX_POBLACION_RECOGIDA)}`,
        `tel_rec=${NACEX_TEL_RECOGIDA}`,
        // Entrega (destinatario / cliente)
        `nom_ent=${nacexField(customerName)}`,
        `dir_ent=${nacexField(address)}`,
        `pais_ent=ES`,
        `cp_ent=${nacexField(zip)}`,
        `pob_ent=${nacexField(city)}`,
        `tel_ent=${phone.replace(/\D/g, '').slice(0, 15) || '600000000'}`,
      ].join('|');

      console.log('Nacex Data Payload:', nacexData);

      const response = await fetch(`${NACEX_WS_URL}?method=putExpedicion&user=${encodeURIComponent(NACEX_USER)}&pass=${encodeURIComponent(NACEX_PASS)}&data=${encodeURIComponent(nacexData)}`);
      const rawData = await decodeNacexResponse(response);
      const parts = rawData.split('|');

      if (parts[0] === 'OK') {
        return res.status(200).json({ success: true, tracking: parts[1], label_url: parts[2], mode: 'real' });
      }
      return res.status(400).json({ success: false, error: formatNacexError(rawData) });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Error interno' });
    }
  }

  return res.status(400).json({ error: 'Método no soportado' });
}
