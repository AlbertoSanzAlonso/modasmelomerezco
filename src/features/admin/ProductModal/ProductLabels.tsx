import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { Label } from '@/types/index';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/Button';

interface ProductLabelsProps {
  selectedLabels: Label[];
  availableLabels: Label[];
  onLabelsChange: (labels: Label[]) => void;
  onLabelCreated: (label: Label) => void;
  onLabelDeleted: (labelId: number) => void;
}

export const ProductLabels: React.FC<ProductLabelsProps> = ({
  selectedLabels = [],
  availableLabels = [],
  onLabelsChange,
  onLabelCreated,
  onLabelDeleted,
}) => {
  const queryClient = useQueryClient();
  const [newLabelName, setNewLabelName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleToggle = (label: Label) => {
    const isSelected = selectedLabels.some((l) => l.id === label.id);
    if (isSelected) {
      onLabelsChange(selectedLabels.filter((l) => l.id !== label.id));
    } else {
      onLabelsChange([...selectedLabels, label]);
    }
  };

  const handleCreate = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmed = newLabelName.trim();
    if (!trimmed) return;

    const exists = availableLabels.find(
      (l) => l.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      if (!selectedLabels.some((l) => l.id === exists.id)) {
        onLabelsChange([...selectedLabels, exists]);
      }
      setNewLabelName('');
      return;
    }

    setIsCreating(true);
    try {
      const created = await api.labels.create(trimmed);
      onLabelCreated(created);
      onLabelsChange([...selectedLabels, created]);
      setNewLabelName('');
      queryClient.invalidateQueries({ queryKey: ['admin-labels'] });
    } catch (error) {
      console.error(
        'Error creating label:',
        error instanceof Error ? error.message : error
      );
      useCartStore.getState().openModal({
        title: 'Etiquetas no disponibles',
        message:
          error instanceof Error
            ? error.message
            : 'Aplica supabase/migrations/labels.sql en la base Postgres.',
        type: 'warning',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const requestDelete = (label: Label, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (deletingId != null) return;

    useCartStore.getState().openModal({
      title: 'Eliminar etiqueta',
      message: `¿Segura de que quieres eliminar «${label.name}»? Todos los productos que la tengan dejarán de tenerla.`,
      type: 'confirm',
      onConfirm: () => {
        void (async () => {
          setDeletingId(label.id);
          try {
            await api.labels.delete(label.id);
            onLabelDeleted(label.id);
            queryClient.invalidateQueries({ queryKey: ['admin-labels'] });
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
          } catch (err) {
            console.error('Error deleting label:', err);
            useCartStore.getState().openModal({
              title: 'No se pudo eliminar',
              message:
                err instanceof Error
                  ? err.message
                  : 'No se pudo eliminar la etiqueta. Inténtalo de nuevo.',
              type: 'error',
            });
          } finally {
            setDeletingId(null);
          }
        })();
      },
    });
  };

  return (
    <div className="space-y-8 border-t border-(--border-main) pt-12">
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary block">
          Etiquetas (filtros en tienda)
        </label>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
          Ej: Verano, Fiesta, Básicos… La clienta podrá filtrar por ellas en el catálogo.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {availableLabels.length === 0 ? (
          <p className="text-xs text-gray-400 italic">
            No hay etiquetas. Crea la primera abajo.
          </p>
        ) : (
          availableLabels.map((label) => {
            const isSelected = selectedLabels.some((l) => l.id === label.id);
            const isDeleting = deletingId === label.id;
            return (
              <div
                key={label.id}
                className={`inline-flex items-center gap-1 border text-xs font-bold rounded-xl transition-all uppercase tracking-wider
                  ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/15'
                      : 'bg-(--bg-card) text-(--text-main) border-(--border-main)'
                  }
                  ${isDeleting ? 'opacity-50' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => handleToggle(label)}
                  disabled={isDeleting}
                  className="px-4 py-3 hover:opacity-90 select-none"
                >
                  {label.name}
                </button>
                <button
                  type="button"
                  onClick={(e) => requestDelete(label, e)}
                  disabled={isDeleting}
                  title={`Eliminar etiqueta «${label.name}»`}
                  aria-label={`Eliminar etiqueta ${label.name}`}
                  className={`mr-2 p-1 rounded-md transition-colors ${
                    isSelected
                      ? 'text-white/70 hover:text-white hover:bg-white/15'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-500/10'
                  }`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-end gap-4 bg-(--bg-card) p-6 border border-(--border-main) rounded-2xl max-w-xl">
        <div className="space-y-3 flex-1 w-full">
          <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">
            Nueva etiqueta
          </label>
          <input
            type="text"
            autoComplete="off"
            className="w-full bg-(--bg-main) border border-(--border-main) px-4 py-3 text-xs font-bold focus:border-primary outline-none rounded-xl"
            placeholder="Ej: Verano, Oferta, Nuevo..."
            value={newLabelName}
            onChange={(e) => setNewLabelName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreate(e);
              }
            }}
            disabled={isCreating}
          />
        </div>
        <Button
          type="button"
          onClick={() => handleCreate()}
          variant="outline"
          size="sm"
          className="text-[10px] font-black border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl whitespace-nowrap"
          disabled={isCreating || !newLabelName.trim()}
        >
          {isCreating ? 'CREANDO...' : '+ CREAR ETIQUETA'}
        </Button>
      </div>
    </div>
  );
};
