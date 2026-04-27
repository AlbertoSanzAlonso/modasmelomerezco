import type { FC } from 'react';
import { Cookie, Info, Settings, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const CookiesPage: FC = () => {
  return (
    <div className="bg-accent min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-32">
        <header className="mb-20 text-center">
          <h1 className="text-4xl md:text-5xl font-light tracking-[0.2em] uppercase mb-6 text-secondary">
            Política de Cookies
          </h1>
          <div className="w-20 h-px bg-primary mx-auto" />
        </header>

        <div className="space-y-12">
          {/* Introducción */}
          <section className="bg-white p-12 shadow-sm border border-secondary/3 space-y-6">
            <div className="flex items-center gap-4">
              <Cookie className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">Uso de cookies</h2>
            </div>
            <p className="text-secondary/80 leading-relaxed text-lg">
              En <span className="text-secondary font-medium">www.modasmelomerezco.es</span> utilizamos cookies para mejorar tu experiencia de navegación y garantizar el correcto funcionamiento de nuestra tienda online.
            </p>
          </section>

          {/* Qué son */}
          <section className="bg-white p-12 shadow-sm border border-secondary/3 space-y-8">
            <div className="flex items-center gap-4">
              <Info className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">¿Qué son las cookies?</h2>
            </div>
            <div className="space-y-6 text-secondary/80 leading-relaxed">
              <p>
                Las cookies son pequeños archivos de texto que se almacenan en tu navegador cuando visitas una página web. Sirven para recordar información sobre tu visita, como tus preferencias o los productos añadidos al carrito.
              </p>
              <div className="bg-accent/50 p-6 border-l-4 border-primary">
                <p className="font-bold text-secondary text-sm italic">
                  Las cookies no dañan tu dispositivo.
                </p>
              </div>
            </div>
          </section>

          {/* Tipos */}
          <section className="bg-secondary text-white p-12 shadow-sm space-y-10">
            <div className="flex items-center gap-4">
              <ShieldCheck className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold tracking-widest uppercase">¿Qué tipos de cookies usamos?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h3 className="text-primary font-bold text-xs tracking-widest uppercase">Técnicas</h3>
                <p className="text-white/70 text-sm leading-relaxed">Permiten el funcionamiento básico de la web, como el carrito de compra o el acceso seguro a tu cuenta.</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-primary font-bold text-xs tracking-widest uppercase">Análisis</h3>
                <p className="text-white/70 text-sm leading-relaxed">Nos ayudan a entender cómo interactúan los usuarios con la web para mejorarla.</p>
              </div>
              <div className="space-y-4">
                <h3 className="text-primary font-bold text-xs tracking-widest uppercase">Marketing</h3>
                <p className="text-white/70 text-sm leading-relaxed">Si se utilizan, sirven para mostrar publicidad relacionada con tus intereses.</p>
              </div>
            </div>
          </section>

          {/* Cómo gestionar */}
          <section className="bg-white p-12 shadow-sm border border-secondary/3 space-y-8">
            <div className="flex items-center gap-4">
              <Settings className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-bold tracking-widest uppercase text-secondary">Gestión de cookies</h2>
            </div>
            <div className="space-y-6 text-secondary/80 leading-relaxed">
              <p>
                Puedes configurar tu navegador para bloquear todas las cookies, permitir solo algunas o eliminar las ya almacenadas. La configuración suele encontrarse en el menú <span className="text-secondary font-medium">“Configuración”</span> o <span className="text-secondary font-medium">“Preferencias”</span> de tu navegador.
              </p>
              <div className="p-6 bg-red-50 border border-red-100 text-red-900 rounded-sm">
                <p className="text-sm">
                  Ten en cuenta que si desactivas algunas cookies, es posible que ciertas funciones de la tienda (como el carrito o el proceso de compra) no funcionen correctamente.
                </p>
              </div>
            </div>
          </section>

          {/* Más info */}
          <footer className="pt-12 border-t border-secondary/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-secondary/40">
              Última actualización: Abril 2024
            </p>
            <Link to="/politica-de-privacidad" className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary hover:underline">
              Consultar Política de Privacidad
            </Link>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default CookiesPage;
