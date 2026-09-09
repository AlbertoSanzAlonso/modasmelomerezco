/** Opt-in de Reseñas de Clientes en Google (Merchant Center). */

export const GOOGLE_MERCHANT_ID = 5847937320;

const STORAGE_KEY = 'google_customer_reviews_optin';

export type GoogleCustomerReviewsPending = {
  orderId: string;
  email: string;
};

export function saveGoogleCustomerReviewsPending(data: GoogleCustomerReviewsPending): void {
  try {
    const email = data.email.trim().toLowerCase();
    const orderId = data.orderId.trim();
    if (!email || !orderId || !email.includes('@')) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ orderId, email }));
  } catch {
    // sessionStorage puede fallar en modo privado estricto; el opt-in simplemente no se muestra
  }
}

export function consumeGoogleCustomerReviewsPending(
  expectedOrderId?: string | null
): GoogleCustomerReviewsPending | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<GoogleCustomerReviewsPending>;
    const orderId = typeof parsed.orderId === 'string' ? parsed.orderId.trim() : '';
    const email = typeof parsed.email === 'string' ? parsed.email.trim().toLowerCase() : '';

    if (!orderId || !email || !email.includes('@')) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (expectedOrderId && expectedOrderId !== orderId) {
      // Otro intento de pago en la misma pestaña: no mezclar datos.
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }

    sessionStorage.removeItem(STORAGE_KEY);
    return { orderId, email };
  } catch {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

/** Suma días laborables (lun–vie), alineado con envío 24/48h. */
export function addBusinessDays(from: Date, days: number): Date {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return d;
}

export function formatDateYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Fecha estimada de entrega: +2 días laborables (48h). */
export function getEstimatedDeliveryDateYmd(from: Date = new Date()): string {
  return formatDateYmd(addBusinessDays(from, 2));
}
