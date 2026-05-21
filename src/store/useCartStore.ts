import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppliedDiscount, CartItem, Product, ProductVariant } from "@/types/index";
import { getCartItemKey } from '@/lib/productVariants';
import { calculateCartTotals } from '@/lib/cartDiscount';
import { api } from '@/lib/api';

interface ModalConfig {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'favorites' | 'confirm' | 'action' | 'product_created';
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
  subtotal: number;
  discountAmount: number;
  total: number;
  appliedDiscount: AppliedDiscount | null;
  discountError: string | null;
  isApplyingDiscount: boolean;
  applyDiscountCode: (code: string) => Promise<void>;
  clearDiscount: () => void;
  revalidateDiscount: () => Promise<void>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  modalConfig: ModalConfig;
  openModal: (config: Omit<ModalConfig, 'isOpen'>) => void;
  closeModal: () => void;
}

function syncTotals(
  items: CartItem[],
  appliedDiscount: AppliedDiscount | null
): { subtotal: number; discountAmount: number; total: number } {
  return calculateCartTotals(items, appliedDiscount);
}

function getItemKey(i: CartItem): string {
  return getCartItemKey(i.product_id, i.selectedVariant);
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      discountAmount: 0,
      total: 0,
      appliedDiscount: null,
      discountError: null,
      isApplyingDiscount: false,
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

      clearDiscount: () => {
        const { items } = get();
        const totals = syncTotals(items, null);
        set({
          appliedDiscount: null,
          discountError: null,
          ...totals,
        });
      },

      applyDiscountCode: async (code) => {
        const { items } = get();
        set({ isApplyingDiscount: true, discountError: null });
        try {
          const cartItems = items.map((i) => ({
            product_id: i.product_id,
            subcategory_id: i.subcategory_id ?? null,
          }));
          const result = await api.discountCodes.validateForProducts(code, cartItems);
          if (!result.valid || !result.discount) {
            const totals = syncTotals(items, null);
            set({
              appliedDiscount: null,
              discountError: result.message || 'Descuento no válido',
              ...totals,
            });
            return;
          }
          const totals = syncTotals(items, result.discount);
          set({
            appliedDiscount: result.discount,
            discountError: null,
            ...totals,
          });
        } catch (err) {
          console.error('[cart] discount validation failed:', err);
          const totals = syncTotals(items, null);
          set({
            appliedDiscount: null,
            discountError: 'Descuento no válido',
            ...totals,
          });
        } finally {
          set({ isApplyingDiscount: false });
        }
      },

      revalidateDiscount: async () => {
        const { appliedDiscount, items } = get();
        if (!appliedDiscount || items.length === 0) return;
        await get().applyDiscountCode(appliedDiscount.code);
      },

      addItem: (product, variant) => {
        const items = get().items;
        const cartItemId = getCartItemKey(product.product_id, variant);
        const existingItem = items.find((i) => getItemKey(i) === cartItemId);
        const { appliedDiscount } = get();

        let updatedItems: CartItem[];
        if (existingItem) {
          updatedItems = items.map((i) =>
            getItemKey(i) === cartItemId
              ? { ...i, quantity: i.quantity + 1 }
              : i
          );
        } else {
          const newItem: CartItem = { ...product, selectedVariant: variant, quantity: 1 };
          updatedItems = [...items, newItem];
        }

        const totals = syncTotals(updatedItems, appliedDiscount);
        set({
          items: updatedItems,
          ...totals,
          modalConfig: {
            isOpen: true,
            title: '¡Añadido con éxito!',
            message: 'El artículo se ha añadido correctamente a tu cesta de la compra.',
            type: 'success'
          }
        });

        if (appliedDiscount) {
          void get().revalidateDiscount();
        }
      },

      removeItem: (cartItemId) => {
        const { appliedDiscount } = get();
        const updatedItems = get().items.filter((i) => getItemKey(i) !== cartItemId);
        const totals = syncTotals(updatedItems, appliedDiscount);
        set({ items: updatedItems, ...totals });
        if (appliedDiscount && updatedItems.length > 0) {
          void get().revalidateDiscount();
        } else if (updatedItems.length === 0) {
          set({ appliedDiscount: null, discountError: null });
        }
      },

      updateQuantity: (cartItemId, quantity) => {
        const { appliedDiscount } = get();
        const updatedItems = get().items.map((i) =>
          getItemKey(i) === cartItemId ? { ...i, quantity } : i
        );
        const totals = syncTotals(updatedItems, appliedDiscount);
        set({ items: updatedItems, ...totals });
      },

      clearCart: () => {
        set({
          items: [],
          subtotal: 0,
          discountAmount: 0,
          total: 0,
          appliedDiscount: null,
          discountError: null,
        });
      },
    }),
    {
      name: 'cart-storage-v3',
      partialize: (state) => ({
        items: state.items,
        subtotal: state.subtotal,
        discountAmount: state.discountAmount,
        total: state.total,
        appliedDiscount: state.appliedDiscount,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.appliedDiscount && state.items.length > 0) {
          void state.revalidateDiscount();
        }
      },
    }
  )
);
