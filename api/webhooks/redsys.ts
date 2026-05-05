import type { VercelRequest, VercelResponse } from '@vercel/node';
import CryptoJS from 'crypto-js';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { Ds_Signature, Ds_MerchantParameters } = req.body;

  if (!Ds_Signature || !Ds_MerchantParameters) {
    // Redsys sometimes sends parameters in different casing or direct body
    // but usually it's standard POST parameters.
    return res.status(400).json({ message: 'Missing parameters' });
  }

  const secretKey = process.env.VITE_REDSYS_SECRET_KEY;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secretKey || !supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ message: 'Server configuration error' });
  }

  try {
    // 1. Verify Signature
    const merchantParamsString = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(Ds_MerchantParameters));
    const merchantParams = JSON.parse(merchantParamsString);
    const orderIdNumeric = merchantParams.Ds_Order;
    
    const key = CryptoJS.enc.Base64.parse(secretKey);
    const iv = CryptoJS.enc.Hex.parse('0000000000000000');
    const cipher = CryptoJS.TripleDES.encrypt(orderIdNumeric, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.ZeroPadding
    });

    const localKey = cipher.ciphertext;
    const expectedSignature = CryptoJS.HmacSHA256(Ds_MerchantParameters, localKey);
    const expectedSignatureB64 = CryptoJS.enc.Base64.stringify(expectedSignature).replace(/\+/g, '-').replace(/\//g, '_');
    
    // Redsys uses a URL-safe Base64 for the signature in notifications sometimes, 
    // but the comparison should be robust.
    const providedSignature = Ds_Signature.replace(/\+/g, '-').replace(/\//g, '_');

    if (providedSignature !== expectedSignatureB64) {
      console.error('Invalid Redsys signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }

    // 2. Check Payment Status (0000 to 0099 is success)
    const responseCode = parseInt(merchantParams.Ds_Response);
    if (responseCode >= 0 && responseCode <= 99) {
      // SUCCESS!
      const orderUuid = merchantParams.Ds_MerchantData; // Here is our real ID
      
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Update Order Status
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .update({ order_status: 'Paid', payment_status: 'Paid' })
        .eq('order_id', orderUuid)
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Decrement Stock
      // We need the order items. They are in the 'order_items' table usually, 
      // but in your schema they might be a JSON column or a separate table.
      // Based on CheckoutPage, they seem to be passed to api.orders.create.
      // Let's check if there are order items to process.
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderUuid);

      if (!itemsError && items) {
        for (const item of items) {
          // We need the variant_id to decrement stock accurately
          // If variant_id is not in order_items, we'd need to find it.
          // In CheckoutPage, it was: item.selectedVariant.variant_id
          if (item.variant_id) {
            await supabase.rpc('decrement_stock', { 
              p_variant_id: item.variant_id, 
              p_quantity: item.quantity 
            });
          }
        }
      }

      // 4. Send Confirmation Email
      if (order && order.customer_email) {
        const transporter = nodemailer.createTransport({
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
          },
        });

        await transporter.sendMail({
          from: '"Modas Me lo Merezco" <info@modasmelomerezco.com>',
          to: order.customer_email,
          subject: `¡Gracias por tu compra! Pedido #${orderUuid.split('-')[0].toUpperCase()}`,
          html: `<h1>¡Hola!</h1><p>Tu pedido ha sido confirmado y pagado correctamente.</p><p>ID de pedido: ${orderUuid}</p>`
        });
      }

      return res.status(200).json({ success: true });
    } else {
      console.log('Payment failed or cancelled by user. Response:', responseCode);
      return res.status(200).json({ message: 'Payment not successful' });
    }
  } catch (error) {
    console.error('Webhook Error:', error);
    return res.status(500).json({ error: (error as Error).message });
  }
}
