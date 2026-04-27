
import React from 'react';
import { Plus, Loader2, Crop, Star, Trash2 } from 'lucide-react';

interface ProductImagesProps {
  images: string[];
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditImage: (index: number) => void;
  onSetPrincipal: (index: number) => void;
  onRemoveImage: (index: number) => void;
}

export const ProductImages: React.FC<ProductImagesProps> = ({
  images,
  isUploading,
  fileInputRef,
  onFileChange,
  onEditImage,
  onSetPrincipal,
  onRemoveImage
}) => {
  return (
    <div className="space-y-6">
      <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Galería de Imágenes</label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {images.map((img, idx) => (
          <div key={idx} className="relative aspect-3/4 bg-(--bg-card) border border-(--border-main) rounded-2xl overflow-hidden group">
            <img src={img} alt="" className="w-full h-full object-cover" />
            
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3">
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => onEditImage(idx)}
                  className="p-2 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-md transition-all"
                  title="Recortar / Ajustar"
                >
                  <Crop className="w-4 h-4" />
                </button>
                {idx !== 0 && (
                  <button 
                    type="button"
                    onClick={() => onSetPrincipal(idx)}
                    className="p-2 bg-white/20 hover:bg-yellow-500 text-white rounded-full backdrop-blur-md transition-all"
                    title="Hacer Principal"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => onRemoveImage(idx)}
                  className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full backdrop-blur-md transition-all"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {idx === 0 && (
              <div className="absolute top-0 left-0 bg-primary text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-br-xl shadow-lg flex items-center gap-1">
                <Star className="w-2.5 h-2.5 fill-current" />
                Principal
              </div>
            )}
          </div>
        ))}
        
        <label className="cursor-pointer aspect-3/4 bg-(--bg-card) border-2 border-dashed border-(--border-main) hover:border-primary/50 transition-all flex flex-col items-center justify-center rounded-2xl group">
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Añadir Foto</span>
            </>
          )}
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={onFileChange} disabled={isUploading} />
        </label>
      </div>
      <p className="text-[9px] text-gray-500 uppercase tracking-widest italic text-center">La primera imagen será la portada del producto.</p>
    </div>
  );
};
