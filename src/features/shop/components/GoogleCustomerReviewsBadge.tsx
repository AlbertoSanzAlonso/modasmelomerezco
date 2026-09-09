import { useEffect } from 'react';
import { GOOGLE_MERCHANT_ID } from '@/lib/googleCustomerReviews';

declare global {
  interface Window {
    merchantwidget?: {
      start: (options: Record<string, unknown>) => void;
    };
  }
}

const SCRIPT_ID = 'merchantWidgetScript';
const SCRIPT_SRC = 'https://www.gstatic.com/shopping/merchant/merchantwidget.js';

/**
 * Widget / insignia de Reseñas de Clientes en Google (Merchant Center).
 * LEFT_BOTTOM para no solaparse con el chat flotante (bottom-right).
 */
export function GoogleCustomerReviewsBadge() {
  useEffect(() => {
    const startWidget = () => {
      window.merchantwidget?.start({
        merchant_id: GOOGLE_MERCHANT_ID,
        position: 'LEFT_BOTTOM',
        region: 'ES',
      });
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.merchantwidget) {
        startWidget();
      } else {
        existing.addEventListener('load', startWidget);
      }
      return () => {
        existing.removeEventListener('load', startWidget);
      };
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.defer = true;
    script.addEventListener('load', startWidget);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', startWidget);
    };
  }, []);

  return null;
}
