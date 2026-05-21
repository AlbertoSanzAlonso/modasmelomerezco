import React from 'react';
import type { Category, Subcategory } from '@/types';

interface DiscountSubcategoryPickerProps {
  categories: Category[];
  subcategories: Subcategory[];
  selectedIds: number[];
  onChange: (ids: number[]) => void;
}

export const DiscountSubcategoryPicker: React.FC<DiscountSubcategoryPickerProps> = ({
  categories,
  subcategories,
  selectedIds,
  onChange,
}) => {
  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const toggleCategory = (categoryId: number) => {
    const idsInCat = subcategories.filter((s) => s.category_id === categoryId).map((s) => s.id);
    const allSelected = idsInCat.every((id) => selectedIds.includes(id));
    if (allSelected) {
      onChange(selectedIds.filter((id) => !idsInCat.includes(id)));
    } else {
      onChange([...new Set([...selectedIds, ...idsInCat])]);
    }
  };

  if (subcategories.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic">
        No hay subcategorías definidas. Créalas al editar productos o en categorías.
      </p>
    );
  }

  return (
    <div className="space-y-4 max-h-64 overflow-y-auto border border-(--border-main) rounded-xl p-4 bg-(--bg-main)">
      {categories.map((cat) => {
        const subs = subcategories.filter((s) => s.category_id === cat.id);
        if (subs.length === 0) return null;
        const idsInCat = subs.map((s) => s.id);
        const allSelected = idsInCat.every((id) => selectedIds.includes(id));
        const someSelected = idsInCat.some((id) => selectedIds.includes(id));

        return (
          <div key={cat.id} className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected;
                }}
                onChange={() => toggleCategory(cat.id)}
                className="w-4 h-4 accent-primary shrink-0"
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                {cat.name}
              </span>
            </label>
            <div className="pl-6 flex flex-wrap gap-2">
              {subs.map((sub) => {
                const isSelected = selectedIds.includes(sub.id);
                return (
                  <label
                    key={sub.id}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer border text-[10px] font-bold uppercase tracking-wide transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'border-(--border-main) text-gray-500 hover:border-primary/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggle(sub.id)}
                      className="w-3.5 h-3.5 accent-primary shrink-0"
                    />
                    {sub.name}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
