


interface NacexResponse {
  trackingNumber: string;
  status: string;
  labelUrl: string;
}

/** Abre la etiqueta Nacex en una pestaña (URL relativa o absoluta). */
export function openNacexLabel(labelUrl: string | undefined, trackingNumber: string): void {
  let url = labelUrl?.trim() || '';
  if (!url || url.startsWith('data:')) {
    url = `/api/nacex?method=get_etiqueta&codExp=${encodeURIComponent(trackingNumber)}`;
  }
  if (url.startsWith('/')) {
    url = `${window.location.origin}${url}`;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
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

  getNacexStatus: async (tracking: string) => {
    const response = await fetch(`/api/nacex?method=estado_envio&tracking=${tracking}`);
    return await response.json();
  },

  getNacexShopPoints: async (cp: string) => {
    const response = await fetch(`/api/nacex?method=get_puntos_shop&cp=${cp}`);
    return await response.json();
  }
};
