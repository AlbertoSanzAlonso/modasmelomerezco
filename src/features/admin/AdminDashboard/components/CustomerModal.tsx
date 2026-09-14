import React, { useEffect, useState } from 'react';
import { Loader2, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Customer } from '@/types';

export type CustomerFormData = {
  name: string;
  surname: string;
  email: string;
  phone: string;
};

interface CustomerModalProps {
  customer: Customer | null;
  onClose: () => void;
  onSave: (data: CustomerFormData) => void;
  onDelete?: (customer: Customer) => void;
  isSaving?: boolean;
}

const emptyForm = (): CustomerFormData => ({
  name: '',
  surname: '',
  email: '',
  phone: '',
});

export const CustomerModal: React.FC<CustomerModalProps> = ({
  customer,
  onClose,
  onSave,
  onDelete,
  isSaving = false,
}) => {
  const [form, setForm] = useState<CustomerFormData>(emptyForm);
  const isEdit = !!customer;

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || '',
        surname: customer.surname || '',
        email: customer.email || '',
        phone: customer.phone || '',
      });
    } else {
      setForm(emptyForm());
    }
  }, [customer]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    onSave({
      name: form.name.trim(),
      surname: form.surname.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center p-6 bg-secondary/80 backdrop-blur-sm">
      <div className="bg-(--bg-main) border border-(--border-main) w-full max-w-lg rounded-[2.5rem] shadow-2xl shadow-primary/5 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-8 border-b border-(--border-main) flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-display font-black uppercase tracking-tighter italic text-(--text-main)">
              {isEdit ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            {isEdit && (
              <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-1">
                ID: {customer.customer_id.split('-')[0]}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-2 hover:bg-primary/10 rounded-full transition-all text-(--text-main) disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Nombre</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-(--bg-card) border border-(--border-main) rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Apellidos</label>
              <input
                type="text"
                value={form.surname}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                className="w-full bg-(--bg-card) border border-(--border-main) rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-(--bg-card) border border-(--border-main) rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Teléfono</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full bg-(--bg-card) border border-(--border-main) rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
            {isEdit && onDelete ? (
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={() => onDelete(customer)}
                className="w-full sm:w-auto font-black tracking-widest text-[10px] rounded-xl py-3 text-red-500 border-red-500/30 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4 mr-2" /> ELIMINAR
              </Button>
            ) : (
              <span />
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                disabled={isSaving}
                onClick={onClose}
                className="w-full sm:w-auto px-8 font-black tracking-widest text-[10px] rounded-xl py-3"
              >
                CANCELAR
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="w-full sm:w-auto px-10 font-black tracking-widest text-[10px] italic rounded-xl py-3"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {isSaving ? 'GUARDANDO...' : 'GUARDAR'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
