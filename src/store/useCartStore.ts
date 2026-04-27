import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, Product, ProductVariant } from "@/types/index";

const calculateTotal = (items: CartItem[]) => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

interface ModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'favorites' | 'confirm' | 'action' | 'product_created';
  onConfirm?: () => void;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  modalConfig: ModalConfig;
  openModal: (config: Omit<ModalConfig, 'isOpen'>) => void;
  closeModal: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      isCartOpen: false,
      setIsCartOpen: (open) => set({ isCartOpen: open }),
      modalConfig: {
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
      },
      openModal: (config) => set({ modalConfig: { ...config, isOpen: true } }),
      closeModal: () => set({ modalConfig: { ...get().modalConfig, isOpen: false } }),
      addItem: (product, variant) => {
        const items = get().items;
        const cartItemId = `${product.product_id}-${variant.id}`;
        const existingItem = items.find(i => `${i.product_id}-${i.selectedVariant.id}` === cartItemId);

        if (existingItem) {
          const updatedItems = items.map(i => 
            `${i.product_id}-${i.selectedVariant.id}` === cartItemId 
              ? { ...i, quantity: i.quantity + 1 } 
              : i
          );
          set({ 
            items: updatedItems, 
            total: calculateTotal(updatedItems),
            modalConfig: {
              isOpen: true,
              title: '¡Añadido con éxito!',
              message: 'El artículo se ha añadido correctamente a tu cesta de la compra.',
              type: 'success'
            }
          });
        } else {
          const newItem: CartItem = { ...product, selectedVariant: variant, quantity: 1 };
          const updatedItems = [...items, newItem];
          set({ 
            items: updatedItems, 
            total: calculateTotal(updatedItems),
            modalConfig: {
              isOpen: true,
              title: '¡Añadido con éxito!',
              message: 'El artículo se ha añadido correctamente a tu cesta de la compra.',
              type: 'success'
            }
          });
        }
      },
      removeItem: (cartItemId) => {
        const updatedItems = get().items.filter(i => `${i.product_id}-${i.selectedVariant.id}` !== cartItemId);
        set({ items: updatedItems, total: calculateTotal(updatedItems) });
      },
      updateQuantity: (cartItemId, quantity) => {
        const updatedItems = get().items.map(i => 
          `${i.product_id}-${i.selectedVariant.id}` === cartItemId ? { ...i, quantity } : i
        );
        set({ items: updatedItems, total: calculateTotal(updatedItems) });
      },
      clearCart: () => {
        set({ items: [], total: 0 });
      },
    }),
    { 
      name: 'cart-storage-v2',
      partialize: (state) => ({ 
        items: state.items, 
        total: state.total 
      })
    }
  )
);

