
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { canFulfillOrder } from '../src/lib/orderPayment.js';

/** Versión del handler (comprobar en Network → respuesta JSON tras redeploy). */
const NACEX_API_VERSION = '2026-11-nacexshop-v6';
const NACEX_WS_URL = 'https://pda.nacex.com/nacex_ws/ws';

/** Evita romper el formato pipe-separated de Nacex. */
function nacexField(value: string): string {
  return value.replace(/\|/g, ' ').trim();
}

/** putExpedicion devuelve OK|... (antiguo) o código numérico|albarán|... (actual). */
function parsePutExpedicionResponse(raw: string): {
  tracking: string;
  albaran?: string;
  labelUrl?: string;
} | null {
  const text = raw.trim();
  if (!text || text.toUpperCase().startsWith('ERROR')) return null;

  const parts = text.split('|').map((p) => p.trim());
  if (parts[0] === 'OK' && parts[1]) {
    return { tracking: parts[1], labelUrl: parts[2] };
  }
  if (/^\d+$/.test(parts[0] ?? '')) {
    return { tracking: parts[0], albaran: parts[1] };
  }
  return null;
}

/**
 * Codifica un valor como la librería PHP oficial: utf8_decode + urlencode.
 * Nacex interpreta el payload en ISO-8859-1; encodeURIComponent manda UTF-8
 * y en la etiqueta aparece mojibake (á → Ã¡, ° → Â°).
 */
function encodeNacexValue(value: string): string {
  let out = '';
  for (const char of value) {
    const code = char.codePointAt(0)!;
    if (code === 0x20) {
      out += '+';
      continue;
    }
    // Igual que PHP urlencode: A-Z a-z 0-9 - _ .
    if (
      (code >= 0x30 && code <= 0x39) ||
      (code >= 0x41 && code <= 0x5a) ||
      (code >= 0x61 && code <= 0x7a) ||
      code === 0x2d ||
      code === 0x5f ||
      code === 0x2e
    ) {
      out += char;
      continue;
    }
    if (code <= 0xff) {
      out += `%${code.toString(16).toUpperCase().padStart(2, '0')}`;
      continue;
    }
    // Fuera de Latin-1 (como utf8_decode → ?)
    out += '%3F';
  }
  return out;
}

