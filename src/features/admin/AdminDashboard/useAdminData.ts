
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from "@/lib/api";
import type { Product, Order, Customer } from "@/types";

export const useAdminData = (productPage: number, orderPage: number, customerPage: number, pageSize: number, searchTerm?: string, statusFilter?: boolean, isNewFilter?: boolean, customerSearch?: string) => {
  const queryClient = useQueryClient();

  const { data: productsData, isLoading: loadingProducts } = useQuery<{ products: Product[], total: number }>({
    queryKey: ['admin-products', productPage, searchTerm, statusFilter, isNewFilter],
    queryFn: () => api.products.getAll(undefined, undefined, productPage, pageSize, statusFilter, searchTerm, isNewFilter)
  });
  
  const products = productsData?.products;
  const totalProducts = productsData?.total || 0;
  
  const { data: customersData, isLoading: loadingCustomers } = useQuery<{ customers: (Customer & { is_subscribed?: boolean })[], total: number }>({
    queryKey: ['admin-customers', customerPage, customerSearch],
    queryFn: async () => {
      const res = await api.customers.getAll(customerPage, pageSize, customerSearch);
      
      // Inject subscription status (Corrected: it returns an array directly)
      const subs = await api.subscriptions.getAll();
      const activeEmails = new Set(subs.filter(s => s.status === 'active').map(s => s.email.toLowerCase()));
      
      const customersWithStatus = res.customers.map(c => ({
        ...c,
        is_subscribed: activeEmails.has(c.email.toLowerCase())
      }));
      
      return { customers: customersWithStatus, total: res.total };
    }
  });

  const customers = customersData?.customers;
  const totalCustomers = customersData?.total || 0;

  const { data: ordersData, isLoading: loadingOrders } = useQuery<{ orders: Order[], total: number }>({
    queryKey: ['admin-orders', orderPage],
    queryFn: () => api.orders.getAll(orderPage, pageSize)
  });

  const orders = ordersData?.orders;
  const totalOrders = ordersData?.total || 0;

  const { data: subscriptions } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => api.subscriptions.getAll(1, 1000)
  });

  return {
    products,
    totalProducts,
    loadingProducts,
    customers,
    totalCustomers,
    loadingCustomers,
    orders,
    totalOrders,
    loadingOrders,
    subscriptions,
    queryClient
  };
};
