
import React from 'react';
import type { Category, Subcategory } from "@/types/index";

interface ProductCategoriesProps {
  categoryId?: number;
  subcategoryId?: number;
  categoriesList: Category[];
  subcategoriesList: Subcategory[];
  totalStock: number;
  onCategoryChange: (id: number | undefined) => void;
  onSubcategoryChange: (id: number | undefined) => void;
}

export const ProductCategories: React.FC<ProductCategoriesProps> = ({
  categoryId,
  subcategoryId,
  categoriesList,
  subcategoriesList,
  totalStock,
  onCategoryChange,
  onSubcategoryChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
      <div className="space-y-6">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Categoría Maestra</label>
        <select 
          className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] px-6 py-4 text-sm font-bold focus:border-primary outline-none appearance-none text-[var(--text-main)] rounded-xl"
          value={categoryId || ''}
          onChange={(e) => onCategoryChange(e.target.value ? parseInt(e.target.value) : undefined)}
        >
          <option value="" disabled>SELECCIONAR...</option>
          {categoriesList.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name.toUpperCase()}</option>
          ))}
        </select>
      </div>
      <div className="space-y-6">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Subcategoría</label>
        <select 
          className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] px-6 py-4 text-sm font-bold focus:border-primary outline-none appearance-none text-[var(--text-main)] rounded-xl"
          value={subcategoryId || ''}
          onChange={(e) => onSubcategoryChange(e.target.value ? parseInt(e.target.value) : undefined)}
        >
          <option value="">NINGUNA / OTRA</option>
          {subcategoriesList.map(sub => (
            <option key={sub.id} value={sub.id}>{sub.name.toUpperCase()}</option>
          ))}
        </select>
      </div>
      <div className="space-y-6">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Stock Total</label>
        <div className="w-full bg-[var(--bg-card)] border border-[var(--border-main)] px-6 py-4 text-sm font-black text-primary rounded-xl flex items-center">
          {totalStock} UNI
        </div>
      </div>
    </div>
  );
};