/** Codifica cada par clave=valor (valores en ISO-8859-1 percent-encoded). */
function encodeNacexData(pairs: string[]): string {
  return pairs
    .map((pair) => {
      const eq = pair.indexOf('=');
      if (eq === -1) return pair;
      const key = pair.slice(0, eq);
      const value = pair.slice(eq + 1);
      return `${key}=${encodeNacexValue(value)}`;
    })
    .join('|');
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
  if (/punto de recogida|shop_codigo|5622/i.test(mainMessage)) {
    hints.push(
      'Punto Nacex.Shop: falta el código numérico del punto de recogida (shop_codigo) para el servicio E-NACEX.shop (31).',
    );
  }
  if (/envase|documentado como BAG/i.test(mainMessage)) {
    hints.push('Envase: el servicio 31 (E-NACEX.shop) requiere tip_env=2 (Paq) y no admite envase tipo BAG (1).');
  }
  if (
    (/recogida|nom_rec|dir_rec|cp_rec|pob_rec/i.test(mainMessage) &&
      !/punto de recogida/i.test(mainMessage))
  ) {
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

export interface ParsedNacexPoint {
  id: string;
  alias?: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  phone?: string;
  hours?: string;
  lat?: string;
  lng?: string;
}

/**
 * Parsea la respuesta de getPuntoEntregaCP.
 * Nacex separa registros con "|" (el primero suele ser el contador "10") y campos con "~":
 * código~nombre/dirección~población~cp~teléfono~horarios(L-D)~shop_alias~lat~lng
 */
function parseNacexShopPoints(rawData: string): ParsedNacexPoint[] {
  const entries = rawData
    .split(/[|\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => l && l.includes('~'));

  return entries.map((entry) => {
    const p = entry.split('~');
    const rawId = (p[0] || '').trim();
    const rawTitle = (p[1] || 'Punto Nacex').trim();

    let cleanTitle = rawTitle.replace(/^[0-9\-]+\s+/, '').trim();
    cleanTitle = cleanTitle.replace(/AGENCIA\s+[0-9]+\s*/gi, '').trim();

    // En getPuntoEntregaCP p[1] suele venir como "NOMBRE COMERCIO, DIRECCIÓN"
    const commaIdx = cleanTitle.indexOf(',');
    const name = commaIdx > 0 ? cleanTitle.slice(0, commaIdx).trim() : cleanTitle;
    const address = commaIdx > 0 ? cleanTitle.slice(commaIdx + 1).trim() : cleanTitle;

    return {
      id: rawId,
      alias: p[12] && p[12] !== 'null' ? p[12].trim() : undefined,
      name: name || cleanTitle || 'Punto Nacex',
      address: address || p[2] || '',
      city: (p[2] || '').trim(),
      zip: (p[3] || '').trim(),
      phone: (p[4] || '').trim(),
      hours: p[5] && p[5] !== 'null' ? p[5].trim() : '',
      lat: (p[p.length - 2] || '').trim(),
      lng: (p[p.length - 1] || '').trim(),
    };
  });
}

/** Extrae el código numérico de punto de un string como "Nacex Point [365]: ..." o id directo. */
function extractShopCode(shopCode?: unknown, carrier?: unknown): string {
  const direct = String(shopCode ?? '').trim();
  if (/^\d{1,6}$/.test(direct)) return direct;

  const carrierStr = String(carrier ?? '').trim();
  const bracketMatch = carrierStr.match(/\[(\d{1,6})\]/);
  if (bracketMatch?.[1]) return bracketMatch[1];

  const hashMatch = carrierStr.match(/#(\d{1,6})\b/);
  if (hashMatch?.[1]) return hashMatch[1];

  return '';
}

/** Si el pedido antiguo no guardó el ID numérico del punto en carrier, lo busca en getPuntoEntregaCP por CP. */
async function resolveShopCodeFromCarrier(
  user: string,
  pass: string,
  cp: string,
  carrierStr: string,
): Promise<string> {
  try {
    const response = await fetch(
      `${NACEX_WS_URL}?method=getPuntoEntregaCP&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}&data=${encodeURIComponent(cp)}`,
    );
    const rawData = await decodeNacexResponse(response);
    const points = parseNacexShopPoints(rawData);
    if (!points.length) return '';

    const normalizedCarrier = carrierStr.toUpperCase();
    for (const pt of points) {
      const addrNorm = pt.address.toUpperCase();
      const nameNorm = pt.name.toUpperCase();
      if (
        (addrNorm && normalizedCarrier.includes(addrNorm)) ||
        (nameNorm && addrNorm && normalizedCarrier.includes(`${nameNorm}, ${addrNorm}`))
      ) {
        return pt.id;
      }
    }

    for (const pt of points) {
      const nameNorm = pt.name.toUpperCase();
      if (nameNorm && nameNorm.length > 3 && normalizedCarrier.includes(nameNorm)) {
        return pt.id;
      }
    }

    return points[0]?.id || '';
  } catch {
    return '';
  }
}

function nacexLabelPath(codExp: string): string {
  return `/api/nacex?method=get_etiqueta&codExp=${encodeURIComponent(codExp)}`;
}

/** Guarda tracking con service role (el admin en cliente suele fallar por RLS). */
async function saveOrderTracking(
  orderId: string,
  tracking: string,
  existingCarrier?: string | null,
): Promise<boolean> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey || !orderId) return false;

  const preserveCarrier =
    existingCarrier && existingCarrier.toLowerCase().includes('nacex point')
      ? existingCarrier
      : 'NACEX';

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase
    .from('orders')
    .update({
      tracking_number: tracking,
      carrier: preserveCarrier,
      order_status: 'Shipped',
      shipped_date: new Date().toISOString(),
    })
    .eq('order_id', orderId)
    .select('order_id, tracking_number')
    .maybeSingle();

  if (error) {
    console.error('[nacex] No se pudo guardar tracking en orders:', error.message);
    return false;
  }
  return Boolean(data?.tracking_number);
}

/** Descarga etiqueta PNG desde Nacex (respuesta en base64). */
async function fetchNacexLabelPng(user: string, pass: string, codExp: string): Promise<Buffer | null> {
  const labelData = encodeNacexData([`codExp=${codExp}`, 'modelo=IMAGEN']);
  const labelRes = await fetch(
    `${NACEX_WS_URL}?method=getEtiqueta&user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}&data=${labelData}`,
  );
  const labelRaw = (await decodeNacexResponse(labelRes)).trim().replace(/\s+/g, '');
  if (!labelRaw || labelRaw.toUpperCase().startsWith('ERROR')) return null;
  try {
    return Buffer.from(labelRaw, 'base64');
  } catch {
    return null;
  }
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

  const { method, cp, tracking, codExp } = req.query;

  // CREDENCIALES (Prioridad a Variables de Entorno)
  const NACEX_USER = process.env.NACEX_USER || 'INFOBENALUMOX@GMAIL.COM';
  const NACEX_PASS = process.env.NACEX_PASSWORD || '';
  const NACEX_AGENCY = process.env.NACEX_AGENCIA || '2924';
  const NACEX_CLIENT = process.env.NACEX_CLIENTE || '00472';
  const NACEX_CP_RECOGIDA = process.env.NACEX_CP_RECOGIDA || '29631';
  const NACEX_NOMBRE_RECOGIDA = process.env.NACEX_NOMBRE_RECOGIDA || 'Modas Me lo Merezco';
  const NACEX_DIR_RECOGIDA = (process.env.NACEX_DIR_RECOGIDA || 'C/ Sol, 5').slice(0, 45);
  const NACEX_POBLACION_RECOGIDA = process.env.NACEX_POBLACION_RECOGIDA || 'Benalmadena';
  const NACEX_TEL_RECOGIDA = (process.env.NACEX_TEL_RECOGIDA || '951000000').replace(/\D/g, '').slice(0, 15);

  const canUseRealAPI = NACEX_PASS && NACEX_PASS !== 'tu_password' && NACEX_PASS !== 'PON_AQUI_TU_CLAVE_MD5';

  // --- ETIQUETA PNG (abrir en pestaña / imprimir) ---
  if (method === 'get_etiqueta' || method === 'get_label') {
    const expeditionCode = String(codExp || tracking || '').trim();
    if (!expeditionCode) {
      return res.status(400).json({ error: 'Falta codExp (código de expedición Nacex).' });
    }

    if (!canUseRealAPI) {
      return res.redirect(302, 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
    }

    try {
      const png = await fetchNacexLabelPng(NACEX_USER, NACEX_PASS, expeditionCode);
      if (!png?.length) {
        return res.status(404).json({ error: 'No se pudo obtener la etiqueta de Nacex.' });
      }
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="nacex-${expeditionCode}.png"`);
      res.setHeader('Cache-Control', 'private, max-age=3600');
      return res.status(200).send(png);
    } catch {
      return res.status(500).json({ error: 'Error al descargar la etiqueta.' });
    }
  }

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
      const response = await fetch(
        `${NACEX_WS_URL}?method=getPuntoEntregaCP&user=${encodeURIComponent(NACEX_USER)}&pass=${encodeURIComponent(NACEX_PASS)}&data=${encodeURIComponent(String(targetCP))}`,
      );

      const rawData = await decodeNacexResponse(response);
      const points = parseNacexShopPoints(rawData);

      return res.status(200).json(points);
    } catch (err) {
      return res.status(500).json({ error: 'Error cargando puntos Nacex' });
    }
  }

  // --- 3. CREAR ENVÍO ---
  if (method === 'create_expedition' || method === 'crear_envio') {
    const body = req.body || {};
    const { orderId } = body;

    // Admin envía nombre/cp/...; aceptar también nombres en inglés
    const customerName = (body.customerName || body.nombre || 'Cliente').toString().trim();
    const address = (body.address || body.direccion || '').toString().trim();
    const city = (body.city || body.poblacion || '').toString().trim();
    const zip = String(body.zip ?? body.cp ?? '').trim();
    const phone = String(body.phone || body.telefono || '000000000').trim();
    const email = String(body.email || body.customer_email || '').trim();

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

    let dbCarrier: string | null = null;
    let dbEmail: string | null = null;
    const orderIdStr = String(orderId || '').trim();
    if (orderIdStr) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (supabaseUrl && serviceKey) {
        const supabase = createClient(supabaseUrl, serviceKey);
        const { data: orderRow, error: orderLookupError } = await supabase
          .from('orders')
          .select('order_status, payment_status, carrier, customer_email')
          .eq('order_id', orderIdStr)
          .maybeSingle();

        if (orderLookupError || !orderRow) {
          return res.status(404).json({
            success: false,
            error: 'Pedido no encontrado.',
          });
        }

        if (!canFulfillOrder(orderRow)) {
          return res.status(403).json({
            success: false,
            error:
              'El pedido no está pagado. No se puede crear el envío hasta que Redsys confirme el pago.',
          });
        }

        dbCarrier = orderRow.carrier ?? null;
        dbEmail = orderRow.customer_email ?? null;
      }
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
      const carrierStr = String(body.carrier || dbCarrier || '').trim();
      const isNacexShop =
        Boolean(body.isNacexShop) || carrierStr.toLowerCase().includes('nacex point');

      let shopCode = extractShopCode(body.shop_codigo ?? body.shopCode, carrierStr);
      if (isNacexShop && !shopCode) {
        shopCode = await resolveShopCodeFromCarrier(NACEX_USER, NACEX_PASS, zip, carrierStr);
      }

      if (isNacexShop && !shopCode) {
        return res.status(400).json({
          success: false,
          error:
            'No se pudo determinar el código del punto Nacex.Shop (shop_codigo) para este código postal.',
        });
      }

      const cleanPhone = phone.replace(/\D/g, '').slice(0, 15) || '600000000';
      const targetEmail = (email || dbEmail || '').trim();

      // Solo construimos los datos reales si NO es modo test
      const nacexPairs = [
        `del_cli=${NACEX_AGENCY}`,
        `num_cli=${cleanCliente}`,
        `tip_ser=${isNacexShop ? '31' : '08'}`,
        `tip_cob=O`,
        `ref_cli=${(orderId || 'ORD').split('-')[0]}`,
        // Tanto Nacex 19:00H (08) como E-NACEX.shop (31) requieren envase tipo 2 (PAQ), no 1 (BAG)
        `tip_env=2`,
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
        `dir_ent=${nacexField(address || city)}`,
        `pais_ent=ES`,
        `cp_ent=${nacexField(zip)}`,
        `pob_ent=${nacexField(city)}`,
        `tel_ent=${cleanPhone}`,
      ];

      if (isNacexShop) {
        nacexPairs.push(`shop_codigo=${shopCode}`);
        // El servicio 31 (E-NACEX.shop) exige prealerta obligatoria para avisar al cliente de la llegada al punto
        if (targetEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
          nacexPairs.push('tip_pre1=E', 'mod_pre1=S', `pre1=${nacexField(targetEmail)}`);
        } else {
          nacexPairs.push('tip_pre1=S', 'mod_pre1=S', `pre1=${cleanPhone}`);
        }
      }

      const nacexData = nacexPairs.join('|');
      const nacexDataEncoded = encodeNacexData(nacexPairs);
      console.log('Nacex Data Payload:', nacexData);
      console.log('Nacex API version:', NACEX_API_VERSION);

      const response = await fetch(
        `${NACEX_WS_URL}?method=putExpedicion&user=${encodeURIComponent(NACEX_USER)}&pass=${encodeURIComponent(NACEX_PASS)}&data=${nacexDataEncoded}`,
      );
      const rawData = await decodeNacexResponse(response);
      const created = parsePutExpedicionResponse(rawData);

      if (created) {
        const label_url =
          created.labelUrl && !created.labelUrl.startsWith('data:')
            ? created.labelUrl
            : nacexLabelPath(created.tracking);

        const orderIdToSave = String(body.orderId || orderId || '').trim();
        const orderSaved = orderIdToSave
          ? await saveOrderTracking(orderIdToSave, created.tracking, carrierStr || dbCarrier)
          : false;

        return res.status(200).json({
          success: true,
          tracking: created.tracking,
          albaran: created.albaran,
          label_url,
          orderSaved,
          mode: 'real',
          apiVersion: NACEX_API_VERSION,
        });
      }

      return res.status(400).json({
        success: false,
        error: formatNacexError(rawData),
        apiVersion: NACEX_API_VERSION,
        hasRecogidaFields: nacexData.includes('nom_rec='),
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: 'Error interno' });
    }
  }

  return res.status(400).json({ error: 'Método no soportado' });
}
