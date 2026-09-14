import React from 'react';
import { formatEur, getCompareAtPrice } from '@/lib/productOffer';

interface ProductOfferProps {
  isOnOffer: boolean;
  offerPercent: number;
  price: number;
  onOfferChange: (value: boolean) => void;
  onPercentChange: (value: number) => void;
}

export const ProductOffer: React.FC<ProductOfferProps> = ({
  isOnOffer,
  offerPercent,
  price,
  onOfferChange,
  onPercentChange,
}) => {
  const compareAt = getCompareAtPrice(price || 0, offerPercent || 0);
  const showPreview = isOnOffer && offerPercent > 0 && (price || 0) >= 0;

  return (
    <div className="space-y-8 border-t border-(--border-main) pt-12">
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary block">
          Oferta
        </label>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
          Activa un precio tachado en tienda sumando un porcentaje al precio real. El cliente
          paga el precio real.
        </p>
      </div>

      <div className="flex flex-col gap-6 max-w-xl">
        <div className="flex items-center gap-4">
          <input
            type="checkbox"
            id="is_on_offer"
            className="accent-primary w-5 h-5 rounded-md"
            checked={!!isOnOffer}
            onChange={(e) => onOfferChange(e.target.checked)}
          />
          <label
            htmlFor="is_on_offer"
            className="text-[10px] font-black uppercase tracking-[0.4em] cursor-pointer text-(--text-main)"
          >
            Activar oferta
          </label>
        </div>

        {isOnOffer && (
          <div className="space-y-3">
            <label
              htmlFor="offer_percent"
              className="text-[8px] font-black uppercase tracking-widest text-gray-500 block"
            >
              Porcentaje sobre el precio
            </label>
            <div className="flex items-center gap-3">
              <input
                id="offer_percent"
                type="number"
                min={1}
                max={99}
                step={1}
                inputMode="numeric"
                className="w-28 bg-(--bg-card) border border-(--border-main) px-4 py-3 text-xs font-bold focus:border-primary outline-none rounded-xl"
                value={offerPercent || ''}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === '') {
                    onPercentChange(0);
                    return;
                  }
                  const n = Math.min(99, Math.max(0, Number(raw)));
                  onPercentChange(Number.isFinite(n) ? n : 0);
                }}
                placeholder="20"
              />
              <span className="text-xs font-bold text-(--text-main)">%</span>
            </div>

            {showPreview && (
              <p className="text-sm text-(--text-main) flex items-baseline gap-3 pt-1">
                <span className="text-gray-400 line-through italic">{formatEur(compareAt)}</span>
                <span className="font-black italic">{formatEur(price || 0)}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
