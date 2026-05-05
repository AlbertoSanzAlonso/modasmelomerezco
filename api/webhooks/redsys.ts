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
        const orderId = order.order_id.split('-')[0].toUpperCase();
        const logoUrl = 'https://aoyafhjpgmxcygqnklvl.supabase.co/storage/v1/object/public/assets/logo/LOGO%20MELOMEREZCO%20completo%20color.png';
        
        // Build items HTML
        const itemsHtml = items ? items.map((item: any) => `
          <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px 0; font-size: 12px;">${item.name || `Producto #${item.product_id}`} ${item.size ? `<span style="color: #ff3366;">(Talla: ${item.size})</span>` : ''}</td>
            <td style="padding: 10px 0; text-align: center; font-size: 12px;">${item.quantity}</td>
            <td style="padding: 10px 0; text-align: right; font-size: 12px;">${item.price.toFixed(2)}€</td>
          </tr>
        `).join('') : '';

        const html = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 10px;">
              <img src="${logoUrl}" alt="Modas Me lo Merezco" style="width: 200px; height: auto;">
            </div>
            <h1 style="color: #000; text-transform: uppercase; font-style: italic; border-bottom: 2px solid #000; padding-bottom: 20px; text-align: center;">
              Pedido <span style="color: #ff3366;">#${orderId}</span> Confirmado
            </h1>
            <p style="text-align: center;">¡Hola!</p>
            <p style="text-align: center;">Gracias por tu compra en <strong>Modas Me lo Merezco</strong>. Tu pedido ya ha sido pagado y está siendo preparado.</p>
            
            <div style="margin: 30px 0;">
              <h3 style="border-bottom: 1px solid #eee; padding-bottom: 10px; text-transform: uppercase; font-size: 12px; color: #888;">Detalles de tu compra</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="border-bottom: 2px solid #eee; text-align: left; color: #888; text-transform: uppercase; font-size: 10px;">
                    <th style="padding-bottom: 10px;">Artículo</th>
                    <th style="padding-bottom: 10px; text-align: center;">Cant.</th>
                    <th style="padding-bottom: 10px; text-align: right;">Precio</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>
              
              <div style="margin-top: 20px; text-align: right; font-weight: bold;">
                <p style="margin: 5px 0; font-size: 12px; color: #888; font-weight: normal;">Subtotal: ${(order.total_amount - (order.shipping_cost || 0)).toFixed(2)}€</p>
                <p style="margin: 5px 0; font-size: 12px; color: #888; font-weight: normal;">Envío: ${order.shipping_cost?.toFixed(2) || '0.00'}€</p>
                <p style="margin: 10px 0; font-size: 18px; color: #000;">TOTAL: ${order.total_amount.toFixed(2)}€</p>
              </div>
            </div>

            <div style="background: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0; font-size: 13px;">
              <h4 style="margin-top: 0; text-transform: uppercase; font-size: 11px; color: #888;">Dirección de Envío</h4>
              <p style="margin: 5px 0;">${order.shipping_street}</p>
              <p style="margin: 5px 0;">${order.shipping_zip} ${order.shipping_city}, ${order.shipping_province}</p>
            </div>

            <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
            <p style="font-size: 11px; color: #999; text-align: center;">Si tienes alguna pregunta, simplemente responde a este email. Gracias por confiar en nosotros.</p>
          </div>
        `;

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
          subject: `Confirmación de pedido #${orderId} - Modas Me lo Merezco`,
          html
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
