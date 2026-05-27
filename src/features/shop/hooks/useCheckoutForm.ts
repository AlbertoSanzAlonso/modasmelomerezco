import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCartStore } from "@/store/useCartStore";
import { getDiscountedLineTotal } from '@/lib/cartDiscount';
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { CITIES_BY_PROVINCE } from "@/constants/locations";
import { fetchRedsysParameters, REDSYS_URL_TEST, REDSYS_URL_PROD } from "@/lib/redsys";
import type { Address } from '@/types';

export const useCheckoutForm = () => {
  const {
    items,
    subtotal: cartSubtotal,
    discountAmount,
    total: cartTotal,
    appliedDiscount,
    openModal,
  } = useCartStore();

  const mapOrderItems = () =>
    items.map((item) => {
      const line = getDiscountedLineTotal(item, appliedDiscount);
      const unitOriginal = item.price;
      const lineDiscount = line.hasDiscount
        ? Math.round((line.original - line.discounted) * 100) / 100
        : 0;
      const unitFinal = Math.round((line.discounted / item.quantity) * 100) / 100;
      return {
        product_id: item.product_id,
        name: item.name,
        quantity: item.quantity,
        unit_price_original: unitOriginal,
        price: unitFinal,
        line_discount: lineDiscount,
        size: item.selectedVariant.size,
        color: item.selectedVariant.color ?? null,
        variant_id: item.selectedVariant.variant_id,
        image_url: item.images?.[0] || '',
      };
    });
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const [selectedAddressId, setSelectedAddressId] = useState<number | 'new'>(
    user?.addresses?.find(a => a.isDefault)?.shipping_address_id || (user?.addresses?.length ? user.addresses[0].shipping_address_id! : 'new')
  );
  const [saveToAccount, setSaveToAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bizum'>('card');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [shippingOption, setShippingOption] = useState<'home' | 'local' | 'nacex_point'>('home');
  const [selectedNacexPoint, setSelectedNacexPoint] = useState<any>(null);
  const [isChangingAddress, setIsChangingAddress] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
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
  const [zipMunicipalities, setZipMunicipalities] = useState<string[]>([]);

  // Zip Code Autocomplete Logic
  useEffect(() => {
    const fetchLocation = async () => {
      if (formData.zip.length !== 5) {
        setZipMunicipalities([]);
        return;
      }
      setIsLocating(true);
      try {
        const result = await api.locations.getByZip(formData.zip);
        if (result) {
          const municipalities =
            result.municipalities?.length
              ? result.municipalities
              : result.city
                ? [result.city]
                : [];
          setZipMunicipalities(municipalities);
          setFormData((prev) => ({
            ...prev,
            province: result.province || prev.province,
            location_id: result.id,
            city:
              municipalities.length === 1
                ? municipalities[0]
                : municipalities.includes(prev.city)
                  ? prev.city
                  : '',
          }));
        } else {
          setZipMunicipalities([]);
        }
      } catch (error) {
        console.error('Location fetch error:', error);
        setZipMunicipalities([]);
      } finally {
        setIsLocating(false);
      }
    };
    fetchLocation();
  }, [formData.zip]);

  // Sync with Auth User
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        email: user.email,
        phone: user.phone || prev.phone,
        name: user.name,
        surname: user.surname || '',
      }));
      
      if (selectedAddressId !== 'new' && user.addresses) {
        const addr = user.addresses.find(a => a.shipping_address_id === selectedAddressId);
        if (addr) {
          setFormData({
            email: user.email,
            phone: user.phone || '',
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
    setZipMunicipalities([]);
    setFormData({
      ...formData,
      province: newProv,
      city: '',
      zip: '',
      location_id: undefined
    });
  };

  const handleCityChange = (newCity: string) => {
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

  const validateCheckoutContact = (): boolean => {
    if (!isAuthenticated) {
      if (!formData.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        openModal({
          title: 'Email obligatorio',
          message: 'Indica un email válido para confirmar el pedido y el envío.',
          type: 'warning',
        });
        return false;
      }
      if (!formData.name?.trim()) {
        openModal({ title: 'Nombre obligatorio', message: 'Indica tu nombre.', type: 'warning' });
        return false;
      }
      const phoneDigits = (formData.phone || '').replace(/\D/g, '');
      if (phoneDigits.length < 9) {
        openModal({
          title: 'Teléfono obligatorio',
          message: 'Indica un teléfono de contacto (mínimo 9 dígitos) para el envío.',
          type: 'warning',
        });
        return false;
      }
    }
    return true;
  };

  const guestContactFields = () =>
    !isAuthenticated
      ? {
          guest_name: formData.name.trim(),
          guest_surname: formData.surname.trim(),
          guest_phone: formData.phone.replace(/\D/g, ''),
        }
      : {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCheckoutContact()) return;
    setIsSubmitting(true);
    if (shippingOption === 'nacex_point' && !selectedNacexPoint) {
      openModal({
        title: 'Selecciona un Punto Nacex',
        message: 'Por favor, selecciona un Punto Nacex Shop para continuar con el pedido.',
        type: 'warning'
      });
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
      subtotal: cartSubtotal,
      discount_amount: discountAmount,
      discount_code: appliedDiscount?.code ?? null,
      total_amount: finalTotal,
      order_status: 'Pending',
      payment_method: paymentMethod === 'card' ? 'Redsys (Tarjeta)' : 'Redsys (Bizum)',
      carrier: shippingOption === 'nacex_point' && selectedNacexPoint 
        ? `Nacex Point: ${selectedNacexPoint.name} (${selectedNacexPoint.address})` 
        : shippingOption,
      shipping_address_id: shippingAddressId,
      shipping_city: formData.city,
      shipping_province: formData.province,
      shipping_zip: formData.zip,
      shipping_street: formData.address,
      shipping_floor: formData.floor,
      shipping_door: formData.door,
      shipping_stair: formData.stair,
      customer_email: user?.email || formData.email.trim(),
      ...guestContactFields(),
      tax_amount: 0,
      shipping_cost: shippingCost,
      items: mapOrderItems(),
      payment_status: 'pending',
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
      openModal({
        title: 'Error en el pago',
        message: 'Hubo un error al procesar el pago. Por favor, inténtalo de nuevo.',
        type: 'warning'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    items,
    cartTotal,
    cartSubtotal,
    discountAmount,
    appliedDiscount,
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
    selectedPoint: selectedNacexPoint?.name || '',
    selectedNacexPoint,
    setSelectedNacexPoint,
    paymentMethod,
    setPaymentMethod,
    isSubmitting,
    isLocating,
    zipMunicipalities,
    saveToAccount,
    setSaveToAccount,
    showSuccessModal,
    setShowSuccessModal,
    shippingCost: getShippingCost(),
    finalTotal: cartTotal + getShippingCost(),
    handleProvinceChange,
    handleCityChange,
    handleSubmit,
    openModal
  };
};
