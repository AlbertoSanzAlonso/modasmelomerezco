import { useEffect, useRef, useState, type FC, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [term, setTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTerm(searchParams.get('q')?.trim() ?? '');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen, searchParams]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = term.trim();
    if (!trimmed) return;
    navigate(`/buscar?q=${encodeURIComponent(trimmed)}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="Cerrar búsqueda"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-60 bg-secondary/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed top-20 left-0 right-0 z-70 px-6"
          >
            <form
              onSubmit={handleSubmit}
              className="max-w-2xl mx-auto bg-accent border border-secondary/10 rounded-2xl shadow-2xl p-3 flex items-center gap-3"
            >
              <Search className="w-5 h-5 text-secondary/40 shrink-0 ml-2" />
              <input
                ref={inputRef}
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Buscar piezas…"
                autoComplete="off"
                className="flex-1 bg-transparent py-3 text-sm font-bold uppercase tracking-wider text-secondary placeholder:text-secondary/30 outline-none"
              />
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-secondary/40 hover:text-primary transition-colors"
                aria-label="Cerrar"
              >
                <X className="w-5 h-5" />
              </button>
              <button
                type="submit"
                disabled={!term.trim()}
                className="px-5 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40"
              >
                Buscar
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
