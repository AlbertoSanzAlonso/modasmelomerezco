import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { Product } from '@/types';

export const downloadProductImagesAsZip = async (products: Product[]) => {
  const zip = new JSZip();
  const folder = zip.folder('imagenes-productos');

  const downloadPromises = products.flatMap(product => {
    const productName = product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const productFolder = folder?.folder(productName);

    return (product.images || []).map(async (url, index) => {
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
        productFolder?.file(`${productName}_${index + 1}.${extension}`, blob);
      } catch (error) {
        console.error(`Error downloading image ${url}:`, error);
      }
    });
  });

  await Promise.all(downloadPromises);
  const content = await zip.generateAsync({ type: 'blob' });
  const fileName = products.length === 1 
    ? `fotos_${products[0].name.toLowerCase().replace(/\s+/g, '_')}.zip`
    : `fotos_seleccion_${products.length}_productos.zip`;
    
  saveAs(content, fileName);
};
