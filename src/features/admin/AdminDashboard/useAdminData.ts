 
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from "@/lib/api";
import type { Product, Order, Customer } from "@/types";

export const useAdminData = (productPage: number, orderPage: number, customerPage: number, pageSize: number, searchTerm?: string, statusFilter?: boolean, isNewFilter?: boolean) => {
  const queryClient = useQueryClient();

  const { data: productsData, isLoading: loadingProducts } = useQuery<{ products: Product[], total: number }>({
    queryKey: ['admin-products', productPage, searchTerm, statusFilter, isNewFilter],
    queryFn: () => api.products.getAll(undefined, undefined, productPage, pageSize, statusFilter, searchTerm, isNewFilter)
  });
  
  const products = productsData?.products;
  const totalProducts = productsData?.total || 0;
  
  const { data: customers, isLoading: loadingCustomers } = useQuery<Customer[]>({
    queryKey: ['admin-customers', customerPage],
    queryFn: () => api.customers.getAll(customerPage, pageSize)
  });

  const { data: orders, isLoading: loadingOrders } = useQuery<Order[]>({
    queryKey: ['admin-orders', orderPage],
    queryFn: () => api.orders.getAll(orderPage, pageSize)
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => api.subscriptions.getAll(1, 1000)
  });

  return {
    products,
    totalProducts,
    loadingProducts,
    customers,
    loadingCustomers,
    orders,
    loadingOrders,
    subscriptions,
    queryClient
  };
};
