import { useState, useEffect, useRef } from 'react';
import { api } from "@/lib/api";
import { useCartStore } from "@/store/useCartStore";
import type { Product, Category, Subcategory, Color } from "@/types/index";
import {
  consolidateVariantsForSave,
  countColorVariants,
  deriveProductColors,
  normalizeVariantsForForm,
  variantHasColor,
} from '@/lib/productVariants';

function newDraftProductId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function mergeColorCatalog(owned: Color[], extra: Color[]): Color[] {
  const map = new Map<number, Color>();
  for (const c of [...owned, ...extra]) {
    if (c?.id != null) map.set(c.id, c);
  }
  return [...map.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  );
}

export const useProductForm = (
  product: Product | null | undefined,
  onSave: (product: Partial<Product>) => void,
  isSaving = false
) => {
  const draftProductIdRef = useRef(product?.product_id ?? newDraftProductId());

  const [formData, setFormData] = useState<Partial<Product>>({
    product_id: draftProductIdRef.current,
    name: '',
    description: '',
    details: '',
    price: 0,
    category_id: undefined,
    subcategory_id: undefined,
    images: [],
    stock: 0,
    is_new: false,
    is_published: false,
    variants: [{ id: 'v1', size: '', color_id: null, stock: 0 }],
    colors: [],
    labels: [],
    discountCodes: [],
  });

  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [subcategoriesList, setSubcategoriesList] = useState<Subcategory[]>([]);
  const [availableColors, setAvailableColors] = useState<Color[]>([]);
  const [availableLabels, setAvailableLabels] = useState<any[]>([]);
  const [availableDiscountCodes, setAvailableDiscountCodes] = useState<any[]>([]);

  const [isUploading, setIsUploading] = useState(false);
  const [isProductLoading, setIsProductLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);
  const loadedColorVariantCount = useRef(0);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isSaving) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [isSaving]);

  useEffect(() => {
    api.categories.getAll().then(setCategoriesList);
    api.labels.getAll().then(setAvailableLabels).catch(() => setAvailableLabels([]));
    api.discountCodes.getAll().then(setAvailableDiscountCodes).catch(() => setAvailableDiscountCodes([]));
  }, []);

  useEffect(() => {
    if (formData.category_id) {
      api.categories.getSubcategories(formData.category_id).then(setSubcategoriesList);
    } else {
      setSubcategoriesList([]);
    }
  }, [formData.category_id]);

  useEffect(() => {
    if (!product?.product_id) {
      // Nuevo artículo: colores del id de borrador
      if (!draftProductIdRef.current) {
        draftProductIdRef.current = newDraftProductId();
      }
      const draftId = draftProductIdRef.current;
      setIsProductLoading(false);
      loadedColorVariantCount.current = 0;
      setFormData((prev) => ({ ...prev, product_id: draftId }));
      let cancelled = false;
      api.colors
        .getForProduct(draftId)
        .then((owned) => {
          if (!cancelled) setAvailableColors(owned);
        })
        .catch(() => {
          if (!cancelled) setAvailableColors([]);
        });
      return () => {
        cancelled = true;
      };
    }

    draftProductIdRef.current = product.product_id;
    let cancelled = false;
    setIsProductLoading(true);

    Promise.all([
      api.products.getById(product.product_id),
      api.colors.getForProduct(product.product_id),
    ])
      .then(([fresh, ownedColors]) => {
        if (cancelled) return;
        const catalog = mergeColorCatalog(ownedColors, fresh.colors || []);
        setAvailableColors(catalog);
        const variants = normalizeVariantsForForm(fresh.variants || [], catalog);
        loadedColorVariantCount.current = countColorVariants(variants);
        setFormData({ ...fresh, variants });
      })
      .catch((error) => {
        console.error('Error loading product for edit:', error);
        if (!cancelled) {
          useCartStore.getState().openModal({
            title: 'Error al cargar',
            message:
              'No se pudo cargar el inventario del producto. Cierra el modal e inténtalo de nuevo.',
            type: 'error',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setIsProductLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [product?.product_id]);

  useEffect(() => {
    const totalStock = formData.variants?.reduce((sum, v) => sum + (v.stock ?? 0), 0) || 0;
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
    const baseName = sanitizeName(productName) || 'product';
    const productKey = sanitizeName(formData.product_id || 'draft') || 'draft';
    // Carpeta + timestamp: evita pisar archivos de otras piezas (o de este mismo producto)
    return `${productKey}/${Date.now()}_${baseName}_${index}.webp`;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmittingRef.current || isSaving) return;
    
    const openError = (msg: string) => {
      useCartStore.getState().openModal({
        title: 'Información incompleta',
        message: msg,
        type: 'warning'
      });
    };

    if (product?.product_id && isProductLoading) {
      openError('Espera a que cargue el inventario del producto.');
      return;
    }

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

    const validVariants = consolidateVariantsForSave(
      (formData.variants || [])
        .filter((v) => v.size?.trim())
        .map((v) => ({
          ...v,
          color_id: v.color_id ?? null,
          stock: Math.max(0, v.stock ?? 0),
        }))
    );

    const withStock = validVariants.filter((v) => (v.stock ?? 0) > 0);
    if (withStock.length === 0) {
      openError('Indica stock mayor que 0 en al menos una talla.');
      return;
    }

    const seen = new Set<string>();
    for (const v of validVariants) {
      const key = `${v.size.trim().toLowerCase()}::${v.color_id ?? 'null'}`;
      if (seen.has(key)) {
        const label = variantHasColor(v)
          ? availableColors.find((c) => c.id === v.color_id)?.name ?? 'color'
          : 'solo talla';
        openError(
          `Hay combinaciones duplicadas (${v.size} · ${label}). Deja una sola línea por talla y color.`
        );
        return;
      }
      seen.add(key);
    }

    const missingCatalog = validVariants.find(
      (v) => v.color_id != null && !availableColors.some((c) => c.id === v.color_id)
    );
    if (missingCatalog) {
      openError(
        'Hay un color que ya no está en el catálogo. Recarga el formulario o elige otro color.'
      );
      return;
    }

    const colors = deriveProductColors(validVariants, availableColors);
    const trimmedDetails = formData.details?.trim() || null;

    const lockSubmit = () => {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
    };

    const unlockSubmit = () => {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    };

    const persistForm = (allowColorRemoval = false) => {
      lockSubmit();
      onSave({
        ...formData,
        details: trimmedDetails,
        variants: validVariants,
        colors,
        labels: formData.labels || [],
        discountCodes: formData.discountCodes || [],
        ...(allowColorRemoval
          ? { _syncOptions: { allowColorRemoval: true } }
          : {}),
      } as Partial<Product> & { _syncOptions?: { allowColorRemoval?: boolean } });
    };

    lockSubmit();

    if (product?.product_id) {
      try {
        const fresh = await api.products.getById(product.product_id);
        const dbColorCount = countColorVariants(fresh.variants || []);
        const formColorCount = countColorVariants(validVariants);

        if (
          dbColorCount > 0 &&
          formColorCount === 0 &&
          loadedColorVariantCount.current === 0
        ) {
          unlockSubmit();
          openError(
            'Los colores no se cargaron correctamente. Cierra el modal y vuelve a abrir el producto antes de guardar.'
          );
          return;
        }

        if (loadedColorVariantCount.current > 0 && formColorCount === 0) {
          unlockSubmit();
          useCartStore.getState().openModal({
            title: 'Eliminar variantes de color',
            message:
              'Vas a quitar todas las variantes de color de este producto. ¿Continuar?',
            type: 'confirm',
            onConfirm: () => persistForm(true),
          });
          return;
        }
      } catch (error) {
        console.error('Error verifying product inventory before save:', error);
        unlockSubmit();
        openError(
          'No se pudo verificar el inventario. Inténtalo de nuevo en unos segundos.'
        );
        return;
      }
    }

    persistForm();
  };

  return {
    formData,
    setFormData,
    categoriesList,
    subcategoriesList,
    availableColors,
    setAvailableColors,
    availableLabels,
    setAvailableLabels,
    availableDiscountCodes,
    setAvailableDiscountCodes,
    isUploading,
    isProductLoading,
    isSubmitting: isSubmitting || isSaving,
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
