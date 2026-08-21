import { useEffect, useState, type FC } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

const STORAGE_KEY = 'melomerezco-cookie-consent';

type ConsentValue = 'accepted' | 'necessary';

function readConsent(): ConsentValue | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === 'accepted' || value === 'necessary') return value;
  } catch {
    /* ignore */
  }
  return null;
}

function writeConsent(value: ConsentValue) {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

export const CookieConsent: FC = () => {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      setVisible(false);
      return;
    }
    setVisible(readConsent() === null);
  }, [pathname]);

  const dismiss = (value: ConsentValue) => {
    writeConsent(value);
    setVisible(false);
  };

  if (pathname.startsWith('/admin')) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          role="dialog"
          aria-label="Aviso de cookies"
          aria-live="polite"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 28 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-60 flex justify-center px-4 pb-4 sm:px-6 sm:pb-6 pointer-events-none"
        >
          <div className="pointer-events-auto relative w-full max-w-4xl overflow-hidden rounded-2xl border border-black/5 bg-[#faf9f6] shadow-[0_20px_50px_-16px_rgba(5,5,5,0.28)]">
            {/* Marca de agua del logo */}
            <img
              src="/assets/logo/LOGO MELOMEREZCO corona.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 top-1/2 h-72 w-72 -translate-y-1/2 -rotate-12 select-none object-contain opacity-[0.07] sm:-right-20 sm:h-96 sm:w-96 sm:-rotate-[14deg] md:-right-24 md:h-[28rem] md:w-[28rem]"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#ff4f70]/60 to-transparent"
            />

            <div className="relative z-10 flex flex-col gap-5 p-5 sm:p-7 md:flex-row md:items-center md:gap-8 md:p-8">
              <div className="min-w-0 flex-1 space-y-2 md:pr-8">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-[#ff4f70]">
                  Cookies
                </p>
                <h2 className="font-display text-xl font-black uppercase tracking-tight italic text-[#050505] sm:text-2xl">
                  Tu privacidad{' '}
                  <span className="font-serif lowercase not-italic text-[#ff4f70]">importa</span>
                </h2>
                <p className="max-w-xl text-sm font-light leading-relaxed text-[#050505]/65">
                  Usamos cookies técnicas para que la tienda funcione y, si lo aceptas, otras
                  que nos ayudan a mejorar tu experiencia.{' '}
                  <Link
                    to="/cookies"
                    className="font-medium text-[#050505] underline decoration-[#ff4f70]/40 underline-offset-4 transition-colors hover:text-[#ff4f70] hover:decoration-[#ff4f70]"
                  >
                    Política de cookies
                  </Link>
                </p>
              </div>

              <div className="flex w-full shrink-0 flex-col gap-2.5 sm:flex-row sm:w-auto md:flex-col lg:flex-row">
                <Button
                  size="sm"
                  className="w-full rounded-xl bg-[#ff4f70] py-3.5 text-[10px] hover:bg-[#e63e5d] sm:min-w-40"
                  onClick={() => dismiss('accepted')}
                >
                  Aceptar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-xl border-black/10 bg-white py-3.5 text-[10px] text-[#050505] hover:bg-black/5 sm:min-w-40"
                  onClick={() => dismiss('necessary')}
                >
                  Solo necesarias
                </Button>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
