import React, { useState, useEffect } from 'react';
import { MapPin, CheckCircle2, Search, Loader2 } from 'lucide-react';

interface NacexPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  zip: string;
}

interface NacexPointSelectorProps {
  onSelect: (pointName: string) => void;
  selectedPoint?: string;
  zipCode?: string;
}

export const NacexPointSelector: React.FC<NacexPointSelectorProps> = ({ onSelect, selectedPoint, zipCode }) => {
  const [points, setPoints] = useState<NacexPoint[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoints = async () => {
      if (!zipCode || zipCode.length < 5) return;
      
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/nacex?method=get_puntos_shop&cp=${zipCode}`);
        const data = await response.json();
        setPoints(data);
      } catch (err) {
        console.error('Error fetching Nacex points:', err);
        setError('No se pudieron cargar los puntos Nacex. Inténtalo de nuevo.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoints();
  }, [zipCode]);

  return (
    <div className="mt-6 p-6 bg-primary/5 border border-primary/10 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-start gap-4 mb-6">
        <div className="bg-primary/10 p-3 rounded-2xl">
          <MapPin className="text-primary w-5 h-5" />
        </div>
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-widest text-secondary">Puntos Nacex.shop Cercanos</h4>
          <p className="text-[9px] text-secondary/40 uppercase tracking-tighter mt-1 leading-relaxed">
            {zipCode ? `Mostrando puntos cerca de ${zipCode}` : 'Introduce tu código postal para ver puntos cercanos'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-8 gap-3">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Buscando tiendas...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl text-center">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {points.map((point) => (
            <div
              key={point.id}
              onClick={() => onSelect(`${point.name} (${point.id})`)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${
                selectedPoint?.includes(point.id)
                  ? 'bg-white border-primary shadow-lg ring-1 ring-primary'
                  : 'bg-white/50 border-secondary/10 hover:border-primary/50'
              }`}
            >
              <div className="flex flex-col gap-1">
                <p className="text-[10px] font-black uppercase tracking-tighter text-secondary">{point.name}</p>
                <p className="text-[9px] text-secondary/60 uppercase tracking-widest">{point.address}, {point.city}</p>
              </div>
              {selectedPoint?.includes(point.id) && <CheckCircle2 className="w-4 h-4 text-primary" />}
            </div>
          ))}
          {zipCode && zipCode.length === 5 && points.length === 0 && (
            <p className="text-[10px] text-center text-gray-400 py-4 font-bold uppercase tracking-widest">No se han encontrado puntos Nacex en esta zona.</p>
          )}
        </div>
      )}

      {selectedPoint && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-green-500/5 rounded-xl border border-green-500/10">
          <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest truncate">
            Seleccionado: {selectedPoint}
          </span>
        </div>
      )}
    </div>
  );
};
