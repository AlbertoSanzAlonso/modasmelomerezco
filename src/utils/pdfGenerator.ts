
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Order } from '@/types';
import {
  getOrderDiscountAmount,
  getOrderItemLineDiscount,
  getOrderItemLineFinal,
  getOrderItemLineOriginal,
  getOrderItemOriginalUnit,
  orderHasDiscount,
  orderItemHasDiscount,
} from '@/lib/orderPricing';

export const generateInvoicePDF = async (order: Order, user: { name?: string; surname?: string } | null): Promise<jsPDF> => {
  const doc = new jsPDF({
    compress: true
  });
  
  // Header with Logos
  try {
    const coronaUrl = 'https://aoyafhjpgmxcygqnklvl.supabase.co/storage/v1/object/public/assets/logo/logo-corona.png';
    const lettersUrl = 'https://aoyafhjpgmxcygqnklvl.supabase.co/storage/v1/object/public/assets/logo/LOGO%20MELOMEREZCO%20solo%20letras.png';
    
    const loadImg = (url: string): Promise<HTMLImageElement | null> => new Promise((resolve) => {
      const img = new Image();
      if (url.startsWith('http')) img.crossOrigin = 'Anonymous';
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = () => {
        console.warn(`Failed to load PDF asset: ${url}`);
        resolve(null);
      };
    });
    
    const [coronaImg, lettersImg] = await Promise.all([loadImg(coronaUrl), loadImg(lettersUrl)]);
    
    if (coronaImg && coronaImg.complete && coronaImg.naturalWidth > 0) {
      const coronaW = 15;
      const coronaRatio = coronaImg.naturalHeight / coronaImg.naturalWidth;
      const coronaH = coronaW * coronaRatio;
      doc.addImage(coronaImg, 'JPEG', (210 - coronaW) / 2, 13, coronaW, coronaH, undefined, 'FAST');
      
      if (lettersImg && lettersImg.complete && lettersImg.naturalWidth > 0) {
        const lettersW = 50;
        const lettersRatio = lettersImg.naturalHeight / lettersImg.naturalWidth;
        const lettersH = lettersW * lettersRatio;
        doc.addImage(lettersImg, 'JPEG', (210 - lettersW) / 2, 15 + coronaH, lettersW, lettersH, undefined, 'FAST');
      }
    }
  } catch (e) {
    console.error('Logos failed to load for PDF', e);
  }

  const startY = 50;
  const items = order.items ?? [];
  const hasDiscount = orderHasDiscount(order);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Pedido: #${order.order_id.split('-')[0].toUpperCase()}`, 20, startY + 25);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${format(new Date(order.order_date), "d 'de' MMMM, yyyy", { locale: es })}`, 20, startY + 32);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DE ENVÍO:', 20, startY + 45);
  doc.text(`${user?.name || ''} ${user?.surname || ''}`, 20, startY + 52);
  doc.setFont('helvetica', 'normal');
  doc.text(`${order.shipping_street || ''}`, 20, startY + 57);
  doc.text(`${order.shipping_zip || ''} ${order.shipping_city || ''}`, 20, startY + 62);
  doc.text(`${order.shipping_province || ''}`, 20, startY + 67);
  
  const tableData = items.map((item) => {
    const size = item.size || '-';
    const color = item.color;
    const sizeLabel = color && color !== 'Único' ? `${size} · ${color}` : size;

    if (hasDiscount && orderItemHasDiscount(item)) {
      return [
        item.name || `Producto #${item.product_id}`,
        sizeLabel,
        String(item.quantity),
        `${getOrderItemLineOriginal(item).toFixed(2)}€`,
        `−${getOrderItemLineDiscount(item).toFixed(2)}€`,
        `${getOrderItemLineFinal(item).toFixed(2)}€`,
      ];
    }

    if (hasDiscount) {
      return [
        item.name || `Producto #${item.product_id}`,
        sizeLabel,
        String(item.quantity),
        `${getOrderItemLineOriginal(item).toFixed(2)}€`,
        '—',
        `${getOrderItemLineFinal(item).toFixed(2)}€`,
      ];
    }

    return [
      item.name || `Producto #${item.product_id}`,
      sizeLabel,
      String(item.quantity),
      `${getOrderItemOriginalUnit(item).toFixed(2)}€`,
      `${getOrderItemLineFinal(item).toFixed(2)}€`,
    ];
  });

  const tableHead = hasDiscount
    ? [['Artículo', 'Talla', 'Cant.', 'Precio', 'Descuento', 'Total']]
    : [['Artículo', 'Talla', 'Cant.', 'P. unit.', 'Total']];
  
  autoTable(doc, {
    startY: startY + 80,
    head: tableHead,
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [255, 79, 112], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: hasDiscount
      ? {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 22, halign: 'center' },
          2: { cellWidth: 14, halign: 'center' },
          3: { cellWidth: 24, halign: 'right' },
          4: { cellWidth: 24, halign: 'right' },
          5: { cellWidth: 24, halign: 'right' },
        }
      : {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 20, halign: 'center' },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
        },
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const subtotal = order.subtotal ?? order.total_amount - (order.shipping_cost || 0);
  const discountAmount = getOrderDiscountAmount(order);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Subtotal: ${subtotal.toFixed(2)}€`, 190, finalY, { align: 'right' });

  let offset = 6;
  if (hasDiscount) {
    const codeLabel = order.discount_code ? ` (${order.discount_code})` : '';
    doc.setTextColor(255, 79, 112);
    doc.text(`Descuento${codeLabel}: −${discountAmount.toFixed(2)}€`, 190, finalY + offset, { align: 'right' });
    offset += 6;
    doc.setTextColor(100);
  }

  doc.text(`Gastos de envío: ${order.shipping_cost?.toFixed(2) || '0.00'}€`, 190, finalY + offset, { align: 'right' });
  doc.text(`Impuestos (IVA incl.): ${order.tax_amount?.toFixed(2) || '0.00'}€`, 190, finalY + offset + 6, { align: 'right' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text(`TOTAL: ${order.total_amount.toFixed(2)}€`, 190, finalY + offset + 19, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150);
  doc.text('Gracias por confiar en Modas Me lo Merezco.', 105, 275, { align: 'center' });
  doc.text('Vístete para ti.', 105, 282, { align: 'center' });
  
  return doc;
};
