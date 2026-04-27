import { type FC } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MessageCircle, CreditCard, Truck } from 'lucide-react';

export const Footer: FC = () => {
  return (
    <>
      {/* Trust Bar Section */}
      <section className="bg-accent-dark py-20 border-t border-secondary/[0.03]">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-20">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-secondary">¿Dudas?</h3>
                <p className="text-sm text-secondary/60">Escríbenos a <br /><span className="font-bold text-secondary">info@modasmelomerezco.es</span></p>
              </div>
            </div>
            
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Pago Seguro</h3>
                <p className="text-sm text-secondary/60">Aceptamos <br /><span className="font-bold text-secondary">Tarjeta o Bizum</span></p>
              </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-secondary">Envío Gratuito</h3>
                <p className="text-sm text-secondary/60">Por compras <br /><span className="font-bold text-secondary">superiores a 50 €</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-32 border-t border-secondary/[0.03] bg-primary text-white">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-20 mb-24">
            <div className="col-span-1 flex flex-col items-center lg:items-start text-center lg:text-left">
              <Link to="/" className="group block mb-10 w-full">
                <img src="/assets/logo/logo-completo-blanco.svg" alt="Logo" className="h-56 w-auto object-contain opacity-100 transition-opacity mx-auto md:mx-0" />
              </Link>
              <p className="text-white/80 text-sm leading-relaxed max-w-xs font-medium">Estilo y calidad para tu día a día. Porque vestir bien es recordarte quién eres.</p>
            </div>
            <div className="text-center lg:text-left">
              <h4 className="text-xs font-black uppercase tracking-[0.4em] mb-10 text-white">Navegación</h4>
              <ul className="text-white/70 text-[10px] font-bold tracking-[0.2em] space-y-6 uppercase">
                <li><Link to="/categoria/ropa" className="hover:text-white transition-colors">Colección Ropa</Link></li>
                <li><Link to="/categoria/bolsos" className="hover:text-white transition-colors">Accesorios & Bolsos</Link></li>
                <li><Link to="/#novedades" className="hover:text-white transition-colors">Recién Llegados</Link></li>
                <li><Link to="/conocenos" className="hover:text-white transition-colors">Conócenos</Link></li>
              </ul>
            </div>
            <div className="text-center lg:text-left">
              <h4 className="text-xs font-black uppercase tracking-[0.4em] mb-10 text-white">Atención</h4>
              <ul className="text-white/70 text-[10px] font-bold tracking-[0.2em] space-y-6 uppercase">
                <li><Link to="/envios" className="hover:text-white transition-colors">Envíos</Link></li>
                <li><Link to="/devoluciones" className="hover:text-white transition-colors">Devoluciones</Link></li>
              </ul>
            </div>
            <div className="text-center lg:text-left">
              <h4 className="text-xs font-black uppercase tracking-[0.4em] mb-10 text-white">Contacto</h4>
              <ul className="text-white/70 text-[10px] font-bold tracking-[0.2em] space-y-6 uppercase">
                <li>
                  <a href="tel:+34685011494" className="hover:text-white transition-colors flex items-center justify-center lg:justify-start gap-4">
                    <Phone className="w-4 h-4 text-white shrink-0" />
                    685 011 494
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/34685011494" className="hover:text-white transition-colors flex items-center justify-center lg:justify-start gap-4">
                    <MessageCircle className="w-4 h-4 text-white shrink-0" />
                    WhatsApp
                  </a>
                </li>
                <li>
                  <a href="mailto:info@modasmelomerezco.es" className="hover:text-white transition-colors flex items-center justify-center lg:justify-start gap-4">
                    <Mail className="w-4 h-4 text-white shrink-0" />
                    info@modasmelomerezco.es
                  </a>
                </li>
              </ul>
            </div>
            <div className="text-center lg:text-left">
              <h4 className="text-xs font-black uppercase tracking-[0.4em] mb-10 text-white">Conecta</h4>
              <div className="flex items-center justify-center lg:justify-start gap-10 text-white/70">
                <a href="https://www.instagram.com/modasmelomerezco" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors transform hover:scale-110 duration-200">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.281.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://www.tiktok.com/@modasmelomerezco" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors transform hover:scale-110 duration-200">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 448 512">
                    <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z"/>
                  </svg>
                </a>
                <a href="https://www.facebook.com/profile.php?id=61555721379464" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors transform hover:scale-110 duration-200">
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="pt-12 border-t border-white/10 flex flex-col lg:flex-row justify-between items-center gap-10">
            <p className="text-white/60 text-[10px] uppercase tracking-[0.5em] text-center lg:text-left leading-relaxed">© 2026 Modas Me lo Merezco. All Rights Reserved.</p>
            <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-[10px] font-bold tracking-[0.3em] uppercase text-white/60">
              <Link to="/aviso-legal" className="hover:text-white transition-colors">Aviso Legal</Link>
              <Link to="/politica-de-privacidad" className="hover:text-white transition-colors">Privacidad</Link>
              <Link to="/condiciones-venta" className="hover:text-white transition-colors">Condiciones</Link>
              <Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
