export type OfferType = 'percent' | 'fixed';

export type OfferFields = {
  is_on_offer?: boolean;
  offer_type?: OfferType | string | null;
  offer_value?: number | null;
  /** @deprecated legacy; prefer offer_value */
  offer_percent?: number | null;
};

function resolveOfferValue(product: OfferFields): number {
  const value = Number(product.offer_value);
  if (Number.isFinite(value) && value > 0) return value;
  const legacy = Number(product.offer_percent);
  if (Number.isFinite(legacy) && legacy > 0) return legacy;
  return 0;
}

export function resolveOfferType(product: OfferFields): OfferType {
  return product.offer_type === 'fixed' ? 'fixed' : 'percent';
}

/** Precio tachado (compare-at) = precio real + % o + €. Solo visual. */
export function getCompareAtPrice(
  price: number,
  offerValue: number,
  offerType: OfferType = 'percent'
): number {
  if (!Number.isFinite(price) || !Number.isFinite(offerValue) || offerValue <= 0) {
    return price;
  }
  const compareAt =
    offerType === 'fixed' ? price + offerValue : price * (1 + offerValue / 100);
  return Math.round(compareAt * 100) / 100;
}

export function getProductCompareAtPrice(product: OfferFields & { price: number }): number | null {
  if (!hasActiveOffer(product)) return null;
  return getCompareAtPrice(
    product.price,
    resolveOfferValue(product),
    resolveOfferType(product)
  );
}

export function hasActiveOffer(product: OfferFields): boolean {
  return product.is_on_offer === true && resolveOfferValue(product) > 0;
}

export function formatEur(amount: number): string {
  return amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
}
