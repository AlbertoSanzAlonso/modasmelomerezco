 
import React from 'react';
import { Plus, Eye, EyeOff, Edit, Trash2, Search } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types";

import { PRODUCT_PLACEHOLDER } from '@/lib/constants';

interface ProductsTabProps {
  products?: Product[];
  totalProducts: number;
  selectedIds: string[];
  productPage: number;
  pageSize: number;
  searchTerm: string;
  statusFilter?: boolean;
  isNewFilter?: boolean;
  onSearchChange: (term: string) => void;
  onPageChange: (page: number) => void;
  onStatusFilterChange: (status: boolean | undefined) => void;
  onIsNewFilterChange: (isNew: boolean | undefined) => void;
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
  totalProducts,
  selectedIds,
  productPage,
  pageSize,
  searchTerm,
  statusFilter,
  isNewFilter,
  onSearchChange,
  onPageChange,
  onStatusFilterChange,
  onIsNewFilterChange,
  onToggleSelectAll,
  onToggleSelect,
  onBulkStatusChange,
  onBulkDelete,
  onTogglePublish,
  onEdit,
  onDelete,
  onCreate
}) => {
  const totalPages = Math.ceil(totalProducts / pageSize);

  const getPageRange = () => {
    const range: number[] = [];
    const start = Math.max(1, productPage - 1);
    const end = Math.min(totalPages, start + 2);
    const finalStart = Math.max(1, end - 2);
    for (let i = finalStart; i <= end; i++) {
      range.push(i);
    }
    return range;
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Gestión de Productos</h2>
          <p className="text-gray-500 text-sm">Añade, edita o elimina artículos de la tienda. ({totalProducts} productos)</p>
        </div>
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3 w-full xl:w-auto">
          {/* Filters */}
          <select 
            value={statusFilter === undefined ? '' : statusFilter.toString()}
            onChange={(e) => onStatusFilterChange(e.target.value === '' ? undefined : e.target.value === 'true')}
            className="px-3 py-2.5 text-[9px] sm:text-xs font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white cursor-pointer"
          >
            <option value="">Todos los Estados</option>
            <option value="true">Publicados</option>
            <option value="false">Borradores</option>
          </select>

          <select 
            value={isNewFilter === undefined ? '' : isNewFilter.toString()}
            onChange={(e) => onIsNewFilterChange(e.target.value === '' ? undefined : e.target.value === 'true')}
            className="px-3 py-2.5 text-[9px] sm:text-xs font-black uppercase tracking-widest border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white cursor-pointer"
          >
            <option value="">Todas las Fechas</option>
            <option value="true">Solo Novedades</option>
            <option value="false">No Novedades</option>
          </select>

          <div className="relative col-span-2 md:flex-1 md:flex-none md:min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por título..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-primary bg-white shadow-sm transition-all"
            />
          </div>
          <Button size="sm" className="col-span-2 md:col-auto font-black tracking-widest text-[10px] px-8 py-3 h-auto" onClick={onCreate}>
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
                    <div className="flex items-center gap-2">
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
                      {product.is_new && (
                        <span className="text-[9px] font-black uppercase px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full">Novedad</span>
                      )}
                    </div>
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
        
        {/* Advanced Pagination Desktop */}
        <div className="flex justify-center items-center gap-2 mt-10 pb-10">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange(1)} 
            disabled={productPage === 1}
            className="w-10 h-10 p-0 rounded-xl"
          >
            «
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange(Math.max(1, productPage - 1))} 
            disabled={productPage === 1}
            className="px-4 h-10 rounded-xl text-[9px] font-black uppercase"
          >
            Ant.
          </Button>
          
          <div className="flex gap-2 mx-4">
            {getPageRange().map(p => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${productPage === p ? 'bg-primary text-white shadow-lg scale-110' : 'bg-white border border-gray-200 text-gray-400 hover:border-primary/30'}`}
              >
                {p}
              </button>
            ))}
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange(Math.min(totalPages, productPage + 1))} 
            disabled={productPage >= totalPages}
            className="px-4 h-10 rounded-xl text-[9px] font-black uppercase"
          >
            Sig.
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onPageChange(totalPages)} 
            disabled={productPage >= totalPages}
            className="w-10 h-10 p-0 rounded-xl"
          >
            »
          </Button>
        </div>
      </div>
      
      {/* Mobile View */}
      <div className="md:hidden space-y-6">
        {products?.map((product) => (
          <div 
            key={product.product_id}
            className="bg-(--bg-card) border border-(--border-main) rounded-[2rem] p-5 shadow-sm flex gap-4 relative overflow-hidden"
            onClick={() => onEdit(product)}
          >
             <div className="w-20 h-28 bg-black overflow-hidden border border-(--border-main) rounded-xl flex-shrink-0">
               <img src={product.images?.[0] || PRODUCT_PLACEHOLDER} alt="" className="w-full h-full object-cover" />
             </div>
             <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
               <div>
                 <div className="flex justify-between items-start gap-2">
                   <h4 className="text-xs font-black uppercase italic truncate leading-tight text-(--text-main)">{product.name}</h4>
                   <div className="flex-shrink-0 flex gap-2">
                      {product.is_new && (
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      )}
                      {product.is_published ? (
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                      )}
                   </div>
                 </div>
                 <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">
                   {product.category}
                 </p>
               </div>
               
               <div className="flex justify-between items-end">
                 <div>
                   <p className="text-sm font-black italic text-(--text-main)">{product.price.toFixed(2)}€</p>
                   <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">{calculateStock(product)} UNI</p>
                 </div>
                 <div className="flex gap-1">
                   <button 
                     onClick={(e) => { e.stopPropagation(); window.open(`/producto/${product.product_id}`, '_blank'); }}
                     className="p-2 text-gray-400 hover:text-primary"
                   >
                     <Eye className="w-4 h-4" />
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onDelete(product); }}
                     className="p-2 text-gray-400 hover:text-red-500"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>
                 </div>
               </div>
             </div>
          </div>
        ))}
        {/* Pagination Mobile */}
        <div className="flex justify-center items-center gap-3 py-6">
           <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, productPage - 1))} disabled={productPage === 1} className="text-[9px] font-black uppercase tracking-widest px-5">Ant.</Button>
           <span className="text-[9px] font-black text-primary px-3">{productPage} / {totalPages}</span>
           <Button variant="outline" size="sm" onClick={() => onPageChange(Math.min(totalPages, productPage + 1))} disabled={productPage >= totalPages} className="text-[9px] font-black uppercase tracking-widest px-5">Sig.</Button>
        </div>
      </div>
    </div>
  );
};
