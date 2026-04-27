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
}

export interface ProductVariant {
  id: string; // Mapping variant_id
  variant_id?: number;
  product_id?: string;
  size: string;
  color: string;
  stock: number;
}

export interface CartItem extends Product {
  selectedVariant: ProductVariant;
  quantity: number;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
  image_url?: string;
}

export interface Order {
  order_id: string;
  customer_id: string;
  order_date: string;
  shipped_date?: string;
  delivery_date?: string;
  subtotal: number;
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
  name: string;
}

export interface Subscription {
  id: number;
  user_id?: string;
  email: string;
  status: 'active' | 'unsubscribed' | 'pending';
  subscribed_at: string;
  confirmation_token?: string;
}
