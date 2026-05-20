import { useState, useEffect, useRef } from 'react';
import { api } from "@/lib/api";
import { useCartStore } from "@/store/useCartStore";
import type { Product, Category, Subcategory } from "@/types/index";
import {
  deriveProductColors,
  normalizeVariantsForForm,
  normalizeColor,
  isDefaultColor,
  DEFAULT_COLOR,
  ensureNeutroInCatalog,
} from '@/lib/productVariants';

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
    variants: [{ id: 'v1', size: '', color: DEFAULT_COLOR, stock: 0 }],
    colors: []
  });

  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [subcategoriesList, setSubcategoriesList] = useState<Subcategory[]>([]);
  const [availableColors, setAvailableColors] = useState<any[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.categories.getAll().then(setCategoriesList);
    api.colors
      .getAll()
      .then(async (colors) => {
        const hasNeutro = colors.some(
          (c) => c.name.toLowerCase() === DEFAULT_COLOR.toLowerCase()
        );
        if (!hasNeutro) {
          try {
            const created = await api.colors.create({
              name: DEFAULT_COLOR,
              hex: '#C4B8A8',
            });
            setAvailableColors(ensureNeutroInCatalog([...colors, created]));
            return;
          } catch {
            /* usar Neutro sintético en UI */
          }
        }
        setAvailableColors(ensureNeutroInCatalog(colors));
      })
      .catch(console.error);
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
      const variants = normalizeVariantsForForm(
        product.variants || [],
        product.colors || []
      );
      setFormData({ ...product, variants });
    }
  }, [product]);

  useEffect(() => {
    const totalStock = formData.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
    if (totalStock !== formData.stock) {
      setFormData(prev => ({ ...prev, stock: totalStock }));
    }
  }, [formData.variants, formData.stock]);

  const sanitizeName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  };

  const buildImageFileName = (productName: string, index: number): string => {
    const baseName = sanitizeName(productName);
    if (!baseName) return `product_${Date.now()}.webp`;
    return index === 0 ? `${baseName}.webp` : `${baseName}_${index}.webp`;
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
      const productName = formData.name || 'product';
      const currentImages = formData.images || [];
      
      const targetIndex = editingImageIndex !== null ? editingImageIndex : currentImages.length;
      const fileName = buildImageFileName(productName, targetIndex);
      const webpFile = new File([croppedBlob], fileName, { type: 'image/webp' });

      const publicUrl = await api.storage.upload(webpFile, fileName);
      const cacheBustedUrl = `${publicUrl}?v=${Date.now()}`;

      if (editingImageIndex !== null) {
        const newImages = [...currentImages];
        newImages[editingImageIndex] = cacheBustedUrl;
        setFormData(prev => ({ ...prev, images: newImages }));
        setEditingImageIndex(null);
      } else {
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), cacheBustedUrl] }));
      }
    } catch (error) {
      console.error('Upload failed:', error);
      useCartStore.getState().openModal({
        title: 'Error de subida',
        message: 'No se pudo subir la imagen. Por favor, inténtalo de nuevo.',
        type: 'error'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetPrincipal = (index: number) => {
    const newImages = [...(formData.images || [])];
    const [selected] = newImages.splice(index, 1);
    newImages.unshift(selected);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleEditImage = (index: number) => {
    const url = formData.images?.[index];
    if (!url) return;
    setEditingImageIndex(index);
    setCropSrc(url);
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
    const openError = (msg: string) => {
      useCartStore.getState().openModal({
        title: 'Información incompleta',
        message: msg,
        type: 'warning'
      });
    };

    if (!formData.name?.trim()) {
      openError('Por favor, indica un nombre para el producto.');
      return;
    }
    if (!formData.category_id) {
      openError('Debes seleccionar una categoría.');
      return;
    }
    if (formData.price === undefined || formData.price < 0) {
      openError('Por favor, indica un precio válido.');
      return;
    }
    if (!formData.images || formData.images.length === 0) {
      openError('Para guardar el producto, es necesario añadir al menos una imagen.');
      return;
    }

    const validVariants = (formData.variants || [])
      .filter((v) => v.size?.trim())
      .map((v) => ({
        ...v,
        color: normalizeColor(v.color),
        stock: Math.max(0, v.stock ?? 0),
      }));

    const withStock = validVariants.filter((v) => (v.stock ?? 0) > 0);
    if (withStock.length === 0) {
      openError('Indica stock mayor que 0 en al menos una talla (y color).');
      return;
    }

    const onlyPlaceholders = validVariants.every((v) => (v.stock ?? 0) === 0);
    if (onlyPlaceholders) {
      openError('Indica stock en al menos una talla y color.');
      return;
    }

    const toSave = validVariants;

    const seen = new Set<string>();
    for (const v of toSave) {
      const key = `${v.size.trim().toLowerCase()}::${normalizeColor(v.color).toLowerCase()}`;
      if (seen.has(key)) {
        openError(
          `Hay combinaciones duplicadas (${v.size} · ${normalizeColor(v.color)}). Deja una sola línea por talla y color.`
        );
        return;
      }
      seen.add(key);
    }

    const colors = deriveProductColors(toSave, availableColors);
    const missingColor = toSave.find(
      (v) =>
        v.color &&
        !isDefaultColor(v.color) &&
        !colors.some((c) => c.name.toLowerCase() === v.color!.toLowerCase())
    );
    if (missingColor) {
      openError(
        `El color "${missingColor.color}" no está en el catálogo. Créalo con "+ CREAR COLOR" antes de guardar.`
      );
      return;
    }

    onSave({ ...formData, variants: toSave, colors });
  };

  return {
    formData,
    setFormData,
    categoriesList,
    subcategoriesList,
    availableColors,
    setAvailableColors,
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
