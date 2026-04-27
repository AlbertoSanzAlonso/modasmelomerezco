 
import React from 'react';
import { Plus, Eye, EyeOff, Edit, Trash2, Search } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types";

import { PRODUCT_PLACEHOLDER } from '@/lib/constants';

interface ProductsTabProps {
  products?: Product[];
  selectedIds: string[];
  productPage: number;
  pageSize: number;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onPageChange: (page: number) => void;
  onToggleSelectAll: () => void;
  onToggleSelect: (id: string) => void;
  onBulkStatusChange: (is_published: boolean) => void;
  onBulkDelete: () => void;
  onTogglePublish: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onCreate: () => void;
}

const calculateStock = (product: Product) => {
  if (!product.variants || product.variants.length === 0) return product.stock || 0;
  return product.variants.reduce((acc, v) => acc + (v.stock || 0), 0);
};

export const ProductsTab: React.FC<ProductsTabProps> = ({
  products,
  selectedIds,
  productPage,
  pageSize,
  searchTerm,
  onSearchChange,
  onPageChange,
  onToggleSelectAll,
  onToggleSelect,
  onBulkStatusChange,
  onBulkDelete,
  onTogglePublish,
  onEdit,
  onDelete,
  onCreate
}) => {
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Gestión de Productos</h2>
          <p className="text-gray-500 text-sm">Añade, edita o elimina artículos de la tienda.</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full md:w-64 pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 bg-white"
            />
          </div>
          <Button size="sm" className="font-black tracking-widest text-[10px] px-8" onClick={onCreate}>
            <Plus className="w-4 h-4 mr-2" /> NUEVO PRODUCTO
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-primary text-white p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-black text-xs">
              {selectedIds.length}
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest">Elementos seleccionados</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button onClick={() => onBulkStatusChange(true)} className="flex-1 sm:flex-none px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Publicar</button>
            <button onClick={() => onBulkStatusChange(false)} className="flex-1 sm:flex-none px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Ocultar</button>
            <button onClick={onBulkDelete} className="flex-1 sm:flex-none px-6 py-2.5 bg-red-500 hover:bg-red-600 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg">Eliminar</button>
            <button onClick={() => onToggleSelectAll()} className="px-4 py-2.5 text-white/60 hover:text-white transition-colors">
              <Plus className="w-4 h-4 rotate-45" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop View */}
      <div className="hidden md:block bg-(--bg-card) border border-(--border-main) overflow-hidden rounded-[2.5rem] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-(--border-main) bg-(--bg-main)/50">
                <th className="px-8 py-6 w-10">
                  <input 
                    type="checkbox" 
                    className="accent-primary w-4 h-4 rounded"
                    checked={products?.length ? selectedIds.length === products.length : false}
                    onChange={onToggleSelectAll}
                  />
                </th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Producto</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Categoría</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Precio</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Stock</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Estado</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-main)">
              {products?.map((product) => (
                <tr 
                  key={product.product_id} 
                  onClick={() => onToggleSelect(product.product_id)}
                  className={`hover:bg-primary/5 transition-colors group cursor-pointer ${selectedIds.includes(product.product_id) ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-8 py-6">
                    <input 
                      type="checkbox" 
                      className="accent-primary w-4 h-4 rounded cursor-pointer"
                      checked={selectedIds.includes(product.product_id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        onToggleSelect(product.product_id);
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-12 h-16 bg-black overflow-hidden border border-(--border-main) rounded-xl shadow-sm cursor-pointer hover:scale-105 transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(product);
                        }}
                      >
                        <img src={product.images?.[0] || PRODUCT_PLACEHOLDER} alt="" className="w-full h-full object-cover transition-all" />
                      </div>
                      <p className="text-sm font-bold uppercase italic text-(--text-main)">{product.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-xs text-gray-500 uppercase tracking-widest font-bold">
                    {product.category} {product.subcategory && `• ${product.subcategory}`}
                  </td>
                  <td className="px-8 py-6 text-sm font-black italic text-(--text-main)">{product.price.toFixed(2)}€</td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black uppercase px-3 py-1 border rounded-lg ${calculateStock(product) < 10 ? 'border-red-500 bg-red-500/5 text-red-500' : 'border-green-500/30 bg-green-500/5 text-green-500'}`}>
                      {calculateStock(product)} UNI
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePublish(product);
                      }}
                      className="transition-transform active:scale-95"
                    >
                      {product.is_published ? (
                        <span className="text-[9px] font-black uppercase px-3 py-1 bg-green-500/10 text-green-600 border border-green-500/20 rounded-full cursor-pointer hover:bg-green-500/20">Publicado</span>
                      ) : (
                        <span className="text-[9px] font-black uppercase px-3 py-1 bg-gray-100 text-gray-400 border border-gray-200 rounded-full cursor-pointer hover:bg-gray-200">Borrador</span>
                      )}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        className="p-3 text-gray-400 hover:text-primary transition-colors bg-transparent rounded-full hover:bg-primary/10"
                        title="Ver en la web"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/producto/${product.product_id}`, '_blank');
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-3 text-gray-400 hover:text-primary transition-colors bg-transparent rounded-full hover:bg-primary/10"
                        title="Editar"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(product);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-3 text-gray-400 hover:text-red-500 transition-colors bg-transparent rounded-full hover:bg-red-500/10"
                        title="Eliminar"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(product);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center items-center gap-4 mt-10 pb-10">
          <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, productPage - 1))} disabled={productPage === 1} className="text-[10px] font-black uppercase tracking-widest px-6">Anterior</Button>
          <span className="text-[10px] font-black text-primary bg-primary/10 px-4 py-2 rounded-lg">PÁGINA {productPage}</span>
          <Button variant="outline" size="sm" onClick={() => onPageChange(productPage + 1)} disabled={!products || products.length < pageSize} className="text-[10px] font-black uppercase tracking-widest px-6">Siguiente</Button>
        </div>
      </div>
      
      {/* Mobile view can be added here similarly or in a separate component */}
    </div>
  );
};
