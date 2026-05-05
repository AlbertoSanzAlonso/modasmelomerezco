import React from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';

type ShippingOption = 'home' | 'local' | 'nacex_point';

import { NacexPointSelector } from './NacexPointSelector';

interface ShippingMethodSelectorProps {
  selectedOption: ShippingOption;
  onSelect: (option: ShippingOption) => void;
  selectedPoint?: string;
  onPointSelect?: (point: string) => void;
  zipCode?: string;
}

export const ShippingMethodSelector: React.FC<ShippingMethodSelectorProps> = ({
  selectedOption,
  onSelect,
  selectedPoint,
  onPointSelect,
  zipCode
}) => {
  return (
    <section className="bg-secondary/5 p-8 border border-secondary/10 rounded-2xl mb-12">
      <div className="flex items-center gap-4 mb-8">
        <Truck className="text-primary w-5 h-5" />
        <h3 className="text-xs font-black tracking-[0.4em] uppercase text-secondary">Método de Envío</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Pickup */}
        <div 
          onClick={() => onSelect('local')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-col gap-4 ${
            selectedOption === 'local' 
              ? 'bg-primary/5 border-primary shadow-lg' 
              : 'bg-white/5 border-white/10 hover:border-white/30'
          }`}
        >
          <div className="flex justify-between items-center">
            <div className={`w-6 h-6 flex items-center justify-center font-black text-xs rounded-full border-2 ${
              selectedOption === 'local' ? 'bg-primary border-primary text-white' : 'border-secondary/20 text-secondary/40'
            }`}>
              L
            </div>
            {selectedOption === 'local' && <CheckCircle2 className="w-4 h-4 text-primary" />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Recogida en local</p>
            <p className="text-[9px] text-secondary/40 uppercase tracking-tighter mt-1">C/ Aragón, 2, L2 - Benalmádena (Gratis)</p>
          </div>
        </div>

        {/* Nacex Point */}
        <div 
          onClick={() => onSelect('nacex_point')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-col gap-4 ${
            selectedOption === 'nacex_point' 
              ? 'bg-primary/5 border-primary shadow-lg' 
              : 'bg-white/5 border-white/10 hover:border-white/30'
          }`}
        >
          <div className="flex justify-between items-center">
            <div className={`w-6 h-6 flex items-center justify-center font-black text-xs rounded-full border-2 ${
              selectedOption === 'nacex_point' ? 'bg-primary border-primary text-white' : 'border-secondary/20 text-secondary/40'
            }`}>
              N
            </div>
            {selectedOption === 'nacex_point' && <CheckCircle2 className="w-4 h-4 text-primary" />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Punto Nacex (48h)</p>
            <p className="text-[9px] text-secondary/40 uppercase tracking-tighter mt-1">Entrega en punto de recogida (Gratis)</p>
          </div>
        </div>

        {/* Home Delivery */}
        <div 
          onClick={() => onSelect('home')}
          className={`p-6 rounded-2xl border cursor-pointer transition-all flex flex-col gap-4 col-span-1 md:col-span-2 ${
            selectedOption === 'home' 
              ? 'bg-primary/5 border-primary shadow-lg' 
              : 'bg-white/5 border-white/10 hover:border-white/30'
          }`}
        >
          <div className="flex justify-between items-center">
            <Truck className={`w-6 h-6 ${selectedOption === 'home' ? 'text-primary' : 'text-secondary/40'}`} />
            {selectedOption === 'home' && <CheckCircle2 className="w-4 h-4 text-primary" />}
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Envío a domicilio (48h)</p>
            <p className="text-[9px] text-secondary/40 uppercase tracking-tighter mt-1">Entrega en tu dirección (5,50€)</p>
          </div>
        </div>
      </div>

      {selectedOption === 'nacex_point' && (
        <NacexPointSelector 
          selectedPoint={selectedPoint}
          onSelect={onPointSelect || (() => {})}
          zipCode={zipCode}
        />
      )}
    </section>
  );
};
