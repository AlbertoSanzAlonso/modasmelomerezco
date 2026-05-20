
import React from 'react';
import { ProductImages } from './ProductImages';
import { ProductGeneralInfo } from './ProductGeneralInfo';
import { ProductCategories } from './ProductCategories';
import { ProductInventory } from './ProductInventory';
import { ProductPublishOptions } from './ProductPublishOptions';
import { ProductFooter } from './ProductFooter';
import type { Category, Subcategory } from "@/types/index";

interface ProductFormProps {
  formData: any;
  setFormData: (data: any) => void;
  categoriesList: Category[];
  subcategoriesList: Subcategory[];
  availableColors: Color[];
  setAvailableColors: React.Dispatch<React.SetStateAction<Color[]>>;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditImage: (idx: number) => void;
  handleSetPrincipal: (idx: number) => void;
  removeImage: (idx: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  formData,
  setFormData,
  categoriesList,
  subcategoriesList,
  availableColors,
  setAvailableColors,
  isUploading,
  fileInputRef,
  handleFileChange,
  handleEditImage,
  handleSetPrincipal,
  removeImage,
  onSubmit,
  onCancel
}) => {
  return (
    <form onSubmit={onSubmit} autoComplete="off" className="p-6 md:p-12 pt-4 space-y-10 md:space-y-12">
      <ProductImages 
        images={formData.images || []}
        isUploading={isUploading}
        fileInputRef={fileInputRef}
        onFileChange={handleFileChange}
        onEditImage={handleEditImage}
        onSetPrincipal={handleSetPrincipal}
        onRemoveImage={removeImage}
      />

      <ProductGeneralInfo 
        name={formData.name}
        price={formData.price}
        onNameChange={(name) => setFormData({ ...formData, name })}
        onPriceChange={(price) => setFormData({ ...formData, price })}
      />

      <ProductCategories 
        categoryId={formData.category_id}
        subcategoryId={formData.subcategory_id}
        categoriesList={categoriesList}
        subcategoriesList={subcategoriesList}
        totalStock={formData.stock}
        onCategoryChange={(id) => setFormData({ ...formData, category_id: id, subcategory_id: undefined })}
        onSubcategoryChange={(id) => setFormData({ ...formData, subcategory_id: id })}
      />

      <ProductInventory
        variants={formData.variants || []}
        availableColors={availableColors}
        onVariantsChange={(variants) => setFormData({ ...formData, variants })}
        onColorCreated={(newColor) => setAvailableColors((prev) => [...prev, newColor])}
      />

      <ProductPublishOptions 
        isNew={formData.is_new}
        isPublished={formData.is_published}
        onNewChange={(val) => setFormData({ ...formData, is_new: val })}
        onPublishedChange={(val) => setFormData({ ...formData, is_published: val })}
      />

      <ProductFooter onCancel={onCancel} />
    </form>
  );
};

