import type { FC } from 'react';
import { Truck, Store, MapPin, Clock } from 'lucide-react';

const ShippingPage: FC = () => {
  return (
    <div className="bg-accent min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-32">
        <header className="mb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] uppercase mb-6 text-secondary">
            Envíos y Entregas
          </h1>
          <div className="w-20 h-px bg-primary mx-auto" />
        </header>

        <div className="space-y-12">
          {/* Tarifa de Envíos */}
          <section className="bg-white p-12 shadow-sm border border-secondary/3 space-y-8">
            <div className="flex items-center gap-4 mb-4">
              <Truck className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">Tarifa de los envíos</h2>
            </div>
            
            <div className="space-y-6 text-secondary/80 leading-relaxed">
              <div className="p-6 bg-accent/50 border-l-4 border-primary">
                <p className="font-bold text-secondary italic text-sm">
                  Nota: No realizamos envíos fuera de la península de momento.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary">Envío Estándar</span>
                  <p className="text-secondary text-2xl font-light">5,50 € <span className="text-sm font-normal text-secondary/40">/ compra</span></p>
                  <p className="text-xs">Coste fijo por una o varias prendas.</p>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary">Envío Gratuito</span>
                  <p className="text-secondary text-2xl font-light">A partir de 50 €</p>
                  <p className="text-xs">Para todas las compras que superen este importe.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Opciones de Recogida */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-10 shadow-sm border border-secondary/3 space-y-6">
              <div className="flex items-center gap-4">
                <Store className="w-6 h-6 text-primary" />
                <h2 className="text-lg font-bold tracking-widest uppercase text-secondary">Recogida Local</h2>
              </div>
              <p className="text-secondary/80 text-sm leading-relaxed">
                Sin coste de envío recogiendo tu pedido en nuestra tienda física.
              </p>
              <div className="pt-4 space-y-1">
                <p className="text-secondary font-medium text-sm uppercase tracking-wider">Modas Me lo Merezco</p>
                <p className="text-secondary/60 text-xs">C/ Aragón, 2, L2 – Benalmádena</p>
              </div>
            </section>

            <section className="bg-white p-10 shadow-sm border border-secondary/3 space-y-6">
              <div className="flex items-center gap-4">
                <MapPin className="w-6 h-6 text-primary" />
                <h2 className="text-lg font-bold tracking-widest uppercase text-secondary">Punto Nacex</h2>
              </div>
              <p className="text-secondary/80 text-sm leading-relaxed">
                También tienes la opción de recoger tu pedido en cualquier punto de la red Nacex Shop.
              </p>
            </section>
          </div>

          {/* Tiempo de Entrega */}
          <section className="bg-secondary text-white p-12 shadow-sm space-y-6">
            <div className="flex items-center gap-4">
              <Clock className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold tracking-widest uppercase">¿Cuándo llega mi pedido?</h2>
            </div>
            <p className="text-white/80 leading-relaxed text-lg font-light">
              Dependiendo de la hora en que realices tu compra, el pedido puede tardar entre <span className="text-white font-bold">24 y 48 horas</span> laborables en llegar a su destino.
            </p>
          </section>

          <footer className="pt-12 text-center">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary/40">
              © 2026 Modas Me lo Merezco - Información de Envíos
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ShippingPage;
