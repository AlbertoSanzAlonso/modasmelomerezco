
import React from 'react';
import { X } from 'lucide-react';
import { ImageCropModal } from "@/components/ui/ImageCropModal";
import { useProductForm } from './useProductForm';
import { ProductForm } from './ProductForm';
import type { ProductModalProps } from './types';

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onSave }) => {
  const {
    formData,
    setFormData,
    categoriesList,
    subcategoriesList,
    isUploading,
    cropSrc,
    setCropSrc,
    setEditingImageIndex,
    fileInputRef,
    handleFileChange,
    handleCropConfirm,
    handleSetPrincipal,
    handleEditImage,
    removeImage,
    handleSubmit
  } = useProductForm(product, onSave);

  return (
    <>
      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onClose={() => { 
            if (cropSrc && !formData.images?.includes(cropSrc)) {
              URL.revokeObjectURL(cropSrc); 
            }
            setCropSrc(null); 
            setEditingImageIndex(null);
          }}
        />
      )}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-secondary/80 backdrop-blur-sm">
        <div className="bg-[var(--bg-main)] border border-[var(--border-main)] w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl shadow-primary/5 flex flex-col overflow-hidden">
          <header className="p-8 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--bg-main)] z-10">
            <h2 className="text-2xl font-display font-black uppercase tracking-tighter italic text-[var(--text-main)]">
              {product ? 'Editar Pieza' : 'Nueva Pieza Luxury'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-primary/10 rounded-full transition-all text-[var(--text-main)]">
              <X className="w-6 h-6" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto py-6">
            <ProductForm 
              formData={formData}
              setFormData={setFormData}
              categoriesList={categoriesList}
              subcategoriesList={subcategoriesList}
              isUploading={isUploading}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              handleEditImage={handleEditImage}
              handleSetPrincipal={handleSetPrincipal}
              removeImage={removeImage}
              onSubmit={handleSubmit}
              onCancel={onClose}
            />
          </div>
        </div>
      </div>
    </>
  );
};
