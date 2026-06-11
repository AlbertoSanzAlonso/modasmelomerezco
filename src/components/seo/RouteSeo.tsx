import { useLocation } from 'react-router-dom';
import { SeoHelmet } from './SeoHelmet';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  SITE_LOGO,
  SITE_NAME,
  SITE_URL,
} from '@/lib/seo/constants';

const STATIC_PAGES: Record<
  string,
  { title?: string; description: string }
> = {
  '/': {
    description: DEFAULT_DESCRIPTION,
  },
  '/categoria/ropa': {
    title: 'Ropa de mujer',
    description:
      'Colección de ropa de mujer: vestidos, blusas, pantalones y más. Moda actual con envío gratuito desde 50 € en Modas Me lo Merezco.',
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
];

const HOME_JSON_LD = [
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
    logo: SITE_LOGO,
    image: DEFAULT_OG_IMAGE,
    description: DEFAULT_DESCRIPTION,
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
      streetAddress: 'Calle Aragón, 2, Local 2',
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

/** SEO por ruta para páginas estáticas de la tienda (producto y categoría lo gestionan sus páginas). */
export function RouteSeo() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/producto/') || pathname.startsWith('/categoria/')) {
    return null;
  }

  const noindex = NOINDEX_PATHS.some((p) => pathname.startsWith(p));
  const page = STATIC_PAGES[pathname];

  return (
    <SeoHelmet
      path={pathname}
      title={page?.title}
      description={page?.description}
      noindex={noindex}
      jsonLd={pathname === '/' ? HOME_JSON_LD : undefined}
    />
  );
}
