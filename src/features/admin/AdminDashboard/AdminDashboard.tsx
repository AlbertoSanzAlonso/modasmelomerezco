
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AdminLayout } from "@/features/admin/AdminLayout";
import { ProductModal } from "@/features/admin/ProductModal/ProductModal";
import { OverviewTab } from "@/features/admin/AdminDashboard/components/OverviewTab";
import { ProductsTab } from "@/features/admin/AdminDashboard/components/ProductsTab";
import { OrdersTab } from "@/features/admin/AdminDashboard/components/OrdersTab";
import { NewsletterTab } from "@/features/admin/AdminDashboard/components/NewsletterTab";
import { CustomersTab } from "@/features/admin/AdminDashboard/components/CustomersTab";
import { OrderDetailsModal } from "@/features/admin/AdminDashboard/components/OrderDetailsModal";
import { useAdminData } from './useAdminData';
import { api } from "@/lib/api";
import { useCartStore } from "@/store/useCartStore";
import type { Product, Order } from "@/types";

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'customers' | 'newsletter'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState({ number: '', carrier: 'NACEX' });
  
  // Pagination and Selection
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [customerPage, setCustomerPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const pageSize = 10;

  // Newsletter state
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterContent, setNewsletterContent] = useState('');
  const [isSendingNewsletter, setIsSendingNewsletter] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0 });

  const {
    products,
    customers,
    orders,
    subscriptions,
    queryClient
  } = useAdminData(productPage, orderPage, customerPage, pageSize, productSearch);

  const openModal = useCartStore((state) => state.openModal);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (data: Partial<Product>) => {
      if (editingProduct) return api.products.update(editingProduct.product_id, data);
      return api.products.create(data as Omit<Product, 'product_id'>);
    },
    onSuccess: (product: Product) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['new-arrivals'] });
      setIsModalOpen(false);
      const isNew = !editingProduct;
      setEditingProduct(null);

      if (isNew) {
        openModal({
          title: '¡Producto Creado!',
          message: `El producto "${product.name}" se ha creado correctamente. ¿Cómo quieres proceder?`,
          type: 'product_created',
          actionLabel: 'Publicar y Ver',
          onAction: async () => {
            await api.products.update(product.product_id, { is_published: true });
            window.open(`/producto/${product.product_id}`, '_blank');
          },
          secondaryActionLabel: 'Dejar en Borrador',
          onSecondaryAction: async () => {
            await api.products.update(product.product_id, { is_published: false });
          }
        });
      } else {
        openModal({
          title: '¡Producto Actualizado!',
          message: `Los cambios en "${product.name}" se han guardado correctamente.`,
          type: 'success',
          actionLabel: 'Ver el producto',
          onAction: () => {
            window.open(`/producto/${product.product_id}`, '_blank');
          }
        });
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (product: Product) => {
      if (product.images?.length) {
        await Promise.allSettled(product.images.map((url) => api.storage.delete(url)));
      }
      return api.products.delete(product.product_id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      openModal({ title: 'Éxito', message: 'Producto eliminado correctamente.', type: 'info' });
    }
  });

  const togglePublishMutation = useMutation({
    mutationFn: (product: Product) => api.products.update(product.product_id, { is_published: !product.is_published }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-products'] })
  });

  // Handlers
  const handleBulkStatusChange = async (is_published: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map(id => api.products.update(id, { is_published })));
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setSelectedIds([]);
      openModal({ title: 'Éxito', message: 'Estado actualizado correctamente.', type: 'info' });
    } catch (err) {
      openModal({ title: 'Error', message: 'Error al actualizar el estado.', type: 'warning' });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    openModal({
      title: 'Eliminar Selección',
      message: `¿Estás seguro de que quieres eliminar ${selectedIds.length} productos?`,
      type: 'confirm',
      onConfirm: async () => {
        const productsToDelete = products?.filter(p => selectedIds.includes(p.product_id)) || [];
        await Promise.all(productsToDelete.map(async (p) => {
          if (p.images?.length) await Promise.allSettled(p.images.map(u => api.storage.delete(u)));
          return api.products.delete(p.product_id);
        }));
        queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        setSelectedIds([]);
        openModal({ title: 'Éxito', message: 'Productos eliminados.', type: 'info' });
      }
    });
  };

  const handleGenerateLabel = async (orderId: string) => {
    try {
      const res = await api.shipping.createNacexExpedition(orderId);
      openModal({
        title: 'Expedición NACEX',
        message: `Expedición generada: ${res.trackingNumber}`,
        type: 'success'
      });
    } catch (err) {
      openModal({ title: 'Error', message: 'No se pudo generar la etiqueta.', type: 'warning' });
    }
  };

  const handleSendNewsletter = async () => {
    const activeSubs = subscriptions?.filter(s => s.status === 'active') || [];
    if (activeSubs.length === 0) return;

    openModal({
      title: 'Confirmar Envío',
      message: `¿Enviar a ${activeSubs.length} suscriptores?`,
      type: 'action',
      onAction: async () => {
        setIsSendingNewsletter(true);
        setSendingProgress({ current: 0, total: activeSubs.length });
        for (const sub of activeSubs) {
          try {
            await api.mail.sendNewsletter(sub.email, newsletterSubject, newsletterContent, window.location.origin);
          } catch (err) {
            console.error(err);
          }
          setSendingProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }
        setIsSendingNewsletter(false);
        openModal({ title: 'Éxito', message: 'Newsletter enviada.', type: 'info' });
        setNewsletterContent('');
        setNewsletterSubject('');
      }
    });
  };

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      <div className="animate-fade-in">
        {activeTab === 'dashboard' && (
          <OverviewTab 
            orders={orders} 
            products={products} 
            onViewAllOrders={() => setActiveTab('orders')} 
            onOrderClick={(order) => { setSelectedOrder(order); setShowOrderDetails(true); }}
            onEditProduct={(product) => { setEditingProduct(product); setIsModalOpen(true); }}
          />
        )}
        
        {activeTab === 'products' && (
          <ProductsTab 
            products={products}
            selectedIds={selectedIds}
            productPage={productPage}
            pageSize={pageSize}
            searchTerm={productSearch}
            onSearchChange={setProductSearch}
            onPageChange={setProductPage}
            onToggleSelectAll={() => setSelectedIds(selectedIds.length === products?.length ? [] : products?.map(p => p.product_id) || [])}
            onToggleSelect={(id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
            onBulkStatusChange={handleBulkStatusChange}
            onBulkDelete={handleBulkDelete}
            onTogglePublish={(p) => togglePublishMutation.mutate(p)}
            onEdit={(p) => { setEditingProduct(p); setIsModalOpen(true); }}
            onDelete={(p) => {
              openModal({
                title: 'Eliminar Producto',
                message: `¿Borrar "${p.name}"?`,
                type: 'confirm',
                onConfirm: () => deleteMutation.mutate(p)
              });
            }}
            onCreate={() => { setEditingProduct(null); setIsModalOpen(true); }}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersTab 
            orders={orders}
            orderPage={orderPage}
            pageSize={pageSize}
            onPageChange={setOrderPage}
            onOrderClick={(order) => { setSelectedOrder(order); setShowOrderDetails(true); }}
            onGenerateLabel={handleGenerateLabel}
          />
        )}

        {activeTab === 'newsletter' && (
          <NewsletterTab 
            subscriptions={subscriptions}
            newsletterSubject={newsletterSubject}
            newsletterContent={newsletterContent}
            isSendingNewsletter={isSendingNewsletter}
            sendingProgress={sendingProgress}
            onSubjectChange={setNewsletterSubject}
            onContentChange={setNewsletterContent}
            onSend={handleSendNewsletter}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersTab 
            customers={customers}
            customerPage={customerPage}
            pageSize={pageSize}
            onPageChange={setCustomerPage}
            onCreate={() => {
              const name = prompt('Nombre:');
              const surname = prompt('Apellidos:');
              const email = prompt('Email:');
              const password = prompt('Password:');
              if (name && surname && email && password) {
                api.customers.create({ name, surname, email, password }).then(() => {
                  queryClient.invalidateQueries({ queryKey: ['admin-customers'] });
                });
              }
            }}
          />
        )}
      </div>

      {isModalOpen && (
        <ProductModal 
          product={editingProduct} 
          onClose={() => setIsModalOpen(false)} 
          onSave={(data) => saveMutation.mutate(data)} 
        />
      )}

      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder}
          trackingInfo={trackingInfo}
          onClose={() => setShowOrderDetails(false)}
          onUpdateTracking={(number, carrier) => setTrackingInfo({ number, carrier })}
          onGenerateLabel={handleGenerateLabel}
        />
      )}
    </AdminLayout>
  );
};
