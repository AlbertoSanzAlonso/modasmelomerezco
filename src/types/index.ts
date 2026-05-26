export interface ProductImage {
  id?: number;
  product_id?: string;
  image_url: string;
  orden?: number;
  is_main?: boolean;
  alt_text?: string;
}

export interface Category {
  id: number;
  name: string;
}

export interface Subcategory {
  id: number;
  name: string;
  category_id: number;
}

export interface Color {
  id: number;
  name: string;
  hex: string;
}

export interface Label {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  product_id: string;
  name: string;
  description: string;
  price: number;
  category_id: number;
  subcategory_id?: number;
  /** @deprecated use category_id instead */
  category?: 'Ropa' | 'Bolsos' | string;
  /** @deprecated use subcategory_id instead */
  subcategory?: string;
  /** Assembled from product_images rows, sorted by orden */
  images: string[];
  variants: ProductVariant[];
  is_new?: boolean;
  is_published?: boolean;
  stock: number;
  colors?: Color[];
  labels?: Label[];
  discountCodes?: DiscountCode[];
}

export interface DiscountCodeInput {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  is_active?: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  max_uses?: number | null;
  /** Subcategorías a las que aplica el código (p. ej. pantalones, bolsos) */
  subcategory_ids?: number[];
}


export interface ProductVariant {
  id: string; // Mapping variant_id
  variant_id?: number;
  product_id?: string;
  size: string;
  /** null = solo talla, sin selector de color en tienda */
  color_id: number | null;
  /** Nombre denormalizado para UI y snapshot en pedidos */
  color?: string | null;
  stock: number;
}

export type DiscountType = 'percent' | 'fixed';

export interface DiscountCode {
  id: number;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  is_active: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  max_uses?: number | null;
  used_count: number;
  created_at?: string;
  subcategory_ids?: number[];
}

/** Descuento aplicado en carrito (tras validar contra Supabase) */
export interface AppliedDiscount {
  code: string;
  discount_code_id: number;
  discount_type: DiscountType;
  discount_value: number;
  eligible_product_ids: string[];
}

export interface CartItem extends Product {
  selectedVariant: ProductVariant;
  quantity: number;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  /** Precio unitario final (con descuento aplicado, si lo hay) */
  price: number;
  /** Precio unitario de catálogo antes del descuento */
  unit_price_original?: number;
  /** Descuento total de la línea (cantidad × unidad) */
  line_discount?: number;
  size?: string;
  color?: string;
  variant_id?: number;
  image_url?: string;
}

export interface Order {
  order_id: string;
  customer_id: string;
  order_date: string;
  shipped_date?: string;
  delivery_date?: string;
  subtotal: number;
  /** Importe total descontado en el pedido */
  discount_amount?: number;
  /** Código promocional aplicado */
  discount_code?: string | null;
  tax_amount: number;
  shipping_cost: number;
  total_amount: number;
  order_status: 'Pending' | 'Paid' | 'Shipped' | 'Delivered' | 'Cancelled';
  payment_method_id?: number;
  payment_method?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'Pending' | 'Paid' | 'Cancelled' | 'Shipped' | 'Delivered';
  shipping_method?: string;
  shipping_address_id: number;
  // Address Snapshot
  shipping_city?: string;
  shipping_province?: string;
  shipping_zip?: string;
  shipping_street?: string;
  shipping_floor?: string;
  shipping_door?: string;
  shipping_stair?: string;
  tracking_number?: string;
  carrier?: string;
  customer_email?: string;
  guest_name?: string;
  guest_surname?: string;
  guest_phone?: string;
  items: OrderItem[];
  customer?: {
    name: string;
    surname?: string;
    email?: string;
    phone?: string;
  };
  created_at: string;
}

export interface Address {
  shipping_address_id?: number;
  location_id?: number; // FK to master dataset
  type: string;
  street: string;
  floor?: string;
  door?: string;
  stair?: string;
  province: string;
  city: string;
  zip: string;
  isDefault: boolean;
}

export interface PaymentMethod {
  id: number;
  user_id: string;
  provider: 'stripe' | 'paypal' | 'redsys' | string;
  provider_token: string;
  type: 'card' | 'paypal' | 'apple_pay' | string;
  last4?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
  created_at: string;
}

export interface Customer {
  customer_id: string;
  email: string;
  name: string;
  surname?: string;
  phone?: string;
  addresses?: Address[];
  paymentMethods?: PaymentMethod[];
  orders?: Order[];
  favorites?: string[];
  password?: string;
}

export interface Admin {
  admin_id: string;
  username: string;
  name?: string;
  email?: string;
  role?: string;
  created_at?: string;
}

export interface Subscription {
  id: number;
  user_id?: string;
  email: string;
  status: 'active' | 'unsubscribed' | 'pending';
  subscribed_at: string;
  confirmation_token?: string;
}
