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
          className="fixed inset-x-3 bottom-20 z-60 sm:inset-x-auto sm:left-6 sm:right-auto sm:bottom-6 sm:max-w-md md:max-w-lg"
        >
          <div className="relative overflow-hidden rounded-2xl border border-secondary/8 bg-accent/95 shadow-[0_24px_60px_-20px_rgba(5,5,5,0.35)] backdrop-blur-xl dark:bg-secondary/95 dark:border-white/10">
            {/* Marca de agua del logo */}
            <img
              src="/assets/logo/LOGO MELOMEREZCO corona.svg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-6 -top-4 h-36 w-36 select-none object-contain opacity-[0.07] sm:h-44 sm:w-44 sm:-right-4 sm:-top-2 dark:opacity-[0.12] dark:invert"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/50 to-transparent"
            />

            <div className="relative z-10 flex flex-col gap-5 p-5 sm:p-6">
              <div className="space-y-2 pr-10 sm:pr-14">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-primary">
                  Cookies
                </p>
                <h2 className="font-display text-lg font-black uppercase tracking-tight italic text-secondary sm:text-xl">
                  Tu privacidad{' '}
                  <span className="font-serif lowercase not-italic text-primary">importa</span>
                </h2>
                <p className="text-sm font-light leading-relaxed text-secondary/65">
                  Usamos cookies técnicas para que la tienda funcione y, si lo aceptas, otras
                  que nos ayudan a mejorar tu experiencia.{' '}
                  <Link
                    to="/cookies"
                    className="font-medium text-secondary underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
                  >
                    Política de cookies
                  </Link>
                </p>
              </div>

              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <Button
                  size="sm"
                  className="w-full rounded-xl py-3.5 text-[10px] sm:flex-1"
                  onClick={() => dismiss('accepted')}
                >
                  Aceptar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full rounded-xl border-secondary/15 py-3.5 text-[10px] sm:flex-1"
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
