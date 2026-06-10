import type { SeoPageMeta } from './_seoMeta.js';
import { escapeAttr } from './_seoMeta.js';

const SITE_NAME = 'Modas Me lo Merezco';

function replaceMetaTag(html: string, name: string, content: string): string {
  const pattern = new RegExp(
    `<meta\\s+name="${name}"\\s+content="[^"]*"\\s*/?>`,
    'i',
  );
  const tag = `<meta name="${name}" content="${escapeAttr(content)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function replacePropertyMeta(html: string, property: string, content: string): string {
  const pattern = new RegExp(
    `<meta\\s+property="${property}"\\s+content="[^"]*"\\s*/?>`,
    'i',
  );
  const tag = `<meta property="${property}" content="${escapeAttr(content)}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

/** Inyecta title, description, canonical y Open Graph en el HTML estático de index.html. */
export function injectSeoIntoHtml(html: string, meta: SeoPageMeta): string {
  let result = html;

  result = result.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escapeAttr(meta.title)}</title>`,
  );

  result = replaceMetaTag(result, 'description', meta.description);
  result = replaceMetaTag(
    result,
    'robots',
    meta.noindex ? 'noindex, nofollow' : 'index, follow',
  );

  const canonicalPattern =
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i;
  const canonicalTag = `<link rel="canonical" href="${escapeAttr(meta.canonical)}" />`;
  if (canonicalPattern.test(result)) {
    result = result.replace(canonicalPattern, canonicalTag);
  } else {
    result = result.replace('</head>', `    ${canonicalTag}\n  </head>`);
  }

  result = replacePropertyMeta(result, 'og:type', meta.type);
  result = replacePropertyMeta(result, 'og:site_name', SITE_NAME);
  result = replacePropertyMeta(result, 'og:locale', 'es_ES');
  result = replacePropertyMeta(result, 'og:url', meta.canonical);
  result = replacePropertyMeta(result, 'og:title', meta.title);
  result = replacePropertyMeta(result, 'og:description', meta.description);
  result = replacePropertyMeta(result, 'og:image', meta.ogImage);
  result = replacePropertyMeta(result, 'og:image:secure_url', meta.ogImage);
  result = replacePropertyMeta(result, 'og:image:alt', SITE_NAME);

  result = replaceMetaTag(result, 'twitter:card', 'summary_large_image');
  result = replaceMetaTag(result, 'twitter:title', meta.title);
  result = replaceMetaTag(result, 'twitter:description', meta.description);
  result = replaceMetaTag(result, 'twitter:image', meta.ogImage);

  if (meta.jsonLd) {
    const jsonLdArray = Array.isArray(meta.jsonLd) ? meta.jsonLd : [meta.jsonLd];
    const scriptTag = `<script type="application/ld+json">${JSON.stringify(jsonLdArray.length === 1 ? jsonLdArray[0] : jsonLdArray)}</script>`;
    result = result.replace('</head>', `    ${scriptTag}\n  </head>`);
  }

  return result;
}
