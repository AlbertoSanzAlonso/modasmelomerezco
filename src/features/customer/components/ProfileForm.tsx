import React from 'react';
import { User, Save, Loader2 } from 'lucide-react';
import type { Customer } from '@/types';

interface ProfileFormProps {
  user: Customer | null;
  profileData: {
    name: string;
    surname: string;
    phone: string;
  };
  setProfileData: React.Dispatch<React.SetStateAction<{
    name: string;
    surname: string;
    phone: string;
  }>>;
  isLoading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({
  user,
  profileData,
  setProfileData,
  isLoading,
  onSubmit
}) => {
  return (
    <section className="bg-white/5 border border-white/10 rounded-3xl p-8">
      <h3 className="text-lg font-black uppercase tracking-widest italic flex items-center gap-3 mb-8">
        <User className="w-5 h-5 text-primary" /> Datos
      </h3>
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Nombre</label>
          <input 
            type="text" 
            value={profileData.name}
            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none text-secondary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Apellidos</label>
          <input 
            type="text" 
            value={profileData.surname}
            onChange={(e) => setProfileData({...profileData, surname: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none text-secondary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Email</label>
          <input type="text" value={user?.email} disabled className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold opacity-60 text-secondary" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Teléfono</label>
          <input 
            type="tel" 
            value={profileData.phone}
            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none text-secondary"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white font-black uppercase italic tracking-widest text-[10px] rounded-xl hover:bg-secondary transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar Datos
        </button>
      </form>
    </section>
  );
};
