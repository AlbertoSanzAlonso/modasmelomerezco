import CryptoJS from 'crypto-js';

/**
 * REDSYS SHA256 SIGNATURE GENERATION
 * 
 * NOTE: Calculating signatures on the frontend is a security risk as it exposes 
 * the merchant secret key. Use this only if a backend is not available.
 */

export const generateRedsysParameters = (
  orderId: string,
  amount: number, // In euros, will be converted to cents
  merchantCode: string,
  terminal: string,
  secretKey: string,
  options: {
    urlOk: string;
    urlKo: string;
    urlNotification: string;
    productDescription?: string;
    paymentMethod?: 'card' | 'bizum';
  }
) => {
  // 1. Prepare Merchant Parameters
  // Redsys expects amount in cents without decimals
  const amountCents = Math.round(amount * 100).toString();
  
  // Redsys: DS_MERCHANT_ORDER 4–12 chars, first 4 numeric, UNIQUE per attempt.
  // Keep UUID mapping via DS_MERCHANT_MERCHANTDATA (same as api/redsys-params).
  const timePart = Date.now().toString().slice(-8);
  const randPart = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  const formattedOrderId = `${timePart}${randPart}`;

  const merchantParams = {
    DS_MERCHANT_AMOUNT: amountCents,
    DS_MERCHANT_ORDER: formattedOrderId,
    DS_MERCHANT_MERCHANTCODE: merchantCode,
    DS_MERCHANT_MERCHANTNAME: 'Modas Me lo Merezco',
    DS_MERCHANT_CURRENCY: '978', // Euro
    DS_MERCHANT_TERMINAL: terminal,
    DS_MERCHANT_TRANSACTIONTYPE: '0', // Authorization
    DS_MERCHANT_MERCHANTURL: options.urlNotification,
    DS_MERCHANT_URLOK: options.urlOk,
    DS_MERCHANT_URLKO: options.urlKo,
    DS_MERCHANT_PRODUCTDESCRIPTION: options.productDescription || 'Compra en Modas Me lo Merezco',
    DS_MERCHANT_MERCHANTDATA: orderId,
    ...(options.paymentMethod === 'bizum' ? { DS_MERCHANT_PAYMETHODS: 'z' } : {}),
    ...(options.paymentMethod === 'card' ? { DS_MERCHANT_PAYMETHODS: 'C' } : {})
  };

  const merchantParamsString = JSON.stringify(merchantParams);
  const merchantParamsB64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(merchantParamsString));

  // 2. Generate Signature
  // Decode the secret key from Base64
  const key = CryptoJS.enc.Base64.parse(secretKey);
  
  // Encrypt Order ID with the key using 3DES (CBC mode, zero IV)
  const iv = CryptoJS.enc.Hex.parse('0000000000000000');
  const cipher = CryptoJS.TripleDES.encrypt(formattedOrderId, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.ZeroPadding
  });

  // The local key for HMAC is the ciphertext resulting from 3DES
  const localKey = cipher.ciphertext;

  // Calculate HMAC-SHA256 of the Base64 Merchant Parameters
  const signature = CryptoJS.HmacSHA256(merchantParamsB64, localKey);
  const signatureB64 = CryptoJS.enc.Base64.stringify(signature);

  return {
    Ds_SignatureVersion: 'HMAC_SHA256_V1',
    Ds_MerchantParameters: merchantParamsB64,
    Ds_Signature: signatureB64
  };
};

export const fetchRedsysParameters = async (
  orderId: string,
  amount: number,
  options: {
    urlOk: string;
    urlKo: string;
    urlNotification: string;
    productDescription?: string;
    paymentMethod?: 'card' | 'bizum';
  }
) => {
  const response = await fetch('/api/redsys-params', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId, amount, options })
  });
  
  if (!response.ok) {
    throw new Error('Error al generar los parámetros de pago');
  }
  
  return response.json();
};

export const REDSYS_URL_TEST = 'https://sis-t.redsys.es:25443/sis/realizarPago';
export const REDSYS_URL_PROD = 'https://sis.redsys.es/sis/realizarPago';

