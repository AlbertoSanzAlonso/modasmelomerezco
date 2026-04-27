import React from 'react';
import { Save, Loader2 } from 'lucide-react';
import type { Address } from '@/types';
import { PROVINCES, CITIES_BY_PROVINCE } from "@/constants/locations";

interface AddressFormProps {
  formData: Partial<Address>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<Address>>>;
  isLocating: boolean;
  isLoading: boolean;
  isEditing: boolean | number | 'new';
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  onProvinceChange: (province: string) => void;
  onCityChange: (city: string) => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({
  formData,
  setFormData,
  isLocating,
  isLoading,
  isEditing,
  onSubmit,
  onCancel,
  onProvinceChange,
  onCityChange
}) => {
  return (
    <form onSubmit={onSubmit} className="bg-white/5 border border-primary/20 rounded-3xl p-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="grid grid-cols-2 gap-6">
        <div className="col-span-2 space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Alias (ej: Casa, Trabajo)</label>
          <input 
            required
            value={formData.type || ''}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none text-secondary"
            placeholder="Ej: Casa, Trabajo..."
          />
        </div>
        <div className="col-span-2 space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Código Postal</label>
          <div className="relative">
            <input 
              required
              maxLength={5}
              value={formData.zip || ''}
              onChange={(e) => setFormData({...formData, zip: e.target.value.replace(/\D/g, '')})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none text-secondary"
              placeholder="Ej: 28001"
            />
            {isLocating && <Loader2 className="w-4 h-4 animate-spin text-primary absolute right-4 top-1/2 -translate-y-1/2" />}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Provincia</label>
          <select 
            required
            value={formData.province || ''}
            onChange={(e) => onProvinceChange(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none appearance-none cursor-pointer text-secondary"
          >
            <option value="" disabled>Selecciona provincia</option>
            {PROVINCES.map(prov => (
              <option key={prov} value={prov}>{prov}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Ciudad</label>
          <div className="relative">
            <input 
              required
              list="profile-cities"
              value={formData.city || ''}
              onChange={(e) => onCityChange(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none text-secondary"
              placeholder="Escribe o selecciona tu ciudad"
            />
            <datalist id="profile-cities">
              {formData.province && CITIES_BY_PROVINCE[formData.province]?.map(city => (
                <option key={city} value={city} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="col-span-2 space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Calle y Número</label>
          <input 
            required
            value={formData.street || ''}
            onChange={(e) => setFormData({...formData, street: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none text-secondary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Piso</label>
          <input 
            value={formData.floor || ''}
            onChange={(e) => setFormData({...formData, floor: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none text-secondary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Puerta / Esc.</label>
          <div className="grid grid-cols-2 gap-2">
            <input 
              value={formData.door || ''}
              placeholder="Pta"
              onChange={(e) => setFormData({...formData, door: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none text-secondary"
            />
            <input 
              value={formData.stair || ''}
              placeholder="Esc"
              onChange={(e) => setFormData({...formData, stair: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none text-secondary"
            />
          </div>
        </div>
        <div className="col-span-2 flex items-center gap-2">
          <input 
            type="checkbox"
            id="isDefault"
            checked={formData.isDefault || false}
            onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="isDefault" className="text-xs font-bold text-gray-600 uppercase tracking-widest">Establecer como principal</label>
        </div>
      </div>
      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-4 bg-primary text-white font-black uppercase italic tracking-widest text-[10px] rounded-xl hover:bg-secondary transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEditing === 'new' ? 'Añadir Dirección' : 'Actualizar Dirección'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-8 py-4 bg-white/5 text-gray-400 font-black uppercase italic tracking-widest text-[10px] rounded-xl hover:bg-white/10 transition-all"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};
