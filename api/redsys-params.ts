import type { VercelRequest, VercelResponse } from '@vercel/node';
import CryptoJS from 'crypto-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
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

  const { orderId, amount, options } = req.body;

  if (!orderId || amount === undefined) {
    return res.status(400).json({ message: 'Missing required fields: orderId, amount' });
  }

  // Use environment variables (Securely stored on Insforge/Vercel)
  const merchantCode = process.env.VITE_REDSYS_COMMERCE_NUMBER;
  const terminal = process.env.VITE_REDSYS_TERMINAL_NUMBER || '001';
  const secretKey = process.env.VITE_REDSYS_SECRET_KEY;

  if (!merchantCode || !secretKey) {
    return res.status(500).json({ message: 'Server configuration error: Redsys keys missing' });
  }

  try {
    // 1. Prepare Merchant Parameters
    const amountCents = Math.round(amount * 100).toString();
    // Redsys requires the first 4 positions to be numeric.
    // We'll take only digits from the UUID and pad to 12 chars.
    const formattedOrderId = orderId.replace(/[^0-9]/g, '').slice(0, 12).padStart(12, '0');

    const merchantParams = {
      DS_MERCHANT_AMOUNT: amountCents,
      DS_MERCHANT_ORDER: formattedOrderId,
      DS_MERCHANT_MERCHANTCODE: merchantCode,
      DS_MERCHANT_CURRENCY: '978', // Euro
      DS_MERCHANT_TERMINAL: terminal,
      DS_MERCHANT_TRANSACTIONTYPE: '0', // Authorization
      DS_MERCHANT_MERCHANTURL: options?.urlNotification || '',
      DS_MERCHANT_URLOK: options?.urlOk || '',
      DS_MERCHANT_URLKO: options?.urlKo || '',
      DS_MERCHANT_PRODUCTDESCRIPTION: options?.productDescription || 'Compra en Modas Me lo Merezco',
      ...(options?.paymentMethod === 'bizum' ? { DS_MERCHANT_PAYMETHODS: 'z' } : {}),
      ...(options?.paymentMethod === 'card' ? { DS_MERCHANT_PAYMETHODS: 'c' } : {})
    };

    const merchantParamsString = JSON.stringify(merchantParams);
    const merchantParamsB64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(merchantParamsString));

    // 2. Generate Signature
    const key = CryptoJS.enc.Base64.parse(secretKey);
    const iv = CryptoJS.enc.Hex.parse('0000000000000000');
    const cipher = CryptoJS.TripleDES.encrypt(formattedOrderId, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.ZeroPadding
    });

    const localKey = cipher.ciphertext;
    const signature = CryptoJS.HmacSHA256(merchantParamsB64, localKey);
    const signatureB64 = CryptoJS.enc.Base64.stringify(signature);

    return res.status(200).json({
      Ds_SignatureVersion: 'HMAC_SHA256_V1',
      Ds_MerchantParameters: merchantParamsB64,
      Ds_Signature: signatureB64
    });
  } catch (error) {
    console.error('Error generating Redsys params:', error);
    return res.status(500).json({ message: 'Error generating signature' });
  }
}
