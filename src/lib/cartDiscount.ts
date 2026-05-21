import type { AppliedDiscount, CartItem } from '@/types';

export function calculateLineDiscount(
  lineTotal: number,
  quantity: number,
  discount: Pick<AppliedDiscount, 'discount_type' | 'discount_value'>
): number {
  if (discount.discount_type === 'percent') {
    const pct = Math.min(100, Math.max(0, discount.discount_value));
    return lineTotal * (pct / 100);
  }
  return Math.min(discount.discount_value * quantity, lineTotal);
}

export function calculateCartTotals(
  items: CartItem[],
  appliedDiscount: AppliedDiscount | null
): { subtotal: number; discountAmount: number; total: number } {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!appliedDiscount) {
    return { subtotal, discountAmount: 0, total: subtotal };
  }

  const eligible = new Set(appliedDiscount.eligible_product_ids);
  let discountAmount = 0;
  for (const item of items) {
    if (!eligible.has(item.product_id)) continue;
    const lineTotal = item.price * item.quantity;
    discountAmount += calculateLineDiscount(lineTotal, item.quantity, appliedDiscount);
  }

  discountAmount = Math.round(discountAmount * 100) / 100;
  const total = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);
  return { subtotal, discountAmount, total };
}

export function getDiscountedLineTotal(
  item: CartItem,
  appliedDiscount: AppliedDiscount | null
): { original: number; discounted: number; hasDiscount: boolean } {
  const original = item.price * item.quantity;
  if (
    !appliedDiscount ||
    !appliedDiscount.eligible_product_ids.includes(item.product_id)
  ) {
    return { original, discounted: original, hasDiscount: false };
  }
  const off = calculateLineDiscount(original, item.quantity, appliedDiscount);
  return {
    original,
    discounted: Math.max(0, Math.round((original - off) * 100) / 100),
    hasDiscount: off > 0,
  };
}
