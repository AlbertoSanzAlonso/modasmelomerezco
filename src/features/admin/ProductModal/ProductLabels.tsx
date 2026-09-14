import React, { useState } from 'react';
import type { Label } from '@/types/index';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/useCartStore';
import { Button } from '@/components/ui/Button';

interface ProductLabelsProps {
  selectedLabels: Label[];
  availableLabels: Label[];
  onLabelsChange: (labels: Label[]) => void;
  onLabelCreated: (label: Label) => void;
}

export const ProductLabels: React.FC<ProductLabelsProps> = ({
  selectedLabels = [],
  availableLabels = [],
  onLabelsChange,
  onLabelCreated,
}) => {
  const [newLabelName, setNewLabelName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

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
            return (
              <button
                key={label.id}
                type="button"
                onClick={() => handleToggle(label)}
                className={`px-5 py-3 border text-xs font-bold rounded-xl transition-all select-none uppercase tracking-wider
                  ${
                    isSelected
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/15'
                      : 'bg-(--bg-card) text-(--text-main) border-(--border-main) hover:border-primary/50'
                  }`}
              >
                {label.name}
              </button>
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
