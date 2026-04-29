import { useState, useEffect, useRef } from 'react';
import { api } from "@/lib/api";
import type { Product, Category, Subcategory } from "@/types/index";

export const useProductForm = (product: Product | null | undefined, onSave: (product: Partial<Product>) => void) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    category_id: undefined,
    subcategory_id: undefined,
    images: [],
    stock: 0,
    is_new: false,
    is_published: false,
    variants: [{ id: 'v1', size: 'M', color: 'Único', stock: 0 }]
  });

  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [subcategoriesList, setSubcategoriesList] = useState<Subcategory[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.categories.getAll().then(setCategoriesList);
  }, []);

  useEffect(() => {
    if (formData.category_id) {
      api.categories.getSubcategories(formData.category_id).then(setSubcategoriesList);
    } else {
      setSubcategoriesList([]);
    }
  }, [formData.category_id]);

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  useEffect(() => {
    const totalStock = formData.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
    if (totalStock !== formData.stock) {
      setFormData(prev => ({ ...prev, stock: totalStock }));
    }
  }, [formData.variants, formData.stock]);

  const buildImagePath = (productId: string, index: number): string => {
    if (index === 0) return `${productId}_main.webp`;
    return `${productId}_${index}.webp`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    e.target.value = '';
  };

  const handleCropConfirm = async (croppedBlob: Blob) => {
    if (!cropSrc) return;
    URL.revokeObjectURL(cropSrc);
    setCropSrc(null);

    try {
      setIsUploading(true);
      const productId = formData.product_id || 'new';
      const currentImages = formData.images || [];
      
      const targetIndex = editingImageIndex !== null ? editingImageIndex : currentImages.length;
      const fileName = buildImagePath(productId, targetIndex);
      const webpFile = new File([croppedBlob], fileName, { type: 'image/webp' });

      const publicUrl = await api.storage.upload(webpFile, fileName);

      if (editingImageIndex !== null) {
        const newImages = [...currentImages];
        newImages[editingImageIndex] = publicUrl;
        setFormData(prev => ({ ...prev, images: newImages }));
        setEditingImageIndex(null);
      } else {
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), publicUrl ] }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Error al subir la imagen.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPrincipal = (index: number) => {
    const newImages = [...(formData.images || [])];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    
    // Reindex all images to follow naming convention
    reindexImages(newImages);
  };

  const handleEditImage = (index: number) => {
    const url = formData.images?.[index];
    if (!url) return;
    setEditingImageIndex(index);
    setCropSrc(url);
  };

  const reindexImages = async (newImages: string[]) => {
    // This would require re-uploading with new names (optional, can be done on save)
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const removeImage = async (index: number) => {
    const imageUrl = formData.images?.[index];
    if (!imageUrl) return;
    const newImages = (formData.images || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
    api.storage.delete(imageUrl).catch(console.warn);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.name?.trim()) {
      alert('Por favor, indica un nombre para el producto.');
      return;
    }
    if (!formData.category_id) {
      alert('Debes seleccionar una categoría.');
      return;
    }
    if (formData.price === undefined || formData.price < 0) {
      alert('Por favor, indica un precio válido.');
      return;
    }
    if (!formData.images || formData.images.length === 0) {
      alert('Añade al menos una imagen al producto.');
      return;
    }

    onSave(formData);
  };

  return {
    formData,
    setFormData,
    categoriesList,
    subcategoriesList,
    isUploading,
    cropSrc,
    setCropSrc,
    editingImageIndex,
    setEditingImageIndex,
    fileInputRef,
    handleFileChange,
    handleCropConfirm,
    handleSetPrincipal,
    handleEditImage,
    removeImage,
    handleSubmit
  };
};
