import React from 'react';
import { Loader2 } from 'lucide-react';
import { PROVINCES, CITIES_BY_PROVINCE } from "@/constants/locations";

interface CheckoutAddressFormProps {
  formData: {
    name: string;
    surname: string;
    zip: string;
    province: string;
    city: string;
    address: string;
    floor: string;
    door: string;
    stair: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  isLocating: boolean;
  onProvinceChange: (province: string) => void;
  onCityChange: (city: string) => void;
  isAuthenticated: boolean;
  saveToAccount: boolean;
  setSaveToAccount: (save: boolean) => void;
  hasAddresses: boolean;
}

export const CheckoutAddressForm: React.FC<CheckoutAddressFormProps> = ({
  formData,
  setFormData,
  isLocating,
  onProvinceChange,
  onCityChange,
  isAuthenticated,
  saveToAccount,
  setSaveToAccount,
  hasAddresses
}) => {
  return (
    <section>
      <h3 className="text-xs font-black tracking-[0.4em] uppercase text-primary mb-8">Dirección de Envío</h3>
      <div className="grid grid-cols-2 gap-6">
        <input 
          placeholder="NOMBRE" 
          required
          className="bg-gray-50 border border-gray-200 px-6 py-4 text-sm font-bold focus:border-primary outline-none text-secondary"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
        />
        <input 
          placeholder="APELLIDOS" 
          required
          className="bg-gray-50 border border-gray-200 px-6 py-4 text-sm font-bold focus:border-primary outline-none text-secondary"
          value={formData.surname}
          onChange={(e) => setFormData({...formData, surname: e.target.value})}
        />
        <div className="col-span-2 relative">
          <input 
            placeholder="CÓDIGO POSTAL" 
            required
            maxLength={5}
            autoComplete="off"
            className="w-full bg-gray-50 border border-gray-200 px-6 py-4 text-sm font-bold focus:border-primary outline-none text-secondary"
            value={formData.zip}
            onChange={(e) => setFormData({...formData, zip: e.target.value.replace(/\D/g, '')})}
          />
          {isLocating && <Loader2 className="w-4 h-4 animate-spin text-primary absolute right-4 top-1/2 -translate-y-1/2" />}
        </div>

        <div className="relative">
          <select
            required
            className="w-full bg-gray-50 border border-gray-200 px-6 py-4 text-sm font-bold focus:border-primary outline-none text-secondary appearance-none"
            value={formData.province}
            onChange={(e) => onProvinceChange(e.target.value)}
          >
            <option value="" disabled>PROVINCIA</option>
            {PROVINCES.map(prov => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          {formData.province && CITIES_BY_PROVINCE[formData.province] ? (
            <select
              required
              className="w-full bg-gray-50 border border-gray-200 px-6 py-4 text-sm font-bold focus:border-primary outline-none text-secondary appearance-none"
              value={formData.city}
              onChange={(e) => onCityChange(e.target.value)}
            >
              <option value="" disabled>CIUDAD</option>
              {CITIES_BY_PROVINCE[formData.province].map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
              <option value="otra">OTRA...</option>
            </select>
          ) : (
            <input 
              placeholder="CIUDAD" 
              required
              className="w-full bg-gray-50 border border-gray-200 px-6 py-4 text-sm font-bold focus:border-primary outline-none text-secondary"
              value={formData.city}
              onChange={(e) => onCityChange(e.target.value)}
            />
          )}
        </div>

        <input 
          placeholder="DIRECCIÓN (CALLE Y NÚMERO)" 
          required
          className="col-span-2 bg-gray-50 border border-gray-200 px-6 py-4 text-sm font-bold focus:border-primary outline-none text-secondary"
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
        />

        <div className="grid grid-cols-3 gap-4 col-span-2">
          <input 
            placeholder="PISO" 
            className="bg-gray-50 border border-gray-200 px-6 py-3 text-xs font-bold focus:border-primary outline-none text-secondary"
            value={formData.floor}
            onChange={(e) => setFormData({...formData, floor: e.target.value})}
          />
          <input 
            placeholder="PUERTA" 
            className="bg-gray-50 border border-gray-200 px-6 py-3 text-xs font-bold focus:border-primary outline-none text-secondary"
            value={formData.door}
            onChange={(e) => setFormData({...formData, door: e.target.value})}
          />
          <input 
            placeholder="ESC." 
            className="bg-gray-50 border border-gray-200 px-6 py-3 text-xs font-bold focus:border-primary outline-none text-secondary"
            value={formData.stair}
            onChange={(e) => setFormData({...formData, stair: e.target.value})}
          />
        </div>
      </div>
      {isAuthenticated && (
          <div className="mt-6 flex items-center gap-3 p-4 bg-primary/5 border border-primary/10 rounded-xl">
            <input 
              type="checkbox" 
              id="save-addr"
              checked={saveToAccount}
              onChange={(e) => setSaveToAccount(e.target.checked)}
              className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/20"
            />
            <label htmlFor="save-addr" className="text-[10px] font-black uppercase tracking-widest text-secondary cursor-pointer">
              {hasAddresses 
                ? 'Guardar esta dirección en mi cuenta para futuros pedidos' 
                : 'Guardar esta dirección para mis próximos pedidos'}
            </label>
          </div>
        )}
    </section>
  );
};
