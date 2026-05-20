import React, { useState, useEffect, Suspense, lazy } from 'react';
import { MapPin, CheckCircle2, Search, Loader2 } from 'lucide-react';

// Lazy load the map component to reduce initial bundle size
const NacexMap = lazy(() => import('./NacexMap').then(module => ({ default: module.NacexMap })));

interface NacexPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  lat?: string;
  lng?: string;
}

interface NacexPointSelectorProps {
  onSelect: (point: NacexPoint) => void;
  selectedPoint?: any;
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
        
        // Si recibimos un string de error o algo raro, lo manejamos
        if (!Array.isArray(data)) {
          console.error('Invalid data received:', data);
          setError('Nacex no ha devuelto puntos válidos para este CP.');
          setPoints([]);
          return;
        }

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
    <div className="mt-8 p-8 bg-white border border-primary/10 rounded-[2.5rem] shadow-xl shadow-primary/5 animate-in fade-in slide-in-from-top-6 duration-700">
      <div className="flex items-center gap-5 mb-8">
        <div className="bg-primary/10 p-4 rounded-2xl shadow-inner">
          <MapPin className="text-primary w-6 h-6" />
        </div>
        <div>
          <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-secondary leading-none">Puntos Nacex.Shop</h4>
          <p className="text-[10px] text-secondary/40 uppercase tracking-widest mt-2 font-bold">
            {zipCode ? `Tiendas disponibles cerca de ${zipCode}` : 'Introduce tu código postal'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-12 gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 animate-pulse">Buscando tiendas cercanas...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl text-center">
          <p className="text-[11px] font-black text-red-500 uppercase tracking-widest">{error}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {points.map((point) => {
            const isSelected = selectedPoint && (
              typeof selectedPoint === 'string'
                ? (selectedPoint.includes(point.id) || selectedPoint === point.name)
                : (selectedPoint.id === point.id || selectedPoint.name === point.name)
            );
            return (
              <div key={point.id} className="space-y-4">
                <div
                  onClick={() => onSelect(point)}
                  className={`group p-6 rounded-4xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between ${
                    isSelected
                      ? 'bg-primary/5 border-primary shadow-xl scale-[1.01]'
                      : 'bg-secondary/5 border-transparent hover:border-primary/20 hover:bg-white hover:shadow-lg'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className={`text-[13px] font-black uppercase tracking-tight italic ${isSelected ? 'text-primary' : 'text-secondary'}`}>
                        {point.name}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <p className="text-[10px] text-secondary/60 uppercase tracking-widest font-bold">
                        {point.address}
                      </p>
                      <span className="text-[9px] text-primary/40 font-black uppercase tracking-[0.2em]">
                        {point.city} • {point.zip}
                      </span>
                    </div>
                  </div>
                  
                  <div className={`shrink-0 ml-4 p-3 rounded-2xl transition-all duration-500 ${isSelected ? 'bg-primary text-white' : 'bg-white text-secondary/10 opacity-0 group-hover:opacity-100'}`}>
                    {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <MapPin className="w-4 h-4" />}
                  </div>
                </div>

                {isSelected && point.lat && point.lng && (
                  <Suspense fallback={<div className="h-[250px] w-full bg-secondary/5 rounded-3xl animate-pulse flex items-center justify-center text-[10px] uppercase font-black tracking-widest text-secondary/30">Cargando mapa...</div>}>
                    <NacexMap 
                      lat={parseFloat(point.lat)} 
                      lng={parseFloat(point.lng)} 
                      name={point.name} 
                      address={point.address} 
                    />
                  </Suspense>
                )}
              </div>
            );
          })}
          
          {zipCode && zipCode.length === 5 && points.length === 0 && (
            <div className="py-12 border-2 border-dashed border-secondary/10 rounded-3xl flex flex-col items-center justify-center text-center">
              <Search className="w-8 h-8 text-secondary/10 mb-4" />
              <p className="text-[10px] text-secondary/30 font-black uppercase tracking-[0.2em] max-w-[200px]">
                No hay puntos Nacex registrados en el código postal {zipCode}
              </p>
            </div>
          )}
        </div>
      )}

      {selectedPoint && (
        <div className="mt-8 pt-6 border-t border-secondary/5 flex items-center justify-between animate-in slide-in-from-bottom-2 duration-500">
           <div className="flex items-center gap-3">
             <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
             <p className="text-[9px] font-black text-secondary uppercase tracking-[0.3em]">Punto seleccionado:</p>
           </div>
           <p className="text-[10px] font-black text-primary uppercase italic tracking-tight bg-primary/5 px-4 py-2 rounded-xl border border-primary/10">
             {selectedPoint}
           </p>
        </div>
      )}
    </div>
  );
};
