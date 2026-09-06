import { getSeoMetaForPath } from './api/_seoMeta.js';
import { injectSeoIntoHtml } from './api/_injectSeoHtml.js';

const CRAWLER_UA =
  /googlebot|google-inspectiontool|bingbot|applebot|facebookexternalhit|twitterbot|linkedinbot|slackbot|whatsapp|telegrambot|discordbot|pinterest|yandex|baiduspider|ahrefsbot|semrushbot|mj12bot|dotbot|rogerbot|screaming\s*frog|sitebulb/i;

const INDEXABLE_PREFIXES = [
  '/producto/',
  '/categoria/',
  '/conocenos',
  '/envios',
  '/devoluciones',
  '/condiciones-venta',
  '/aviso-legal',
  '/politica-de-privacidad',
  '/cookies',
];

function shouldHandlePath(pathname: string): boolean {
  if (pathname === '/') return true;
  return INDEXABLE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

export default async function middleware(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (!shouldHandlePath(pathname)) {
    return;
  }

  const userAgent = request.headers.get('user-agent') || '';
  if (!CRAWLER_UA.test(userAgent)) {
    return;
  }

  const meta = await getSeoMetaForPath(pathname);

  if (!meta) {
    if (pathname.startsWith('/producto/')) {
      return new Response('Producto no encontrado', {
        status: 404,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    return;
  }

  const indexResponse = await fetch(new URL('/index.html', request.url), {
    headers: { Accept: 'text/html' },
  });

  if (!indexResponse.ok) {
    return;
  }

  const html = injectSeoIntoHtml(await indexResponse.text(), meta);

  return new Response(html, {
    status: meta.noindex ? 200 : indexResponse.status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

export const config = {
  matcher: [
    '/',
    '/producto/:path*',
    '/categoria/:path*',
    '/conocenos',
    '/envios',
    '/devoluciones',
    '/condiciones-venta',
    '/aviso-legal',
    '/politica-de-privacidad',
    '/cookies',
  ],
};
