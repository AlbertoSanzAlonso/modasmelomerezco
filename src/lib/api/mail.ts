import { generateInvoicePDF } from "@/utils/pdfGenerator";
import { useAuthStore } from "@/store/useAuthStore";

export interface SendEmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
}

export const mailApi = {
  send: async (params: SendEmailParams) => {
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const text = await response.text();
        let message = 'Error sending email';
        try {
          const error = JSON.parse(text);
          message = error.message || message;
        } catch (e) {
          message = text || response.statusText;
        }
        throw new Error(message);
      }

      return await response.json();
    } catch (error) {
      console.error('Mail API Error:', error);
      throw error;
    }
  },

  sendOrderConfirmation: async (order: any, customerEmail: string) => {
    const orderId = order.order_id.split('-')[0].toUpperCase();
    const logoUrl = 'https://aoyafhjpgmxcygqnklvl.supabase.co/storage/v1/object/public/assets/logo/LOGO%20MELOMEREZCO%20completo%20color.png';
    const { user } = useAuthStore.getState();
    
    // Generate PDF Invoice
    const doc = await generateInvoicePDF(order, user);
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    console.log(`Factura generada. Tamaño Base64: ${(pdfBase64.length / 1024).toFixed(2)} KB`);

    const itemsHtml = order.items.map((item: any) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 10px 0; font-size: 12px;">${item.name || `Producto #${item.product_id}`} ${item.size ? `<span style="color: #ff3366;">(Talla: ${item.size})</span>` : ''}</td>
        <td style="padding: 10px 0; text-align: center; font-size: 12px;">${item.quantity}</td>
        <td style="padding: 10px 0; text-align: right; font-size: 12px;">${item.price.toFixed(2)}€</td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 10px;">
          <img src="${logoUrl}" alt="Modas Me lo Merezco" style="width: 200px; height: auto;">
        </div>
        <h1 style="color: #000; text-transform: uppercase; font-style: italic; border-bottom: 2px solid #000; padding-bottom: 20px; text-align: center;">
          Pedido <span style="color: #ff3366;">#${orderId}</span> en marcha
        </h1>
        <p style="text-align: center;">¡Hola <strong>${order.customer?.name || user?.name || 'cliente'}</strong>!</p>
        <p style="text-align: center;">Gracias por tu compra en <strong>Modas Me lo Merezco</strong>. Tu pedido ya está siendo preparado.</p>
        
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

        <p style="text-align: center; font-size: 13px; color: #666; margin-top: 30px;">Hemos adjuntado la factura en PDF a este correo para que la tengas siempre a mano.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 11px; color: #999; text-align: center;">Si tienes alguna pregunta sobre tu pedido, simplemente responde a este email.</p>
      </div>
    `;

    const payload = {
      to: customerEmail,
      subject: `Confirmación de pedido #${orderId} - Modas Me lo Merezco`,
      html,
      attachments: [
        {
          filename: `Factura_Pedido_${orderId}.pdf`,
          content: pdfBase64,
          encoding: 'base64'
        }
      ]
    };

    return mailApi.send(payload);
  },

  sendPasswordRecovery: async (email: string, resetLink: string) => {
    const logoUrl = 'https://aoyafhjpgmxcygqnklvl.supabase.co/storage/v1/object/public/assets/logo/LOGO%20MELOMEREZCO%20completo%20color.png';
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 10px;">
          <img src="${logoUrl}" alt="Modas Me lo Merezco" style="width: 180px; height: auto;">
        </div>
        <h2 style="color: #000; text-transform: uppercase; font-style: italic; text-align: center;">Recuperación de Contraseña</h2>
        <p style="text-align: center;">Has solicitado restablecer tu contraseña en <strong>Modas Me lo Merezco</strong>.</p>
        <div style="margin: 30px 0; text-align: center;">
          <a href="${resetLink}" style="background: #000; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
            Restablecer contraseña
          </a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">Si no has solicitado esto, puedes ignorar este correo.</p>
      </div>
    `;

    return mailApi.send({
      to: email,
      subject: 'Recuperación de contraseña - Modas Me lo Merezco',
      html
    });
  },

  sendStatusUpdate: async (order: any, customerEmail: string, newStatus: string) => {
    const orderId = order.order_id.split('-')[0].toUpperCase();
    const logoUrl = 'https://aoyafhjpgmxcygqnklvl.supabase.co/storage/v1/object/public/assets/logo/LOGO%20MELOMEREZCO%20completo%20color.png';
    const statusMap: Record<string, string> = {
      'Paid': 'Pagado',
      'Shipped': 'Enviado',
      'Delivered': 'Entregado',
      'Cancelled': 'Cancelado'
    };
    const statusName = statusMap[newStatus] || newStatus;
    
    // Tracking info
    const trackingNumber = order.tracking_number;
    const carrier = order.carrier || 'NACEX';
    const trackingUrl = carrier === 'NACEX' 
      ? `https://www.nacex.es/seguimientoPedido.do?numExp=${trackingNumber}`
      : '#';

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 10px;">
          <img src="${logoUrl}" alt="Modas Me lo Merezco" style="width: 180px; height: auto;">
        </div>
        <h2 style="color: #000; text-transform: uppercase; font-style: italic; text-align: center;">Actualización de tu Pedido <span style="color: #ff3366;">#${orderId}</span></h2>
        <p style="text-align: center;">Hola <strong>${order.customer?.name || 'cliente'}</strong>,</p>
        <p style="text-align: center;">El estado de tu pedido ha cambiado a: <strong style="color: #ff3366; text-transform: uppercase;">${statusName}</strong></p>
        
        ${newStatus === 'Shipped' ? `
          <div style="background: #f9f9f9; padding: 25px; border-radius: 10px; margin: 25px 0; text-align: center; border: 1px dashed #ddd;">
            <p style="margin: 0 0 10px 0; font-weight: bold; text-transform: uppercase; font-size: 12px; color: #888;">Información de Seguimiento</p>
            <p style="margin: 0 0 5px 0; font-size: 14px;">Transportista: <strong>${carrier}</strong></p>
            <p style="margin: 0 0 20px 0; font-size: 14px;">Nº de seguimiento: <strong>${trackingNumber || 'En gestión'}</strong></p>
            ${trackingNumber ? `
              <a href="${trackingUrl}" style="background: #000; color: #fff; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                Seguir mi pedido
              </a>
            ` : ''}
          </div>
        ` : ''}
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://modasmelomerezco.com/cuenta/pedidos" style="background: #000; color: #fff; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
            Ver mis pedidos
          </a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 11px; color: #999; text-align: center;">Gracias por confiar en Modas Me lo Merezco.</p>
      </div>
    `;

    return mailApi.send({
      to: customerEmail,
      subject: `Actualización de pedido #${orderId}: ${statusName} - Modas Me lo Merezco`,
      html
    });
  },

  sendNewsletter: async (to: string, subject: string, content: string, origin: string = 'https://modasmelomerezco.com') => {
    const logoUrl = 'https://aoyafhjpgmxcygqnklvl.supabase.co/storage/v1/object/public/assets/logo/LOGO%20MELOMEREZCO%20completo%20color.png';
    const unsubscribeUrl = `${origin}/desuscribir?email=${encodeURIComponent(to)}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 10px; background-color: #fff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${logoUrl}" alt="Modas Me lo Merezco" style="width: 180px; height: auto;">
        </div>
        <div style="line-height: 1.6; color: #333; font-size: 16px; margin-bottom: 30px;">
          ${content.replace(/\n/g, '<br>')}
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0;" />
        <div style="text-align: center;">
          <p style="font-size: 11px; color: #999;">
            Recibes este correo porque estás suscrito a nuestra newsletter.<br>
            <a href="${unsubscribeUrl}" style="color: #999;">Darse de baja</a>
          </p>
          <div style="margin-top: 20px;">
            <a href="https://www.instagram.com/modasmelomerezco" style="text-decoration: none; margin: 0 10px;">
              <img src="https://cdn-icons-png.flaticon.com/512/174/174855.png" width="20" height="20" alt="Instagram">
            </a>
            <a href="https://www.facebook.com/profile.php?id=61555721379464" style="text-decoration: none; margin: 0 10px;">
              <img src="https://cdn-icons-png.flaticon.com/512/124/124010.png" width="20" height="20" alt="Facebook">
            </a>
          </div>
          <p style="font-size: 10px; color: #ccc; margin-top: 20px;">© 2026 Modas Me lo Merezco. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    return mailApi.send({
      to,
      subject,
      html
    });
  },

  sendConfirmationEmail: async (to: string, token: string, origin: string = 'https://modasmelomerezco.com') => {
    const logoUrl = 'https://aoyafhjpgmxcygqnklvl.supabase.co/storage/v1/object/public/assets/logo/LOGO%20MELOMEREZCO%20completo%20color.png';
    const confirmUrl = `${origin}/confirmar-suscripcion?token=${token}`;
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 40px; border-radius: 10px; background-color: #fff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="${logoUrl}" alt="Modas Me lo Merezco" style="width: 180px; height: auto;">
        </div>
        <h2 style="color: #000; text-transform: uppercase; font-style: italic; text-align: center;">¡Casi estás dentro!</h2>
        <p style="text-align: center; line-height: 1.6; color: #333; font-size: 16px;">
          Gracias por querer unirte a nuestra comunidad. Solo falta un último paso para activar tu suscripción y empezar a recibir nuestras novedades.
        </p>
        <div style="margin: 40px 0; text-align: center;">
          <a href="${confirmUrl}" style="background: #000; color: #fff; padding: 18px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 2px; font-size: 13px;">
            Confirmar mi suscripción
          </a>
        </div>
        <p style="text-align: center; font-size: 12px; color: #888;">
          Si no has solicitado esto, puedes ignorar este correo con total tranquilidad.
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0;" />
        <p style="font-size: 10px; color: #ccc; text-align: center;">© 2026 Modas Me lo Merezco.</p>
      </div>
    `;

    return mailApi.send({
      to,
      subject: 'Confirma tu suscripción - Modas Me lo Merezco',
      html
    });
  }
};
