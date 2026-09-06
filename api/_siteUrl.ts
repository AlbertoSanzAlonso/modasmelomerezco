/// <reference types="node" />

/** URL canónica del sitio (www). El apex sin www aún apunta al WordPress antiguo. */
export function getCanonicalSiteUrl(): string {
  const raw = (
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL ||
    'https://www.modasmelomerezco.es'
  ).replace(/\/$/, '');

  if (raw === 'https://modasmelomerezco.es' || raw === 'http://modasmelomerezco.es') {
    return 'https://www.modasmelomerezco.es';
  }

  return raw;
}
