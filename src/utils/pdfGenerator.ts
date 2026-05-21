
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Order } from '@/types';
import {
  getOrderDiscountAmount,
  getOrderItemLineFinal,
  getOrderItemOriginalUnit,
  orderHasDiscount,
} from '@/lib/orderPricing';

export const generateInvoicePDF = async (order: Order, user: { name?: string; surname?: string } | null): Promise<jsPDF> => {
  const doc = new jsPDF({
    compress: true
  });
  
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

    return [
      item.name || `Producto #${item.product_id}`,
      sizeLabel,
      String(item.quantity),
      `${getOrderItemOriginalUnit(item).toFixed(2)}€`,
      `${getOrderItemLineFinal(item).toFixed(2)}€`,
    ];
  });
  
  autoTable(doc, {
    startY: startY + 80,
    head: [['Artículo', 'Talla', 'Cant.', 'P. unit.', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [255, 79, 112], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 22, halign: 'center' },
      2: { cellWidth: 16, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
    },
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  const subtotal = order.subtotal ?? order.total_amount - (order.shipping_cost || 0);
  const discountAmount = getOrderDiscountAmount(order);
  const totalsX = 190;
  const totalsMaxWidth = 75;
  const lineHeight = 5;

  const drawTotalsLine = (text: string, y: number, opts?: { bold?: boolean; size?: number }) => {
    doc.setFontSize(opts?.size ?? 10);
    doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
    doc.setTextColor(opts?.bold ? 0 : 100);
    const lines = doc.splitTextToSize(text, totalsMaxWidth);
    lines.forEach((line: string, i: number) => {
      doc.text(line, totalsX, y + i * lineHeight, { align: 'right' });
    });
    return y + lines.length * lineHeight;
  };

  let y = drawTotalsLine(`Subtotal: ${subtotal.toFixed(2)}€`, finalY);

  if (hasDiscount) {
    y = drawTotalsLine(`Descuento: −${discountAmount.toFixed(2)}€`, y + 1);
    if (order.discount_code) {
      y = drawTotalsLine(`Código: ${order.discount_code}`, y, { size: 9 });
    }
  }

  y = drawTotalsLine(`Gastos de envío: ${order.shipping_cost?.toFixed(2) || '0.00'}€`, y + 1);
  y = drawTotalsLine(`Impuestos (IVA incl.): ${order.tax_amount?.toFixed(2) || '0.00'}€`, y + 1);
  drawTotalsLine(`TOTAL: ${order.total_amount.toFixed(2)}€`, y + 4, { bold: true, size: 14 });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150);
  doc.text('Gracias por confiar en Modas Me lo Merezco.', 105, 275, { align: 'center' });
  doc.text('Vístete para ti.', 105, 282, { align: 'center' });
  
  return doc;
};
