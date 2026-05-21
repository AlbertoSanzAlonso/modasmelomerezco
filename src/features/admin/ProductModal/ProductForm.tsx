
import React from 'react';
import { ProductImages } from './ProductImages';
import { ProductGeneralInfo } from './ProductGeneralInfo';
import { ProductCategories } from './ProductCategories';
import { ProductInventory } from './ProductInventory';
import { ProductLabels } from './ProductLabels';
import { ProductDiscountCodes } from './ProductDiscountCodes';
import { ProductPublishOptions } from './ProductPublishOptions';
import { ProductFooter } from './ProductFooter';
import type { Category, Subcategory, Color, Label, DiscountCode } from '@/types/index';

interface ProductFormProps {
  formData: any;
  setFormData: (data: any) => void;
  categoriesList: Category[];
  subcategoriesList: Subcategory[];
  availableColors: Color[];
  setAvailableColors: React.Dispatch<React.SetStateAction<Color[]>>;
  availableLabels: Label[];
  setAvailableLabels: React.Dispatch<React.SetStateAction<Label[]>>;
  availableDiscountCodes: DiscountCode[];
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
  availableLabels,
  setAvailableLabels,
  availableDiscountCodes,
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

      <ProductLabels
        selectedLabels={formData.labels || []}
        availableLabels={availableLabels}
        onLabelsChange={(labels) => setFormData({ ...formData, labels })}
        onLabelCreated={(label) => setAvailableLabels((prev) => [...prev, label])}
      />

      <ProductDiscountCodes
        selectedCodes={formData.discountCodes || []}
        availableCodes={availableDiscountCodes}
        onCodesChange={(discountCodes) => setFormData({ ...formData, discountCodes })}
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

