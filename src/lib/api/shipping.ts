


interface NacexResponse {
  trackingNumber: string;
  status: string;
  labelUrl: string;
}

export interface NacexTrackingEvent {
  date: string;
  time: string;
  status: string;
  place: string;
}

export interface NacexShipmentStatus {
  status: string;
  detail: string;
  date: string;
  time: string;
  code: string;
  events: NacexTrackingEvent[];
}

function nacexLabelUrl(labelUrl: string | undefined, trackingNumber: string): string {
  let url = labelUrl?.trim() || '';
  if (!url || url.startsWith('data:') || url.includes('method=get_etiqueta')) {
    url = `/api/nacex?method=get_etiqueta&codExp=${encodeURIComponent(trackingNumber)}`;
  }
  if (url.startsWith('/')) {
    url = `${window.location.origin}${url}`;
  }
  return url;
}

/**
 * Abre la etiqueta si Nacex aún la devuelve.
 * Si la expedición ya está en camino, no abre la página de error: devuelve false
 * para que el admin muestre el estado del envío.
 */
export async function openNacexLabel(labelUrl: string | undefined, trackingNumber: string): Promise<boolean> {
  const popup = window.open('', '_blank');
  if (popup) {
    popup.document.write('<p style="font-family:sans-serif">Cargando etiqueta Nacex…</p>');
    popup.document.close();
  }
  try {
    const response = await fetch(nacexLabelUrl(labelUrl, trackingNumber));
    const type = response.headers.get('content-type') || '';
    if (!response.ok || !type.includes('image')) {
      popup?.close();
      return false;
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    if (popup) {
      popup.location.href = objectUrl;
      return true;
    }
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    return true;
  } catch {
    popup?.close();
    return false;
  }
}

export const shipping = {
  openNacexLabel,

  createNacexExpedition: async (orderId: string, orderDetails?: any): Promise<NacexResponse> => {
    try {
      const response = await fetch(`/api/nacex?method=crear_envio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, ...orderDetails })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Error al crear la expedición en Nacex');
      }

      return {
        trackingNumber: data.tracking,
        status: 'Generado',
        labelUrl: data.label_url
      };
    } catch (error) {
      console.error('Error in createNacexExpedition:', error);
      throw error;
    }
  },

  getNacexStatus: async (tracking: string): Promise<NacexShipmentStatus> => {
    const response = await fetch(`/api/nacex?method=estado_envio&tracking=${encodeURIComponent(tracking)}`);
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data.error || 'No se pudo consultar el estado en Nacex.');
    }
    return {
      status: String(data.status || 'Sin estado'),
      detail: String(data.detail || ''),
      date: String(data.date || ''),
      time: String(data.time || ''),
      code: String(data.code || ''),
      events: Array.isArray(data.events) ? data.events : [],
    };
  },

  getNacexShopPoints: async (cp: string) => {
    const response = await fetch(`/api/nacex?method=get_puntos_shop&cp=${cp}`);
    return await response.json();
  }
};