/**
 * En producción usa siempre el origen canónico con www para que el POST
 * del webhook de Redsys nunca reciba un 308 Redirect desde el dominio raíz.
 */
export function getRedsysCallbackOrigin(): string {
  const host = window.location.hostname.toLowerCase();
  if (host === 'modasmelomerezco.es' || host === 'www.modasmelomerezco.es') {
    return 'https://www.modasmelomerezco.es';
  }
  return window.location.origin;
}

const PENDING_PAYMENT_ORDER_KEY = 'redsys_pending_payment_order';
const PENDING_PAYMENT_TTL_MS = 60 * 60 * 1000; // 1 hora

const LAST_PAYMENT_CONFIRMATION_KEY = 'redsys_last_payment_confirmation';
const LAST_PAYMENT_CONFIRMATION_TTL_MS = 30 * 60 * 1000; // 30 minutos

export type PaymentConfirmationResult = 'success' | 'pending';

export type StoredPaymentConfirmation = {
  result: PaymentConfirmationResult;
  orderId: string | null;
};

/**
 * Guarda el orderId antes de redirigir a Redsys para poder reanudar el pago
 * desde /pedido-confirmado incluso si Redsys omite parámetros en URLKO.
 */
export function savePendingPaymentOrder(orderId: string): void {
  const trimmed = orderId.trim();
  if (!trimmed) return;
  const payload = JSON.stringify({ orderId: trimmed, createdAt: Date.now() });
  try {
    sessionStorage.setItem(PENDING_PAYMENT_ORDER_KEY, payload);
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(PENDING_PAYMENT_ORDER_KEY, payload);
  } catch {
    /* ignore */
  }
}

export function getPendingPaymentOrder(): string | null {
  const readFrom = (storage: Storage): string | null => {
    try {
      const raw = storage.getItem(PENDING_PAYMENT_ORDER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { orderId?: unknown; createdAt?: unknown };
      const orderId = typeof parsed.orderId === 'string' ? parsed.orderId.trim() : '';
      const createdAt = typeof parsed.createdAt === 'number' ? parsed.createdAt : 0;
      if (!orderId || Date.now() - createdAt > PENDING_PAYMENT_TTL_MS) {
        storage.removeItem(PENDING_PAYMENT_ORDER_KEY);
        return null;
      }
      return orderId;
    } catch {
      return null;
    }
  };

  return readFrom(sessionStorage) || readFrom(localStorage);
}

export function clearPendingPaymentOrder(): void {
  try {
    sessionStorage.removeItem(PENDING_PAYMENT_ORDER_KEY);
  } catch {
    /* ignore */
  }
  try {
    localStorage.removeItem(PENDING_PAYMENT_ORDER_KEY);
  } catch {
    /* ignore */
  }
}

export function saveLastPaymentConfirmation(data: StoredPaymentConfirmation): void {
  try {
    sessionStorage.setItem(
      LAST_PAYMENT_CONFIRMATION_KEY,
      JSON.stringify({ ...data, createdAt: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

export function getLastPaymentConfirmation(): StoredPaymentConfirmation | null {
  try {
    const raw = sessionStorage.getItem(LAST_PAYMENT_CONFIRMATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      result?: unknown;
      orderId?: unknown;
      createdAt?: unknown;
    };
    const createdAt = typeof parsed.createdAt === 'number' ? parsed.createdAt : 0;
    if (Date.now() - createdAt > LAST_PAYMENT_CONFIRMATION_TTL_MS) {
      sessionStorage.removeItem(LAST_PAYMENT_CONFIRMATION_KEY);
      return null;
    }
    if (parsed.result !== 'success' && parsed.result !== 'pending') {
      return null;
    }
    return {
      result: parsed.result,
      orderId: typeof parsed.orderId === 'string' && parsed.orderId.trim() ? parsed.orderId.trim() : null,
    };
  } catch {
    return null;
  }
}
