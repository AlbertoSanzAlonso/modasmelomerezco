
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from "@/lib/api";
import type { Product, Order, Customer } from "@/types";

export const useAdminData = (productPage: number, orderPage: number, customerPage: number, pageSize: number) => {
  const queryClient = useQueryClient();

  const { data: products, isLoading: loadingProducts } = useQuery<Product[]>({
    queryKey: ['admin-products', productPage],
    queryFn: () => api.products.getAll(undefined, undefined, productPage, pageSize)
  });
  
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
    loadingProducts,
    customers,
    loadingCustomers,
    orders,
    loadingOrders,
    subscriptions,
    queryClient
  };
};
