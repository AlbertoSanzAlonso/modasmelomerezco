
import type { Product, Category, Subcategory } from "@/types/index";

export interface ProductModalProps {
  product?: Product | null;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
}

export interface ProductFormState extends Partial<Product> {
  name: string;
  description: string;
  price: number;
  category_id?: number;
  subcategory_id?: number;
  images: string[];
  stock: number;
  is_new: boolean;
  is_published: boolean;
  variants: any[];
}
