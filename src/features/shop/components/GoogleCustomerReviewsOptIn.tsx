import { useEffect } from 'react';
import {
  GOOGLE_MERCHANT_ID,
  getEstimatedDeliveryDateYmd,
} from '@/lib/googleCustomerReviews';

declare global {
  interface Window {
    gapi?: {
      load: (name: string, callback: () => void) => void;
      surveyoptin?: {
        render: (options: Record<string, unknown>) => void;
      };
    };
    renderOptIn?: () => void;
  }
}

const PLATFORM_JS = 'https://apis.google.com/js/platform.js?onload=renderOptIn';

type GoogleCustomerReviewsOptInProps = {
  orderId: string;
  email: string;
  deliveryCountry?: string;
};

/**
 * Monta el opt-in de Reseñas de Clientes en Google en la página de confirmación.
 * No afecta al pago: si el script falla, el pedido ya está confirmado.
 */
export function GoogleCustomerReviewsOptIn({
  orderId,
  email,
  deliveryCountry = 'ES',
}: GoogleCustomerReviewsOptInProps) {
  useEffect(() => {
    const estimatedDeliveryDate = getEstimatedDeliveryDateYmd();

    window.renderOptIn = () => {
      if (!window.gapi?.load) return;
      window.gapi.load('surveyoptin', () => {
        window.gapi?.surveyoptin?.render({
          merchant_id: GOOGLE_MERCHANT_ID,
          order_id: orderId,
          email,
          delivery_country: deliveryCountry,
          estimated_delivery_date: estimatedDeliveryDate,
        });
      });
    };

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="https://apis.google.com/js/platform.js"]`
    );

    if (existing) {
      if (window.gapi) {
        window.renderOptIn();
      }
      return () => {
        delete window.renderOptIn;
      };
    }

    const script = document.createElement('script');
    script.src = PLATFORM_JS;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      delete window.renderOptIn;
    };
  }, [orderId, email, deliveryCountry]);

  return null;
}
