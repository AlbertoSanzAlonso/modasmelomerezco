import type { FC } from 'react';

const AvisoLegalPage: FC = () => {
  return (
    <div className="bg-accent min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-32">
        <header className="mb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] uppercase mb-6 text-secondary">
            Aviso Legal
          </h1>
          <div className="w-20 h-px bg-primary mx-auto" />
        </header>

        <div className="prose prose-secondary max-w-none">
          <div className="bg-white p-12 md:p-20 shadow-sm border border-secondary/[0.03] space-y-12">
            <section>
              <p className="text-secondary/80 leading-relaxed text-lg">
                En cumplimiento con el deber de información recogido en la Ley 34/2002, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se facilitan a continuación los siguientes datos:
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
                <div className="space-y-2">
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary">Sitio web</span>
                  <a href="https://www.modasmelomerezco.es" className="text-secondary font-medium hover:text-primary transition-colors">www.modasmelomerezco.es</a>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-[0.1em] uppercase text-secondary">1. Objeto</h2>
              <p className="text-secondary/80 leading-relaxed">
                El presente Aviso Legal regula el acceso y uso del sitio web <a href="https://www.modasmelomerezco.es" className="text-primary hover:underline">https://www.modasmelomerezco.es</a>, cuyo titular es MODAS MELOMEREZCO, S.L.
              </p>
              <p className="text-secondary/80 leading-relaxed">
                La navegación por el sitio web atribuye la condición de usuario e implica la aceptación plena y sin reservas de todas las disposiciones incluidas en este Aviso Legal.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-[0.1em] uppercase text-secondary">2. Propiedad intelectual e industrial</h2>
              <p className="text-secondary/80 leading-relaxed">
                Todos los contenidos del sitio web (textos, imágenes, diseños, logotipos, estructura, código fuente, etc.) son titularidad de MODAS MELOMEREZCO, S.L. o dispone de los derechos necesarios para su uso.
              </p>
              <p className="text-secondary/80 leading-relaxed font-medium">
                Queda prohibida su reproducción, distribución o comunicación pública sin autorización expresa.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-[0.1em] uppercase text-secondary">3. Responsabilidad</h2>
              <p className="text-secondary/80 leading-relaxed">
                MODAS MELOMEREZCO, S.L. no se hace responsable de los daños derivados del uso indebido del sitio web ni de posibles errores técnicos o interrupciones del servicio.
              </p>
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-bold tracking-[0.1em] uppercase text-secondary">4. Legislación aplicable</h2>
              <p className="text-secondary/80 leading-relaxed">
                La relación entre el usuario y el titular se regirá por la normativa española vigente.
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

export default AvisoLegalPage;
