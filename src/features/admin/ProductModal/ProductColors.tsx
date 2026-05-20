import React, { useState } from 'react';
import type { Color } from '@/types/index';
import { api } from '@/lib/api';
import { Button } from "@/components/ui/Button";

interface ProductColorsProps {
  selectedColors: Color[];
  availableColors: Color[];
  onColorsChange: (colors: Color[]) => void;
  onColorCreated: (color: Color) => void;
}

export const ProductColors: React.FC<ProductColorsProps> = ({
  selectedColors = [],
  availableColors = [],
  onColorsChange,
  onColorCreated
}) => {
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [isCreating, setIsCreating] = useState(false);

  const handleToggleColor = (color: Color) => {
    const isSelected = selectedColors.some(c => c.id === color.id);
    if (isSelected) {
      onColorsChange(selectedColors.filter(c => c.id !== color.id));
    } else {
      onColorsChange([...selectedColors, color]);
    }
  };

  const handleCreateColor = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const trimmedName = newColorName.trim();
    if (!trimmedName) return;

    // Check if color already exists
    const exists = availableColors.find(c => c.name.toLowerCase() === trimmedName.toLowerCase());
    if (exists) {
      if (!selectedColors.some(c => c.id === exists.id)) {
        onColorsChange([...selectedColors, exists]);
      }
      setNewColorName('');
      return;
    }

    setIsCreating(true);
    try {
      const created = await api.colors.create({
        name: trimmedName,
        hex: newColorHex
      });
      onColorCreated(created);
      onColorsChange([...selectedColors, created]);
      setNewColorName('');
      setNewColorHex('#000000');
    } catch (error) {
      console.error('Error creating color:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-8 border-t border-(--border-main) pt-12">
      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-primary block">
          Colores Disponibles
        </label>
        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
          Selecciona los colores disponibles para esta prenda
        </p>
      </div>

      {/* Available colors grid */}
      <div className="flex flex-wrap gap-4">
        {availableColors.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No hay colores registrados. Añade uno abajo.</p>
        ) : (
          availableColors.map(color => {
            const isSelected = selectedColors.some(c => c.id === color.id);
            return (
              <button
                key={color.id}
                type="button"
                onClick={() => handleToggleColor(color)}
                className={`flex items-center gap-3 px-5 py-3 border text-xs font-bold rounded-xl transition-all select-none
                  ${isSelected
                    ? 'bg-secondary text-white border-secondary shadow-lg shadow-secondary/10'
                    : 'bg-(--bg-card) text-(--text-main) border-(--border-main) hover:border-primary/50'
                  }`}
              >
                {/* Color preview circle */}
                <span
                  className="w-4 h-4 rounded-full border border-black/10 inline-block shrink-0 shadow-inner"
                  style={{ backgroundColor: color.hex }}
                />
                <span>{color.name}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Inline Container to Add New Color */}
      <div className="flex flex-col sm:flex-row items-end gap-6 bg-(--bg-card) p-6 border border-(--border-main) rounded-2xl max-w-xl">
        <div className="space-y-3 flex-1 w-full">
          <label className="text-[8px] font-black uppercase tracking-widest text-gray-500">Nuevo Color</label>
          <input
            type="text"
            autoComplete="off"
            className="w-full bg-(--bg-main) border border-(--border-main) px-4 py-3 text-xs font-bold focus:border-primary outline-none text-(--text-main) rounded-xl"
            placeholder="Ej: Turquesa, Verde Oliva..."
            value={newColorName}
            onChange={(e) => setNewColorName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCreateColor(e);
              }
            }}
            disabled={isCreating}
          />
        </div>
        
        <div className="space-y-3 w-full sm:w-auto flex flex-col items-center">
          <label className="text-[8px] font-black uppercase tracking-widest text-gray-500 block self-start">Muestra RGB</label>
          <div className="flex items-center gap-3 py-1">
            <input
              type="color"
              className="w-10 h-10 border-0 p-0 cursor-pointer rounded-xl bg-transparent outline-none"
              value={newColorHex}
              onChange={(e) => setNewColorHex(e.target.value)}
              disabled={isCreating}
            />
            <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">{newColorHex}</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={() => handleCreateColor()}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto text-[10px] font-black border-primary/30 text-primary hover:bg-primary hover:text-white rounded-xl py-3 whitespace-nowrap"
          disabled={isCreating || !newColorName.trim()}
        >
          {isCreating ? 'AÑADIENDO...' : '+ AÑADIR COLOR'}
        </Button>
      </div>
    </div>
  );
};
