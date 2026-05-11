import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useCartStore } from "@/store/useCartStore";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { CITIES_BY_PROVINCE } from "@/constants/locations";
import { fetchRedsysParameters, REDSYS_URL_TEST, REDSYS_URL_PROD } from "@/lib/redsys";
import type { Address } from '@/types';

export const useCheckoutForm = () => {
  const { items, total: cartTotal, clearCart, setIsCartOpen, openModal } = useCartStore();
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>(
    user?.addresses?.find(a => a.isDefault)?.shipping_address_id || (user?.addresses?.length ? user.addresses[0].shipping_address_id! : 'new')
  );
  const [saveToAccount, setSaveToAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bizum'>('card');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [shippingOption, setShippingOption] = useState<'home' | 'local' | 'nacex_point'>('home');
  const [selectedPoint, setSelectedPoint] = useState<string>('');
  const [isChangingAddress, setIsChangingAddress] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    surname: '',
    address: '',
    floor: '',
    door: '',
    stair: '',
    province: '',
    city: '',
    zip: '',
    location_id: undefined as number | undefined
  });

  const [isLocating, setIsLocating] = useState(false);

  // Zip Code Autocomplete Logic
  useEffect(() => {
    const fetchLocation = async () => {
      if (formData.zip.length === 5) {
        setIsLocating(true);
        try {
          const result = await api.locations.getByZip(formData.zip);
          if (result) {
            setFormData(prev => ({
              ...prev,
              city: result.city,
              province: result.province,
              location_id: (result as any).id
            }));
          }
        } catch (error) {
          console.error('Location fetch error:', error);
        } finally {
          setIsLocating(false);
        }
      }
    };
    fetchLocation();
  }, [formData.zip]);

  // Sync with Auth User
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({ ...prev, email: user.email, name: user.name, surname: user.surname || '' }));
      
      if (selectedAddressId !== 'new' && user.addresses) {
        const addr = user.addresses.find(a => a.shipping_address_id === selectedAddressId);
        if (addr) {
          setFormData({
            email: user.email,
            name: user.name,
            surname: user.surname || '',
            address: addr.street,
            floor: addr.floor || '',
            door: addr.door || '',
            stair: addr.stair || '',
            province: addr.province || '',
            city: addr.city,
            zip: addr.zip,
            location_id: addr.location_id
          });
        }
      }
    }
  }, [isAuthenticated, user, selectedAddressId]);

  const getShippingCost = () => {
    if (shippingOption === 'local') return 0;
    if (shippingOption === 'home') return 5.50;
    if (shippingOption === 'nacex_point') return 0;
    return 0;
  };

  const handleProvinceChange = (newProv: string) => {
    setFormData({
      ...formData,
      province: newProv,
      city: '',
      zip: '',
      location_id: undefined
    });
  };

  const handleCityChange = (newCity: string) => {
    if (newCity === 'otra') {
      setFormData({ ...formData, city: '' });
      return;
    }

    let detectedProv = formData.province;
    if (!detectedProv) {
      for (const [prov, cities] of Object.entries(CITIES_BY_PROVINCE)) {
        if ((cities as string[]).includes(newCity)) {
          detectedProv = prov;
          break;
        }
      }
    }

    setFormData({
      ...formData,
      city: newCity,
      province: detectedProv
    });
  };

  const handleTestOrder = async () => {
    setIsSubmitting(true);
    const finalTotal = cartTotal + getShippingCost();
    const orderData: any = {
      customer_id: user?.customer_id,
      subtotal: cartTotal,
      total_amount: finalTotal,
      order_status: 'Paid',
      payment_method: 'Test (Sin pago)',
      shipping_city: formData.city,
      shipping_province: formData.province,
      shipping_zip: formData.zip,
      shipping_street: formData.address,
      shipping_floor: formData.floor,
      shipping_door: formData.door,
      shipping_stair: formData.stair,
      customer_email: user?.email || formData.email,
      tax_amount: 0,
      shipping_cost: 0,
      items: items.map(item => ({ 
        product_id: item.product_id, 
        name: item.name, 
        quantity: item.quantity, 
        price: item.price,
        size: item.selectedVariant.size,
        color: item.selectedVariant.color,
        image_url: item.images?.[0] || ''
      })),
      payment_status: 'Paid',
      carrier: shippingOption === 'nacex_point' ? `Nacex Point: ${selectedPoint}` : shippingOption
    };

    try {
      const createdOrder = await api.orders.create(orderData);
      
      try {
        const targetEmail = user?.email || formData.email;
        if (targetEmail) {
          await api.mail.sendOrderConfirmation({ ...createdOrder, items: orderData.items }, targetEmail);
        }
      } catch (mailError) {
        console.error('Failed to send confirmation email:', mailError);
      }
      
      for (const item of items) {
        if (item.selectedVariant.variant_id) {
          await api.products.decrementStock(item.selectedVariant.variant_id.toString(), item.quantity);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['orders', user?.email] });
      setShowSuccessModal(true);
      clearCart();
    } catch (error) {
      console.error('Error creating test order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (shippingOption === 'nacex_point' && !selectedPoint) {
      alert('Por favor, selecciona un Punto Nacex Shop para continuar.');
      setIsSubmitting(false);
      return;
    }

    const shippingCost = getShippingCost();
    const finalTotal = cartTotal + shippingCost;
    const selectedAddress = user?.addresses?.find(a => a.shipping_address_id === selectedAddressId);
    let shippingAddressId = selectedAddress?.shipping_address_id || null;

    if (isAuthenticated && user && selectedAddressId === 'new' && saveToAccount) {
      const newAddress: Address = {
        type: `Dirección ${(user.addresses?.length || 0) + 1}`,
        street: formData.address,
        floor: formData.floor,
        door: formData.door,
        stair: formData.stair,
        province: formData.province,
        city: formData.city,
        zip: formData.zip,
        location_id: formData.location_id,
        isDefault: !user.addresses?.length
      };
      
      try {
        const updatedUser = await api.customers.update(user.customer_id, { 
          addresses: [...(user.addresses || []), newAddress], 
          surname: formData.surname 
        });
        updateUser(updatedUser);
        const savedAddr = updatedUser.addresses?.find(a => a.street === newAddress.street && a.zip === newAddress.zip);
        shippingAddressId = savedAddr?.shipping_address_id || null;
      } catch (error) {
        console.error('Error saving address:', error);
      }
    }

    const orderData: any = {
      customer_id: user?.customer_id,
      subtotal: cartTotal,
      total_amount: finalTotal,
      order_status: 'Pending',
      payment_method: paymentMethod === 'card' ? 'Redsys (Tarjeta)' : 'Redsys (Bizum)',
      carrier: shippingOption === 'nacex_point' ? `Nacex Point: ${selectedPoint}` : shippingOption,
      shipping_address_id: shippingAddressId,
      shipping_city: formData.city,
      shipping_province: formData.province,
      shipping_zip: formData.zip,
      shipping_street: formData.address,
      shipping_floor: formData.floor,
      shipping_door: formData.door,
      shipping_stair: formData.stair,
      customer_email: user?.email || formData.email,
      tax_amount: 0,
      shipping_cost: shippingCost,
      items: items.map(item => ({ 
        product_id: item.product_id, 
        name: item.name, 
        quantity: item.quantity, 
        price: item.price,
        size: item.selectedVariant.size,
        color: item.selectedVariant.color,
        image_url: item.images?.[0] || ''
      })),
      payment_status: 'pending'
    };

    try {
      const createdOrder = await api.orders.create(orderData);
      queryClient.invalidateQueries({ queryKey: ['orders', user?.email] });
      
      const redsysParams = await fetchRedsysParameters(
        createdOrder.order_id,
        finalTotal,
        {
          urlOk: `${window.location.origin}/cuenta/pedidos?payment=success`,
          urlKo: `${window.location.origin}/checkout?payment=error`,
          urlNotification: `${window.location.origin}/api/webhooks/redsys`, 
          productDescription: `Pedido #${createdOrder.order_id.split('-')[0].toUpperCase()}`,
          paymentMethod: paymentMethod
        }
      );

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = import.meta.env.PROD ? REDSYS_URL_PROD : REDSYS_URL_TEST;
      
      Object.entries(redsysParams).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });
      
      document.body.appendChild(form);
      form.submit();
      
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Hubo un error al procesar el pago.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    items,
    cartTotal,
    user,
    isAuthenticated,
    formData,
    setFormData,
    selectedAddressId,
    setSelectedAddressId,
    isChangingAddress,
    setIsChangingAddress,
    shippingOption,
    setShippingOption,
    selectedPoint,
    setSelectedPoint,
    paymentMethod,
    setPaymentMethod,
    isSubmitting,
    isLocating,
    saveToAccount,
    setSaveToAccount,
    showSuccessModal,
    setShowSuccessModal,
    shippingCost: getShippingCost(),
    finalTotal: cartTotal + getShippingCost(),
    handleProvinceChange,
    handleCityChange,
    handleSubmit,
    handleTestOrder,
    openModal
  };
};
