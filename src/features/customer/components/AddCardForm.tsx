import React from 'react';
import { X, CreditCard, Loader2, Save } from 'lucide-react';
import { Button } from "@/components/ui/Button";

interface AddCardFormProps {
  formData: {
    number: string;
    brand: string;
    exp_month: string;
    exp_year: string;
    is_default: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}

export const AddCardForm: React.FC<AddCardFormProps> = ({
  formData,
  setFormData,
  onClose,
  onSubmit,
  isSubmitting
}) => {
  return (
    <div className="bg-white/5 border border-primary/20 rounded-3xl p-8 mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black uppercase tracking-widest italic flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-primary" /> Nueva Tarjeta
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Número de Tarjeta</label>
          <input 
            required
            type="text"
            placeholder="0000 0000 0000 0000"
            value={formData.number}
            onChange={(e) => setFormData({...formData, number: e.target.value.replace(/\D/g, '').slice(0, 16)})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none text-secondary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Mes Exp.</label>
          <input 
            required
            type="number"
            min="1"
            max="12"
            placeholder="MM"
            value={formData.exp_month}
            onChange={(e) => setFormData({...formData, exp_month: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none text-secondary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Año Exp.</label>
          <input 
            required
            type="number"
            min="2024"
            max="2040"
            placeholder="YYYY"
            value={formData.exp_year}
            onChange={(e) => setFormData({...formData, exp_year: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none text-secondary"
          />
        </div>
        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] text-gray-500 font-black uppercase tracking-widest px-1">Marca</label>
          <select 
            value={formData.brand}
            onChange={(e) => setFormData({...formData, brand: e.target.value})}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-primary/50 outline-none text-secondary appearance-none"
          >
            <option value="Visa">Visa</option>
            <option value="Mastercard">Mastercard</option>
            <option value="American Express">American Express</option>
          </select>
        </div>
        <div className="md:col-span-2 flex items-center gap-3">
          <input 
            type="checkbox"
            id="isDefaultCard"
            checked={formData.is_default}
            onChange={(e) => setFormData({...formData, is_default: e.target.checked})}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
          />
          <label htmlFor="isDefaultCard" className="text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer">Tarjeta Predeterminada</label>
        </div>
        <div className="md:col-span-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 text-[10px] font-black uppercase italic tracking-widest flex items-center justify-center gap-2"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Tarjeta Segura
          </Button>
        </div>
      </form>
    </div>
  );
};
