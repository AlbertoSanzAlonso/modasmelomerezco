import React, { useState } from 'react';
import { Tag, Loader2, X } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/Button';

interface CartDiscountFieldProps {
  compact?: boolean;
}

export const CartDiscountField: React.FC<CartDiscountFieldProps> = ({ compact = false }) => {
  const {
    appliedDiscount,
    discountError,
    discountAmount,
    isApplyingDiscount,
    applyDiscountCode,
    clearDiscount,
  } = useCartStore();
  const [input, setInput] = useState(appliedDiscount?.code ?? '');

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    await applyDiscountCode(input);
  };

  const handleClear = () => {
    setInput('');
    clearDiscount();
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      <form onSubmit={handleApply} className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-secondary/30" />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Código de descuento"
            disabled={isApplyingDiscount}
            className={`w-full pl-9 pr-3 border border-secondary/10 rounded-md bg-accent text-secondary placeholder:text-secondary/30 focus:outline-none focus:ring-1 focus:ring-primary/40 ${
              compact ? 'py-2 text-xs' : 'py-2.5 text-sm'
            }`}
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={isApplyingDiscount || !input.trim()}
          className="shrink-0 uppercase tracking-widest text-[10px] font-bold"
        >
          {isApplyingDiscount ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Aplicar'
          )}
        </Button>
      </form>

      {discountError && (
        <p className="text-[11px] text-red-500 font-medium">{discountError}</p>
      )}

      {appliedDiscount && !discountError && discountAmount > 0 && (
        <div className="flex items-center justify-between gap-2 text-[11px] text-primary font-medium">
          <span>
            Código <span className="uppercase tracking-wide">{appliedDiscount.code}</span> aplicado
            (−{discountAmount.toFixed(2)}€)
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="p-1 text-secondary/40 hover:text-secondary transition-colors"
            aria-label="Quitar descuento"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
