import React from 'react';
import { Loader2 } from 'lucide-react';
import { PROVINCES, CITIES_BY_PROVINCE } from "@/constants/locations";

interface SignupAddressFormProps {
  address: {
    street: string;
    floor: string;
    door: string;
    stair: string;
    province: string;
    city: string;
    zip: string;
  };
  setAddress: React.Dispatch<React.SetStateAction<any>>;
  isLocating: boolean;
  onProvinceChange: (province: string) => void;
  onCityChange: (city: string) => void;
}

export const SignupAddressForm: React.FC<SignupAddressFormProps> = ({
  address,
  setAddress,
  isLocating,
  onProvinceChange,
  onCityChange
}) => {
  return (
    <div className="pt-4 pb-2">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Dirección de envío</h3>
      <div className="space-y-4">
        <div className="relative group">
          <input
            type="text"
            required
            maxLength={5}
            value={address.zip}
            onChange={(e) => setAddress({...address, zip: e.target.value.replace(/\D/g, '')})}
            className="block w-full px-4 py-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-[var(--text-main)] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
            placeholder="Código Postal (ej: 28001)"
          />
          {isLocating && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <select
            required
            value={address.province}
            onChange={(e) => onProvinceChange(e.target.value)}
            className="block w-full px-4 py-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium appearance-none"
          >
            <option value="" disabled>Provincia</option>
            {PROVINCES.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <div className="relative">
            <input
              type="text"
              list="signup-cities"
              required
              value={address.city}
              onChange={(e) => onCityChange(e.target.value)}
              className="block w-full px-4 py-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-[var(--text-main)] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
              placeholder="Localidad / Municipio"
            />
            <datalist id="signup-cities">
              {address.province && CITIES_BY_PROVINCE[address.province]?.map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>

        <input
          type="text"
          required
          value={address.street}
          onChange={(e) => setAddress({...address, street: e.target.value})}
          className="block w-full px-4 py-4 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-2xl text-[var(--text-main)] placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
          placeholder="Calle, Vía, Plaza y Número"
        />

        <div className="grid grid-cols-3 gap-4">
          <input
            type="text"
            value={address.floor}
            onChange={(e) => setAddress({...address, floor: e.target.value})}
            className="block w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all text-xs font-bold"
            placeholder="Piso"
          />
          <input
            type="text"
            value={address.door}
            onChange={(e) => setAddress({...address, door: e.target.value})}
            className="block w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all text-xs font-bold"
            placeholder="Puerta"
          />
          <input
            type="text"
            value={address.stair}
            onChange={(e) => setAddress({...address, stair: e.target.value})}
            className="block w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border-main)] rounded-xl text-[var(--text-main)] placeholder-gray-600 focus:outline-none focus:border-primary/50 transition-all text-xs font-bold"
            placeholder="Escalera"
          />
        </div>
      </div>
    </div>
  );
};
