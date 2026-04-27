import type { FC } from 'react';
import { RefreshCcw, ClipboardList, Package, CreditCard, AlertCircle } from 'lucide-react';

const ReturnsPage: FC = () => {
  return (
    <div className="bg-accent min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-32">
        <header className="mb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] uppercase mb-6 text-secondary">
            Devoluciones y Cambios
          </h1>
          <div className="w-20 h-px bg-primary mx-auto" />
        </header>

        <div className="space-y-12">
          {/* Plazo de devolución */}
          <section className="bg-white p-12 shadow-sm border border-secondary/3 space-y-8">
            <div className="flex items-center gap-4">
              <RefreshCcw className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">Plazo de devolución</h2>
            </div>
            <div className="prose prose-secondary max-w-none space-y-6 text-secondary/80 leading-relaxed">
              <p className="text-lg">
                De acuerdo con la normativa vigente, dispones de <span className="text-secondary font-bold">14 días naturales</span> desde la recepción del pedido para solicitar la devolución de uno o varios artículos.
              </p>
              <div className="bg-accent/50 p-6 border-l-4 border-primary space-y-4">
                <p className="font-medium text-secondary">Requisitos para la aceptación:</p>
                <ul className="list-disc pl-6 space-y-2 text-sm">
                  <li>Perfectas condiciones y sin usar.</li>
                  <li>Todas sus etiquetas originales.</li>
                  <li>Embalaje original o equivalente.</li>
                  <li>Sin signos de lavado, manchas, olores o daños.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Cómo solicitar */}
          <section className="bg-secondary text-white p-12 shadow-sm space-y-8">
            <div className="flex items-center gap-4">
              <ClipboardList className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold tracking-widest uppercase">Cómo solicitar una devolución o cambio</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <p className="text-white/80 leading-relaxed">
                  Puedes gestionarlo fácilmente desde tu área personal:
                </p>
                <ol className="list-decimal pl-6 space-y-4 text-white/70 text-sm">
                  <li>Accede a <span className="text-white font-medium">“Mi cuenta”</span>.</li>
                  <li>Entra en <span className="text-white font-medium">“Pedidos”</span>.</li>
                  <li>Localiza el formulario de devolución debajo del listado.</li>
                  <li>Rellena los datos indicando el pedido y motivo.</li>
                </ol>
              </div>
              <div className="bg-white/5 p-8 border border-white/10 flex flex-col justify-center">
                <p className="text-sm italic text-white/60">
                  "Una vez recibida tu solicitud, nos pondremos en contacto contigo lo antes posible para indicarte los siguientes pasos."
                </p>
              </div>
            </div>
          </section>

          {/* Detalles del proceso */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="bg-white p-10 shadow-sm border border-secondary/3 space-y-6">
              <div className="flex items-center gap-4">
                <Package className="w-6 h-6 text-primary" />
                <h2 className="text-lg font-bold tracking-widest uppercase text-secondary">Envío y Gastos</h2>
              </div>
              <p className="text-secondary/80 text-sm leading-relaxed">
                Los artículos deberán enviarse debidamente protegidos. Los gastos de recogida o envío de la devolución correrán a cargo del cliente, salvo en caso de producto defectuoso.
              </p>
            </section>

            <section className="bg-white p-10 shadow-sm border border-secondary/3 space-y-6">
              <div className="flex items-center gap-4">
                <CreditCard className="w-6 h-6 text-primary" />
                <h2 className="text-lg font-bold tracking-widest uppercase text-secondary">Reembolsos</h2>
              </div>
              <p className="text-secondary/80 text-sm leading-relaxed">
                Realizaremos el reembolso utilizando el mismo método de pago empleado en la compra. Los gastos de envío originales no serán reembolsados.
              </p>
            </section>
          </div>

          {/* Aviso Importante */}
          <section className="bg-white p-12 shadow-sm border border-secondary/3 border-t-4 border-t-primary space-y-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">Condiciones de los artículos</h2>
            </div>
            <p className="text-secondary/80 leading-relaxed text-sm">
              MODAS ME LO MEREZCO se reserva el derecho de rechazar devoluciones de prendas que presenten signos de uso, manchas, olores, daños o cualquier deterioro, así como aquellas que no conserven sus etiquetas originales.
            </p>
            <p className="text-secondary/80 leading-relaxed text-sm">
              En caso de rechazo, el artículo podrá ser enviado nuevamente al cliente, asumiendo este último los gastos de envío correspondientes.
            </p>
          </section>

          <footer className="pt-12 text-center">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary/40">
              © 2026 Modas Me lo Merezco - Devoluciones y Cambios
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ReturnsPage;
