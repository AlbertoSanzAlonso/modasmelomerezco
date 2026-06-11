import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getCanonicalSiteUrl } from './_siteUrl.js';

const SITE_URL = getCanonicalSiteUrl();
const SITE_NAME = 'Modas Me lo Merezco';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(text: string, maxLength = 5000): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trim()}…`;
}

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return res.status(500).send('Missing Supabase credentials');
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: products, error } = await supabase
    .from('products')
    .select(`
      product_id,
      name,
      description,
      price,
      created_at,
      product_images(image_url),
      product_variants(stock)
    `)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[google-feed] Error fetching products:', error);
    return res.status(500).send('Error fetching products');
  }

  const items = (products || [])
    .filter((p: any) => {
      const name = (p.name || '').toLowerCase();
      return !name.includes('test') && !name.includes('prueba');
    })
    .map((p: any) => {
      const images = (p.product_images || []) as { image_url?: string }[];
      const firstImage = images[0]?.image_url;

      const additionalImages = images.slice(1).map((img: { image_url?: string }) => {
        const url = img.image_url || '';
        return url.startsWith('http') ? url : `${SITE_URL}${url}`;
      });

      const totalStock = (p.product_variants || []).reduce(
        (acc: number, v: any) => acc + (v.stock || 0), 0,
      );
      const availability = totalStock > 0 ? 'in_stock' : 'out_of_stock';

      const imageLink = firstImage
        ? firstImage.startsWith('http')
          ? firstImage
          : `${SITE_URL}${firstImage}`
        : `${SITE_URL}/logo.png`;

      const safeTitle = escapeXml(p.name || 'Producto');
      const safeDescription = escapeXml(
        truncate(p.description || `${p.name} - Compra online en ${SITE_NAME}`),
      );
      const safeId = escapeXml(p.product_id);
      const safePrice = Number(p.price).toFixed(2);
      const safeImageLink = escapeXml(imageLink);
      const safeBrand = escapeXml(SITE_NAME);

      const parts = ['    <item>'];
      parts.push(`      <g:id>${safeId}</g:id>`);
      parts.push(`      <g:title>${safeTitle}</g:title>`);
      parts.push(`      <g:description>${safeDescription}</g:description>`);
      parts.push(`      <g:link>${SITE_URL}/producto/${encodeURIComponent(p.product_id)}</g:link>`);
      parts.push(`      <g:image_link>${safeImageLink}</g:image_link>`);
      for (const addImg of additionalImages) {
        parts.push(`      <g:additional_image_link>${escapeXml(addImg)}</g:additional_image_link>`);
      }
      parts.push(`      <g:availability>${availability}</g:availability>`);
      parts.push(`      <g:price>${safePrice} EUR</g:price>`);
      parts.push(`      <g:brand>${safeBrand}</g:brand>`);
      parts.push(`      <g:condition>new</g:condition>`);
      parts.push(`      <g:mpn>${safeId}</g:mpn>`);
      parts.push(`      <g:shipping>`);
      parts.push(`        <g:country>ES</g:country>`);
      parts.push(`        <g:price>5.50 EUR</g:price>`);
      parts.push(`      </g:shipping>`);
      parts.push('    </item>');
      return parts.join('\n');
    });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>Tienda online de moda para mujer. Ropa, vestidos, bolsos y complementos.</description>
${items.join('\n')}
  </channel>
</rss>`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(xml);
}
