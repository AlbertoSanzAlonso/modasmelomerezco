import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/Button";

// Hooks
import { useCheckoutForm } from './hooks/useCheckoutForm';

// Components
import { CheckoutSummary } from './components/CheckoutSummary';
import { ShippingMethodSelector } from './components/ShippingMethodSelector';
import { PaymentMethodSelector } from './components/PaymentMethodSelector';
import { CheckoutAddressForm } from './components/CheckoutAddressForm';
import { CheckoutAddressSelector } from './components/checkout/CheckoutAddressSelector';
import { CheckoutSuccessModal } from './components/checkout/CheckoutSuccessModal';
import { CheckoutLoginPrompt } from './components/checkout/CheckoutLoginPrompt';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const {
    items,
    cartTotal,
    cartSubtotal,
    discountAmount,
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
    selectedNacexPoint,
    setSelectedNacexPoint,
    paymentMethod,
    setPaymentMethod,
    isSubmitting,
    isLocating,
    saveToAccount,
    setSaveToAccount,
    showSuccessModal,
    shippingCost,
    finalTotal,
    handleProvinceChange,
    handleCityChange,
    handleSubmit,
    handleTestOrder,
    openModal
  } = useCheckoutForm();

  // Redsys Error Notification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'error') {
      openModal({
        title: 'Error en el pago',
        message: 'No se pudo completar la transacción. Por favor, inténtalo de nuevo con otro método o revisa los datos.',
        type: 'warning'
      });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [openModal]);

  return (
    <div className="bg-accent min-h-screen pt-12 pb-32 text-secondary">
      <CheckoutSuccessModal show={showSuccessModal} onNavigate={navigate} />

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <h1 className="text-5xl font-black tracking-tighter uppercase italic mb-16">Finalizar Pedido</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-7">
            {!isAuthenticated && <CheckoutLoginPrompt />}

            {isAuthenticated && user?.addresses && user.addresses.length > 0 && (
              <CheckoutAddressSelector 
                addresses={user.addresses}
                selectedAddressId={selectedAddressId}
                onSelect={setSelectedAddressId}
                isChanging={isChangingAddress}
                setIsChanging={setIsChangingAddress}
              />
            )}

            <form onSubmit={handleSubmit} className="space-y-12">
              <ShippingMethodSelector 
                selectedOption={shippingOption} 
                onSelect={setShippingOption} 
                selectedPoint={selectedPoint}
                onPointSelect={setSelectedNacexPoint}
                zipCode={formData.zip}
              />

              {(selectedAddressId === 'new' || !user?.addresses?.length) && (
                <CheckoutAddressForm 
                  formData={formData}
                  setFormData={setFormData}
                  isLocating={isLocating}
                  onProvinceChange={handleProvinceChange}
                  onCityChange={handleCityChange}
                  isAuthenticated={isAuthenticated}
                  saveToAccount={saveToAccount}
                  setSaveToAccount={setSaveToAccount}
                  hasAddresses={!!user?.addresses?.length}
                />
              )}

              <PaymentMethodSelector 
                selectedMethod={paymentMethod} 
                onSelect={setPaymentMethod} 
              />

              <div className="space-y-4">
                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full py-6 text-base font-black tracking-[0.2em] uppercase italic">
                  {isSubmitting ? 'Procesando...' : `PAGAR ${finalTotal.toFixed(2)}€`}
                </Button>
                <button type="button" onClick={handleTestOrder} disabled={isSubmitting} className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-primary transition-colors border border-dashed border-gray-300 rounded-2xl">
                  TEST: FINALIZAR PEDIDO (SIN PAGO)
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5">
            <CheckoutSummary 
              items={items}
              cartSubtotal={cartSubtotal}
              discountAmount={discountAmount}
              cartTotal={cartTotal}
              shippingCost={shippingCost}
              finalTotal={finalTotal}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
