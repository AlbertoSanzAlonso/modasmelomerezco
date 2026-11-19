/// <reference types="node" />
import { createClient } from '@supabase/supabase-js';
import { getCanonicalSiteUrl } from './_siteUrl.js';
import { isProductUuid } from './_productUuid.js';
import { keyFromPublicUrl, publicUrlForKey } from './_r2.js';

const SITE_URL = getCanonicalSiteUrl();
const SITE_NAME = 'Modas Me lo Merezco';
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
const DEFAULT_TITLE = `${SITE_NAME} | Tienda online de moda para mujer`;
const DEFAULT_DESCRIPTION =
  'Tienda online de moda para mujer. Ropa, vestidos, bolsos y complementos de tendencia. Descubre colecciones exclusivas en Modas Me lo Merezco.';

export type SeoPageMeta = {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  noindex: boolean;
  type: 'website' | 'product';
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Si está definido, el middleware debe responder 301 a esta path (p. ej. UUID/ID → slug). */
  redirectTo?: string;
  /** HTML semántico pre-renderizado en servidor para crawlers dentro de <div id="root">. */
  bodyHtml?: string;
};

const STATIC_PAGES: Record<string, { title?: string; description: string }> = {
  '/': { description: DEFAULT_DESCRIPTION },
  '/categoria/ropa': {
    title: 'Ropa de mujer',
    description:
      'Colección de ropa de mujer: vestidos, blusas, pantalones y más. Moda actual con envío gratuito desde 50 € en Modas Me lo Merezco.',
  },
  '/categoria/oversize': {
    title: 'Moda oversize de mujer',
    description:
      'Colección oversize para mujer: prendas cómodas y amplias con estilo actual. Envío gratuito desde 50 € en Modas Me lo Merezco.',
  },
  '/categoria/complementos': {
    title: 'Complementos de moda',
    description:
      'Complementos y accesorios de moda para mujer. Descubre piezas únicas con envío gratuito desde 50 €.',
  },
  '/categoria/bolsos': {
    title: 'Bolsos y accesorios',
    description:
      'Bolsos y accesorios de mujer. Estilo y calidad en Modas Me lo Merezco. Envío gratuito desde 50 €.',
  },
  '/categoria/calzado': {
    title: 'Calzado de mujer',
    description:
      'Calzado de mujer: zapatos, sandalias y más. Estilo y comodidad en Modas Me lo Merezco. Envío gratuito desde 50 €.',
  },
  '/conocenos': {
    title: 'Conócenos',
    description:
      'Conoce Modas Me lo Merezco: moda para la mujer real, con piezas seleccionadas con mimo y las últimas tendencias.',
  },
  '/envios': {
    title: 'Envíos',
    description:
      'Información de envíos de Modas Me lo Merezco. Envío gratuito en pedidos superiores a 50 €. Entrega en 48 h.',
  },
  '/devoluciones': {
    title: 'Devoluciones y cambios',
    description:
      'Política de devoluciones y cambios de Modas Me lo Merezco. 14 días naturales desde la recepción del pedido.',
  },
  '/condiciones-venta': {
    title: 'Condiciones de venta',
    description: 'Condiciones generales de compra en la tienda online Modas Me lo Merezco.',
  },
  '/aviso-legal': {
    title: 'Aviso legal',
    description: 'Aviso legal e información del titular del sitio web Modas Me lo Merezco.',
  },
  '/politica-de-privacidad': {
    title: 'Política de privacidad',
    description: 'Política de privacidad y protección de datos de Modas Me lo Merezco.',
  },
  '/cookies': {
    title: 'Política de cookies',
    description: 'Información sobre el uso de cookies en modasmelomerezco.es.',
  },
};

const NOINDEX_PATHS = [
  '/checkout',
  '/confirmar-suscripcion',
  '/desuscribir',
  '/favoritos',
  '/login',
  '/registro',
  '/recuperar-password',
  '/reset-password',
  '/admin',
  '/cuenta',
];

function buildTitle(pageTitle?: string): string {
  if (!pageTitle) return DEFAULT_TITLE;
  return `${pageTitle} | ${SITE_NAME}`;
}

