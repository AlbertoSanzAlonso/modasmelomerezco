import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { getCanonicalSiteUrl } from './_siteUrl.js';

const SITE_URL = getCanonicalSiteUrl();
const SITE_NAME = 'Modas Me lo Merezco';

/** IDs de la taxonomía de Google Product Category (Apparel & Accessories). */
const GPC = {
  clothing: '1604',
  clothingAccessories: '167',
  dresses: '2271',
  shirtsTops: '212',
  pants: '204',
  skirts: '1581',
  outerwear: '203',
  shoes: '187',
  handbags: '3032',
  necklaces: '196',
} as const;

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

/** Categoriza para Merchant Center y evita requisitos erróneos (p. ej. unit_pricing). */
function resolveGoogleProductCategory(
  name: string,
  category?: string | null,
  subcategory?: string | null,
): string {
  const haystack = `${name} ${category || ''} ${subcategory || ''}`.toLowerCase();

  if (/zapat|bailarina|calzado/.test(haystack)) return GPC.shoes;
  if (/bolso/.test(haystack)) return GPC.handbags;
  if (/collar/.test(haystack)) return GPC.necklaces;
  if (/vestido/.test(haystack)) return GPC.dresses;
  if (/falda/.test(haystack)) return GPC.skirts;
  if (/pantalon|mallas/.test(haystack)) return GPC.pants;
  if (/chaqueta|gabardina|blazer|chaleco/.test(haystack)) return GPC.outerwear;
  if (/blusa|camiseta|top|body|sudadera|camisa/.test(haystack)) return GPC.shirtsTops;
  if (/lencer|conjunto/.test(haystack)) return GPC.clothing;

  const cat = (category || '').toLowerCase();
  if (cat === 'calzado') return GPC.shoes;
  if (cat === 'complementos') return GPC.clothingAccessories;
  if (cat === 'ropa') return GPC.clothing;

  return GPC.clothing;
}

function resolveProductType(
  category?: string | null,
  subcategory?: string | null,
): string {
  const parts = [category, subcategory].map((p) => (p || '').trim()).filter(Boolean);
  return parts.length > 0 ? parts.join(' > ') : 'Ropa';
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
      category,
      subcategory,
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

      const googleCategory = resolveGoogleProductCategory(p.name || '', p.category, p.subcategory);
      const productType = resolveProductType(p.category, p.subcategory);

      const safeTitle = escapeXml(p.name || 'Producto');
      const safeDescription = escapeXml(
        truncate(p.description || `${p.name} - Compra online en ${SITE_NAME}`),
      );
      const safeId = escapeXml(p.product_id);
      const safePrice = Number(p.price).toFixed(2);
      const safeImageLink = escapeXml(imageLink);
      const safeBrand = escapeXml(SITE_NAME);
      const safeProductType = escapeXml(productType);

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
      parts.push(`      <g:google_product_category>${googleCategory}</g:google_product_category>`);
      parts.push(`      <g:product_type>${safeProductType}</g:product_type>`);
      // Catálogo vendido por unidades (pieza). Cumple el requisito legal de precio unitario en ES.
      parts.push(`      <g:unit_pricing_measure>1 ct</g:unit_pricing_measure>`);
      parts.push(`      <g:unit_pricing_base_measure>1 ct</g:unit_pricing_base_measure>`);
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
