


interface NacexResponse {
  trackingNumber: string;
  status: string;
  labelUrl: string;
}

export const shipping = {
  createNacexExpedition: async (orderId: string): Promise<NacexResponse> => {
    // Mock simulation for Nacex integration using the orderId
    console.log(`Generando expedición para pedido: ${orderId}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          trackingNumber: `NX-${orderId.slice(0, 4)}-${Math.random().toString(36).slice(-6).toUpperCase()}`,
          status: 'Generado',
          labelUrl: '#'
        });
      }, 1000);
    });
  }
};
