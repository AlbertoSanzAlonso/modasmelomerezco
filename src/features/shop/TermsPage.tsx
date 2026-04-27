import type { FC } from 'react';

const TermsPage: FC = () => {
  return (
    <div className="bg-accent min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-32">
        <header className="mb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] uppercase mb-6 text-secondary">
            Condiciones de Venta
          </h1>
          <div className="w-20 h-px bg-primary mx-auto" />
        </header>

        <div className="prose prose-secondary max-w-none">
          <div className="bg-white p-12 md:p-20 shadow-sm border border-secondary/3 space-y-12">
            <section className="space-y-6">
              <p className="text-secondary/80 leading-relaxed">
                Las presentes Condiciones Generales regulan la compra de productos a través del sitio web: <a href="https://www.modasmelomerezco.es" className="text-primary hover:underline">www.modasmelomerezco.es</a>
              </p>
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary">Titular</span>
                  <p className="text-secondary font-medium">MODAS MELOMEREZCO, S.L.</p>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary">NIF</span>
                  <p className="text-secondary font-medium">B26691014</p>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary">Correo electrónico</span>
                  <a href="mailto:info@modasmelomerezco.es" className="text-secondary font-medium hover:text-primary transition-colors">info@modasmelomerezco.es</a>
                </div>
              </div>
              <p className="text-secondary/80 leading-relaxed italic border-l-2 border-primary/20 pl-4">
                La realización de un pedido implica la aceptación íntegra de las presentes condiciones.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">1. Objeto</h2>
              <p className="text-secondary/80 leading-relaxed">
                Las presentes condiciones regulan la venta de productos de moda ofrecidos en la tienda online.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">2. Proceso de compra</h2>
              <p className="text-secondary/80 leading-relaxed">El proceso de compra se realiza mediante:</p>
              <ul className="list-decimal pl-6 text-secondary/80 space-y-2">
                <li>Selección del producto.</li>
                <li>Añadir al carrito.</li>
                <li>Introducción de datos de facturación y envío.</li>
                <li>Confirmación y pago.</li>
              </ul>
              <p className="text-secondary/80 leading-relaxed">
                El contrato se considerará formalizado en el momento en que el cliente reciba el correo electrónico de confirmación del pedido.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">3. Precios</h2>
              <ul className="list-disc pl-6 text-secondary/80 space-y-2">
                <li>Todos los precios están indicados en euros (€).</li>
                <li>Incluyen el IVA correspondiente.</li>
                <li>Los gastos de envío se detallarán antes de finalizar la compra.</li>
              </ul>
              <p className="text-secondary/80 leading-relaxed">
                MODAS MELOMEREZCO, S.L. se reserva el derecho a modificar precios sin afectar a pedidos ya confirmados.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">4. Formas de pago</h2>
              <p className="text-secondary/80 leading-relaxed">
                El pago podrá realizarse mediante los métodos disponibles en la tienda online. El pedido no será enviado hasta la confirmación efectiva del pago.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">5. Envíos</h2>
              <p className="text-secondary/80 leading-relaxed">
                Los pedidos serán enviados a la dirección facilitada por el cliente. El plazo estimado de entrega se indica en la página de Envíos. MODAS MELOMEREZCO, S.L. no será responsable de retrasos debidos a causas ajenas o imputables al transportista.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">6. Derecho de desistimiento</h2>
              <p className="text-secondary/80 leading-relaxed">
                El cliente dispone de 14 días naturales desde la recepción del pedido para desistir del contrato sin necesidad de justificación. Para ejercer este derecho deberá comunicarlo por escrito a: <a href="mailto:info@modasmelomerezco.es" className="text-primary hover:underline">info@modasmelomerezco.es</a>.
              </p>
              <p className="text-secondary/80 leading-relaxed">El producto deberá devolverse:</p>
              <ul className="list-disc pl-6 text-secondary/80 space-y-2">
                <li>En perfecto estado.</li>
                <li>Sin usar.</li>
                <li>Con etiquetas originales.</li>
                <li>En su embalaje original.</li>
              </ul>
              <p className="text-secondary/80 leading-relaxed">
                Los gastos de devolución correrán a cargo del cliente, salvo defecto o error imputable a la empresa. El reembolso se realizará en un plazo máximo de 14 días desde la recepción del producto devuelto.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">7. Excepciones al desistimiento</h2>
              <p className="text-secondary/80 leading-relaxed">No procederá el derecho de desistimiento en productos que:</p>
              <ul className="list-disc pl-6 text-secondary/80 space-y-2">
                <li>Hayan sido usados.</li>
                <li>No conserven etiquetas originales.</li>
                <li>Hayan sido personalizados.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">8. Productos defectuosos o error en el envío</h2>
              <p className="text-secondary/80 leading-relaxed">
                Si el producto presenta defectos o no corresponde con el pedido, el cliente deberá comunicarlo en un plazo máximo de 48 horas desde su recepción. En estos casos, los gastos de devolución y nuevo envío correrán a cargo de MODAS MELOMEREZCO, S.L.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">9. Garantía legal</h2>
              <p className="text-secondary/80 leading-relaxed">
                Todos los productos están cubiertos por la garantía legal de conformidad de tres años, conforme a la normativa vigente en España.
              </p>
              <p className="text-secondary/80 leading-relaxed italic border-l-2 border-primary/20 pl-4">
                No se considerarán faltas de conformidad los daños derivados del uso indebido, desgaste normal o incorrecto mantenimiento del producto.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">10. Disponibilidad</h2>
              <p className="text-secondary/80 leading-relaxed">
                Todos los pedidos están sujetos a disponibilidad. En caso de falta de stock tras la realización del pedido, se informará al cliente y se procederá al reembolso íntegro.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">11. Resolución de litigios</h2>
              <p className="text-secondary/80 leading-relaxed">
                La Comisión Europea facilita una plataforma de resolución de litigios en línea disponible en: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">https://ec.europa.eu/consumers/odr/</a>
              </p>
            </section>

            <footer className="pt-12 border-t border-secondary/10">
              <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary/40">
                Última actualización: Abril 2024
              </p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
