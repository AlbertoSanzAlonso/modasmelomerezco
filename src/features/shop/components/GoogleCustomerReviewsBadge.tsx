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
const WRAPPER_ID = 'google-merchantwidget-iframe-wrapper';
const IFRAME_ID = 'merchantwidgetiframe';

/** Ancho mínimo del toast intro (copy ES más largo que el cálculo de Google). */
const MIN_EXPANDED_TOAST_WIDTH_PX = 400;

/**
 * El script de Google pone el iframe a ~viewport y recorta con el wrapper
 * (`overflow: hidden` + width/height vía postMessage). Si el width llega corto
 * (típico con el texto en español), el pop-up se corta a la derecha.
 */
function preventMerchantToastClipping(wrapper: HTMLElement) {
  const iframe = document.getElementById(IFRAME_ID) as HTMLIFrameElement | null;
  iframe?.style.setProperty('max-width', 'none', 'important');
  iframe?.style.setProperty('max-height', 'none', 'important');

  if (wrapper.hidden) return;

  const width = parseFloat(wrapper.style.width);
  const height = parseFloat(wrapper.style.height);
  if (!Number.isFinite(width) || !Number.isFinite(height)) return;

  // FAB colapsado (~48–64px): no tocar. Toast/panel expandido: dar holgura.
  if (height <= 70 || width < 180) return;
  if (width >= MIN_EXPANDED_TOAST_WIDTH_PX) return;

  wrapper.style.width = `${MIN_EXPANDED_TOAST_WIDTH_PX}px`;
}

/**
 * Widget / insignia de Reseñas de Clientes en Google (Merchant Center).
 * LEFT_BOTTOM para no solaparse con el chat flotante (bottom-right).
 */
export function GoogleCustomerReviewsBadge() {
  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;
    let pollId = 0;

    const watchWrapper = () => {
      const wrapper = document.getElementById(WRAPPER_ID);
      if (!wrapper || cancelled) return false;

      preventMerchantToastClipping(wrapper);
      observer = new MutationObserver(() => preventMerchantToastClipping(wrapper));
      observer.observe(wrapper, { attributes: true, attributeFilter: ['style', 'hidden'] });
      return true;
    };

    const startWidget = () => {
      if (cancelled) return;
      try {
        window.merchantwidget?.start({
          merchant_id: GOOGLE_MERCHANT_ID,
          position: 'LEFT_BOTTOM',
          region: 'ES',
          language: 'es',
        });
      } catch {
        // Ya montado tras navegación SPA: seguimos observando el wrapper existente.
      }

      if (watchWrapper()) return;
      let attempts = 0;
      pollId = window.setInterval(() => {
        attempts += 1;
        if (watchWrapper() || attempts > 40 || cancelled) {
          window.clearInterval(pollId);
        }
      }, 100);
    };

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (window.merchantwidget) {
        startWidget();
      } else {
        existing.addEventListener('load', startWidget);
      }
      return () => {
        cancelled = true;
        existing.removeEventListener('load', startWidget);
        window.clearInterval(pollId);
        observer?.disconnect();
      };
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.defer = true;
    script.addEventListener('load', startWidget);
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener('load', startWidget);
      window.clearInterval(pollId);
      observer?.disconnect();
    };
  }, []);

  return null;
}