function truncateDescription(text: string, maxLength = 155): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trim()}…`;
}

function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

function toSeoImageUrl(url?: string | null): string {
  const raw = (url || '').trim();
  if (!raw) return DEFAULT_OG_IMAGE;
  const key = keyFromPublicUrl(raw);
  if (key) return publicUrlForKey(key);
  if (raw.startsWith('http')) return raw;
  return absoluteUrl(raw);
}

function getDbClient() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function buildSiteNavHtml(): string {
  return `<header><nav aria-label="Navegación principal"><a href="${SITE_URL}/">${SITE_NAME}</a> | <a href="${SITE_URL}/categoria/ropa">Ropa</a> | <a href="${SITE_URL}/categoria/oversize">Oversize</a> | <a href="${SITE_URL}/categoria/complementos">Complementos</a> | <a href="${SITE_URL}/categoria/bolsos">Bolsos</a> | <a href="${SITE_URL}/categoria/calzado">Calzado</a> | <a href="${SITE_URL}/conocenos">Conócenos</a> | <a href="${SITE_URL}/envios">Envíos</a> | <a href="${SITE_URL}/devoluciones">Devoluciones</a></nav></header>`;
}

function buildProductLinksHtml(
  items: { slug?: string | null; product_id: string; name?: string | null; price?: number | null }[],
): string {
  if (items.length === 0) return '';
  const lis = items
    .filter((p) => {
      const n = (p.name || '').toLowerCase();
      return !n.includes('test') && !n.includes('prueba');
    })
    .map((p) => {
      const slug = (p.slug || '').trim() || p.product_id;
      const href = escapeAttr(absoluteUrl(`/producto/${slug}`));
      const label = escapeHtml(p.name || 'Producto');
      const priceText =
        p.price != null && Number.isFinite(Number(p.price))
          ? ` — ${Number(p.price).toFixed(2)} €`
          : '';
      return `<li><a href="${href}">${label}</a>${escapeHtml(priceText)}</li>`;
    })
    .join('');
  return lis ? `<section><h2>Artículos</h2><ul>${lis}</ul></section>` : '';
}

async function getProductMeta(slugOrId: string): Promise<SeoPageMeta | null> {
  const db = getDbClient();
  if (!db) return null;

  const select =
    'product_id, slug, name, description, details, price, is_published, is_sold_out, categories(name), product_images(image_url), product_variants(stock)';

  let product: {
    product_id: string;
    slug?: string | null;
    name?: string | null;
    description?: string | null;
    details?: string | null;
    price?: number | null;
    is_published?: boolean;
    is_sold_out?: boolean | null;
    categories?: { name?: string | null } | { name?: string | null }[] | null;
    product_images?: { image_url?: string }[] | null;
    product_variants?: { stock?: number | null }[] | null;
  } | null = null;

  const bySlug = await db
    .from('products')
    .select(select)
    .eq('slug', slugOrId)
    .eq('is_published', true)
    .maybeSingle();

  if (bySlug.data) {
    product = bySlug.data;
  } else if (isProductUuid(slugOrId)) {
    const byId = await db
      .from('products')
      .select(select)
      .eq('product_id', slugOrId)
      .eq('is_published', true)
      .maybeSingle();
    product = byId.data;
  }

  if (!product) return null;

  const name = (product.name || '').toLowerCase();
  if (name.includes('test') || name.includes('prueba')) return null;

  const images = (product.product_images as { image_url?: string }[] | null) ?? [];
  const firstImage = images[0]?.image_url;
  const ogImage = toSeoImageUrl(firstImage);

  const description = truncateDescription(
    product.description ||
      `${product.name}. Precio ${Number(product.price).toFixed(2)} €. Compra online en Modas Me lo Merezco.`,
  );

  const slug = (product.slug || '').trim() || product.product_id;
  const path = `/producto/${slug}`;
  const canonical = absoluteUrl(path);
  const productName = product.name || 'Producto';
  const price = Number(product.price);

  const variants = product.product_variants ?? [];
  const totalStock = variants.reduce((acc, v) => acc + Number(v.stock ?? 0), 0);
  const inStock =
    product.is_sold_out !== true && (variants.length === 0 || totalStock > 0);
  const availability = inStock
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const catObj = Array.isArray(product.categories)
    ? product.categories[0]
    : product.categories;
  const categoryName = (catObj?.name || 'Ropa').trim();
  const categorySlug = categoryName.toLowerCase();
  const categoryUrl = absoluteUrl(`/categoria/${categorySlug}`);

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: categoryName,
          item: categoryUrl,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: productName,
          item: canonical,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productName,
      description: description || `${productName}. Compra online en ${SITE_NAME}.`,
      image: firstImage ? toSeoImageUrl(firstImage) : undefined,
      sku: product.product_id,
      url: canonical,
      offers: {
        '@type': 'Offer',
        price: price.toFixed(2),
        priceCurrency: 'EUR',
        availability,
        url: canonical,
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: {
            '@type': 'MonetaryAmount',
            value: 5.5,
            currency: 'EUR',
          },
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'ES',
          },
          deliveryTime: {
            '@type': 'ShippingDeliveryTime',
            handlingTime: {
              '@type': 'QuantitativeValue',
              minValue: 0,
              maxValue: 1,
              unitCode: 'DAY',
            },
            transitTime: {
              '@type': 'QuantitativeValue',
              minValue: 1,
              maxValue: 2,
              unitCode: 'DAY',
            },
          },
        },
        hasMerchantReturnPolicy: {
          '@type': 'MerchantReturnPolicy',
          applicableCountry: 'ES',
          returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
          merchantReturnDays: 14,
          returnMethod: 'https://schema.org/ReturnByMail',
          returnFees: 'https://schema.org/ReturnShippingFees',
        },
      },
      brand: {
        '@type': 'Brand',
        name: SITE_NAME,
      },
    },
  ];

  const redirectTo =
    isProductUuid(slugOrId) && slug !== slugOrId ? path : undefined;

  const fullDesc = escapeHtml((product.description || description).trim());
  const detailsBlock = product.details?.trim()
    ? `<p>${escapeHtml(product.details.trim())}</p>`
    : '';
  const bodyHtml = `${buildSiteNavHtml()}<main><nav aria-label="Breadcrumb"><a href="${SITE_URL}/">Inicio</a> &gt; <a href="${escapeAttr(categoryUrl)}">${escapeHtml(categoryName)}</a> &gt; <span>${escapeHtml(productName)}</span></nav><article><h1>${escapeHtml(productName)}</h1><img src="${escapeAttr(ogImage)}" alt="${escapeAttr(productName)}" /><p>${fullDesc}</p>${detailsBlock}<p><strong>Precio:</strong> ${price.toFixed(2)} € (${inStock ? 'Disponible' : 'Agotado'})</p></article></main>`;

  return {
    title: buildTitle(product.name || undefined),
    description,
    canonical,
    ogImage,
    noindex: false,
    type: 'product',
    jsonLd,
    redirectTo,
    bodyHtml,
  };
}

async function getCategoryMeta(slug: string): Promise<SeoPageMeta | null> {
  const path = `/categoria/${slug}`;
  const page = STATIC_PAGES[path];
  if (!page) return null;

  const canonical = absoluteUrl(path);
  const categoryTitle = page.title || slug;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: categoryTitle,
        item: canonical,
      },
    ],
  };

  let productsHtml = '';
  const db = getDbClient();
  if (db) {
    try {
      const { data: cat } = await db
        .from('categories')
        .select('id')
        .ilike('name', slug)
        .maybeSingle();

      if (cat?.id) {
        const { data: items } = await db
          .from('products')
          .select('product_id, slug, name, price')
          .eq('is_published', true)
          .eq('category_id', cat.id)
          .order('created_at', { ascending: false })
          .limit(60);
        productsHtml = buildProductLinksHtml(items ?? []);
      }
    } catch {
      // Fallback sin listado si falla la consulta
    }
  }

  const bodyHtml = `${buildSiteNavHtml()}<main><h1>${escapeHtml(categoryTitle)}</h1><p>${escapeHtml(page.description)}</p>${productsHtml}</main>`;

  return {
    title: buildTitle(page.title),
    description: page.description,
    canonical,
    ogImage: DEFAULT_OG_IMAGE,
    noindex: false,
    type: 'website',
    jsonLd,
    bodyHtml,
  };
}

/** Resuelve meta SEO para una ruta pública de la tienda (usado por middleware). */
export async function getSeoMetaForPath(pathname: string): Promise<SeoPageMeta | null> {
  const path = pathname.split('?')[0] || '/';

  if (NOINDEX_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) {
    return {
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      canonical: absoluteUrl(path),
      ogImage: DEFAULT_OG_IMAGE,
      noindex: true,
      type: 'website',
    };
  }

  const productMatch = path.match(/^\/producto\/([^/]+)$/);
  if (productMatch) {
    return getProductMeta(productMatch[1]);
  }

  const categoryMatch = path.match(/^\/categoria\/([^/]+)$/);
  if (categoryMatch) {
    return getCategoryMeta(categoryMatch[1]);
  }

  const staticPage = STATIC_PAGES[path];
  if (staticPage) {
    const canonical = absoluteUrl(path);
    let jsonLd: SeoPageMeta['jsonLd'];
    let productsHtml = '';

    if (path === '/') {
      jsonLd = [
        {
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: SITE_NAME,
          alternateName: 'Me lo Merezco',
          url: SITE_URL,
        },
        {
          '@context': 'https://schema.org',
          '@type': 'ClothingStore',
          name: SITE_NAME,
          url: SITE_URL,
          logo: `${SITE_URL}/logo.png`,
          image: DEFAULT_OG_IMAGE,
          description: staticPage.description,
          priceRange: '€€',
          telephone: '+34 685 011 494',
          email: 'info@modasmelomerezco.es',
          sameAs: [
            'https://www.instagram.com/modasmelomerezco',
            'https://www.tiktok.com/@modasmelomerezco',
            'https://www.facebook.com/profile.php?id=61555721379464',
          ],
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'Calle Sol, 5',
            addressLocality: 'Benalmádena',
            addressRegion: 'Málaga',
            postalCode: '29631',
            addressCountry: 'ES',
          },
          geo: {
            '@type': 'GeoCoordinates',
            latitude: 36.5961,
            longitude: -4.5708,
          },
        },
      ];

      const db = getDbClient();
      if (db) {
        try {
          const { data: items } = await db
            .from('products')
            .select('product_id, slug, name, price')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(40);
          productsHtml = buildProductLinksHtml(items ?? []);
        } catch {
          // Fallback sin listado
        }
      }
    }

    const heading = staticPage.title || `${SITE_NAME} — Tienda online de moda para mujer`;
    const bodyHtml = `${buildSiteNavHtml()}<main><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(staticPage.description)}</p>${productsHtml}</main>`;

    return {
      title: buildTitle(staticPage.title),
      description: staticPage.description,
      canonical,
      ogImage: DEFAULT_OG_IMAGE,
      noindex: false,
      type: 'website',
      jsonLd,
      bodyHtml,
    };
  }

  return null;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}
