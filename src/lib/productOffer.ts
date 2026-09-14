/** Precio tachado (compare-at) = precio real + porcentaje. Solo visual. */
export function getCompareAtPrice(price: number, offerPercent: number): number {
  if (!Number.isFinite(price) || !Number.isFinite(offerPercent) || offerPercent <= 0) {
    return price;
  }
  return Math.round(price * (1 + offerPercent / 100) * 100) / 100;
}

export function hasActiveOffer(product: {
  is_on_offer?: boolean;
  offer_percent?: number;
}): boolean {
  return product.is_on_offer === true && (product.offer_percent ?? 0) > 0;
}

export function formatEur(amount: number): string {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}
