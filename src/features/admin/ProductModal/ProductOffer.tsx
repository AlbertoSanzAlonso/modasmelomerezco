import React from 'react';
import type { OfferType } from '@/lib/productOffer';
import { formatEur, getCompareAtPrice } from '@/lib/productOffer';

interface ProductOfferProps {
  isOnOffer: boolean;
  offerType: OfferType;
  offerValue: number;
  price: number;
  onOfferChange: (value: boolean) => void;
  onTypeChange: (value: OfferType) => void;
  onValueChange: (value: number) => void;
}

export const ProductOffer: React.FC<ProductOfferProps> = ({
  isOnOffer,
  offerType,
  offerValue,
  price,
  onOfferChange,
  onTypeChange,
  onValueChange,
}) => {
  const compareAt = getCompareAtPrice(price || 0, offerValue || 0, offerType);
  const showPreview = isOnOffer && offerValue > 0 && (price || 0) >= 0;

  return (
    <div className="space-y-8 border-t border-(--border-main) pt-12">
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary block">
          Rebaja
        </label>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
          Activa un precio tachado en tienda sumando un porcentaje o una cantidad en euros al
          precio real. El cliente paga el precio real.
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
            Activar rebaja
          </label>
        </div>

        {isOnOffer && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onTypeChange('percent')}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                  offerType === 'percent'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-(--bg-card) text-(--text-main) border-(--border-main) hover:border-primary/50'
                }`}
              >
                Porcentaje
              </button>
              <button
                type="button"
                onClick={() => onTypeChange('fixed')}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all ${
                  offerType === 'fixed'
                    ? 'bg-primary text-white border-primary'
                    : 'bg-(--bg-card) text-(--text-main) border-(--border-main) hover:border-primary/50'
                }`}
              >
                Euros
              </button>
            </div>

            <div className="space-y-3">
              <label
                htmlFor="offer_value"
                className="text-[8px] font-black uppercase tracking-widest text-gray-500 block"
              >
                {offerType === 'percent'
                  ? 'Porcentaje a sumar (puede ser más de 100%)'
                  : 'Euros a sumar al precio'}
              </label>
              <div className="flex items-center gap-3">
                <input
                  id="offer_value"
                  type="number"
                  min={0}
                  step={offerType === 'fixed' ? 0.01 : 1}
                  inputMode="decimal"
                  className="w-32 bg-(--bg-card) border border-(--border-main) px-4 py-3 text-xs font-bold focus:border-primary outline-none rounded-xl"
                  value={offerValue || ''}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === '') {
                      onValueChange(0);
                      return;
                    }
                    const n = Math.max(0, Number(raw));
                    onValueChange(Number.isFinite(n) ? n : 0);
                  }}
                  placeholder={offerType === 'percent' ? '20' : '10'}
                />
                <span className="text-xs font-bold text-(--text-main)">
                  {offerType === 'percent' ? '%' : '€'}
                </span>
              </div>
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
