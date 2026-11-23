import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Category, Subcategory } from '@/types';

const menuEase = [0.4, 0, 0.2, 1] as const;

interface CatalogCategorySelectProps {
  categories: Category[];
  subcategories: Subcategory[];
  categoryFilter?: number;
  subcategoryFilter?: number;
  onSelect: (value: string) => void;
}

export const CatalogCategorySelect: React.FC<CatalogCategorySelectProps> = ({
  categories,
  subcategories,
  categoryFilter,
  subcategoryFilter,
  onSelect,
}) => {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [open, setOpen] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<number | null>(null);

  const activeCategory = categories.find((cat) => cat.id === categoryFilter);
  const activeSubcategory = subcategories.find((sub) => sub.id === subcategoryFilter);

  const label = activeSubcategory
    ? `${activeCategory?.name ?? 'Categoría'} · ${activeSubcategory.name}`
    : activeCategory?.name ?? 'Todas las categorías';

  const close = React.useCallback(() => {
    setOpen(false);
    setExpandedId(null);
  }, []);

  const choose = (value: string) => {
    onSelect(value);
    close();
  };

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);

  const toggle = () => {
    setOpen((current) => {
      const next = !current;
      if (!next) setExpandedId(null);
      return next;
    });
  };

  return (
    <div ref={rootRef} className="relative hidden md:block w-full sm:flex-1 min-w-0 max-w-full sm:max-w-md">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Categoría o subcategoría"
        onClick={toggle}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-sm sm:text-base font-black uppercase tracking-widest border-2 border-(--border-main) rounded-2xl focus:outline-none focus:border-primary bg-(--bg-card) text-(--text-main) cursor-pointer shadow-sm"
      >
        <span className="truncate text-left">{label}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform duration-500 ease-out ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
      {open && (
        <motion.div
          role="listbox"
          aria-label="Categorías"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.45, ease: menuEase }}
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(24rem,70vh)] origin-top overflow-y-auto rounded-2xl border-2 border-(--border-main) bg-(--bg-elevated) py-2 shadow-2xl"
        >
          <button
            type="button"
            role="option"
            aria-selected={!categoryFilter && !subcategoryFilter}
            onClick={() => choose('')}
            className={`w-full px-4 py-2.5 text-left text-xs font-black uppercase tracking-widest transition-colors ${
              !categoryFilter && !subcategoryFilter
                ? 'bg-primary/10 text-primary'
                : 'text-(--text-main) hover:bg-primary/5'
            }`}
          >
            Todas las categorías
          </button>

          {categories.map((cat) => {
            const subs = subcategories.filter((sub) => sub.category_id === cat.id);
            const expanded = expandedId === cat.id && subs.length > 0;
            const categorySelected = categoryFilter === cat.id && !subcategoryFilter;

            return (
              <div key={cat.id}>
                <div className="flex items-stretch">
                  <button
                    type="button"
                    role="option"
                    aria-selected={categorySelected}
                    aria-expanded={subs.length > 0 ? expanded : undefined}
                    onClick={() => {
                      if (subs.length > 0) {
                        setExpandedId((current) => (current === cat.id ? null : cat.id));
                        return;
                      }
                      choose(`c-${cat.id}`);
                    }}
                    className={`min-w-0 flex-1 px-4 py-2.5 text-left text-xs font-black uppercase tracking-widest transition-colors ${
                      categorySelected
                        ? 'bg-primary/10 text-primary'
                        : 'text-(--text-main) hover:bg-primary/5'
                    }`}
                  >
                    <span className="block truncate">{cat.name}</span>
                  </button>
                  {subs.length > 0 && (
                    <button
                      type="button"
                      aria-label={`Subcategorías de ${cat.name}`}
                      aria-expanded={expanded}
                      onClick={() => setExpandedId((current) => (current === cat.id ? null : cat.id))}
                      className={`px-3 text-gray-400 transition-colors hover:text-primary ${expanded ? 'text-primary' : ''}`}
                    >
                      <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-500 ease-out ${expanded ? 'rotate-90' : ''}`} />
                    </button>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {expanded && (
                    <motion.div
                      key={cat.id}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.42, ease: menuEase }}
                      className="overflow-hidden"
                    >
                      <div className="ml-5 mr-2 mb-1 border-l border-primary/40">
                        <button
                          type="button"
                          role="option"
                          aria-selected={categorySelected}
                          onClick={() => choose(`c-${cat.id}`)}
                          className={`flex w-full items-center gap-2 py-2 pl-4 pr-3 text-left text-[11px] font-bold uppercase tracking-widest transition-colors ${
                            categorySelected
                              ? 'text-primary'
                              : 'text-(--text-main) hover:text-primary'
                          }`}
                        >
                          <span className="h-px w-3 shrink-0 bg-primary/50" />
                          <span className="truncate">Toda {cat.name}</span>
                        </button>
                        {subs.map((sub) => {
                          const selected = subcategoryFilter === sub.id;
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              role="option"
                              aria-selected={selected}
                              onClick={() => choose(`s-${sub.id}`)}
                              className={`flex w-full items-center gap-2 py-2 pl-4 pr-3 text-left text-[11px] font-bold uppercase tracking-widest transition-colors ${
                                selected
                                  ? 'text-primary'
                                  : 'text-(--text-main) hover:text-primary'
                              }`}
                            >
                              <span className="h-px w-3 shrink-0 bg-primary/50" />
                              <span className="truncate">{sub.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
