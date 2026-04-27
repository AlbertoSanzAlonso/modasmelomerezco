import type { FC } from 'react';

const PrivacyPolicyPage: FC = () => {
  return (
    <div className="bg-accent min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-32">
        <header className="mb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] uppercase mb-6 text-secondary">
            Política de Privacidad
          </h1>
          <div className="w-20 h-px bg-primary mx-auto" />
        </header>

        <div className="prose prose-secondary max-w-none">
          <div className="bg-white p-12 md:p-20 shadow-sm border border-secondary/3 space-y-12">
            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">1. Información al usuario</h2>
              <p className="text-secondary/80 leading-relaxed">
                MODAS MELOMEREZCO, S.L., como Responsable del Tratamiento, le informa que, según lo dispuesto en el Reglamento (UE) 2016/679 (RGPD) y la L.O. 3/2018 (LOPDGDD), trataremos sus datos tal y como reflejamos en la presente Política de Privacidad.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">2. Finalidad del tratamiento</h2>
              <p className="text-secondary/80 leading-relaxed">
                Tratamos sus datos personales para las siguientes finalidades:
              </p>
              <ul className="list-disc pl-6 text-secondary/80 space-y-2">
                <li>Gestionar la relación comercial (pedidos, facturación, envíos).</li>
                <li>Responder a consultas o solicitudes de información.</li>
                <li>Envío de comunicaciones comerciales si ha otorgado su consentimiento.</li>
              </ul>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">3. Legitimación</h2>
              <p className="text-secondary/80 leading-relaxed">
                La base legal para el tratamiento de sus datos es la ejecución del contrato de compraventa y su consentimiento explícito para comunicaciones comerciales.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">4. Conservación de datos</h2>
              <p className="text-secondary/80 leading-relaxed">
                Se conservarán durante no más tiempo del necesario para mantener el fin del tratamiento o mientras existan prescripciones legales que dictaminen su custodia.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">5. Derechos</h2>
              <p className="text-secondary/80 leading-relaxed">
                Usted puede ejercer sus derechos de acceso, rectificación, portabilidad, supresión, limitación y oposición enviando un correo electrónico a <a href="mailto:info@modasmelomerezco.es" className="text-primary hover:underline">info@modasmelomerezco.es</a>.
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

export default PrivacyPolicyPage;
