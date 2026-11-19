/** Detecta ID de producto en URLs antiguas (/producto/{uuid} o /producto/{id-numerico}). */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NUMERIC_ID_RE = /^\d+$/;

export function isProductUuid(value: string): boolean {
  const trimmed = value.trim();
  return UUID_RE.test(trimmed) || NUMERIC_ID_RE.test(trimmed);
}
