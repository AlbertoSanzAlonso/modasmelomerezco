
import React, { useState } from 'react';
import { MapPin, ExternalLink, CheckCircle2, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface NacexPointSelectorProps {
  onSelect: (pointName: string) => void;
  selectedPoint?: string;
}

export const NacexPointSelector: React.FC<NacexPointSelectorProps> = ({ onSelect, selectedPoint }) => {
  const [pointName, setPointName] = useState(selectedPoint || '');

  const openNacexMap = () => {
    window.open('https://www.nacex.com/puntos-nacex-shop', '_blank');
  };

  return (
    <div className="mt-6 p-6 bg-primary/5 border border-primary/10 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-start gap-4 mb-6">
        <div className="bg-primary/10 p-3 rounded-2xl">
          <MapPin className="text-primary w-5 h-5" />
        </div>
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-widest text-secondary">Selecciona tu Punto Nacex Shop</h4>
          <p className="text-[9px] text-secondary/40 uppercase tracking-tighter mt-1 leading-relaxed">
            Busca el punto más cercano en el mapa oficial y escribe su nombre o código abajo.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Button
          type="button"
          variant="outline"
          onClick={openNacexMap}
          className="w-full flex items-center justify-center gap-3 py-4 border-dashed border-primary/30 hover:border-primary text-[10px] font-black uppercase tracking-widest italic"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir Buscador Oficial Nacex
        </Button>

        <div className="relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/20 group-focus-within:text-primary transition-colors">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Ej: Librería Central (C0432)"
            value={pointName}
            onChange={(e) => {
              const val = e.target.value;
              setPointName(val);
              onSelect(val);
            }}
            className="w-full bg-white border border-secondary/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
          />
          {pointName.length > 5 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          )}
        </div>

        {pointName.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-green-500/5 rounded-xl border border-green-500/10">
            <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest">
              Punto Seleccionado Correctamente
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
