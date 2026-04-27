import React, { useState, useEffect } from 'react';
import { Plus, Loader2, CreditCard } from 'lucide-react';
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { api } from "@/lib/api";
import type { PaymentMethod } from '@/types';

// Sub-components
import { PaymentCard } from './components/PaymentCard';
import { AddCardForm } from './components/AddCardForm';
import { SecurityBanner } from './components/SecurityBanner';

export const PaymentMethods: React.FC = () => {
  const { user } = useAuthStore();
  const { openModal } = useCartStore();
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    number: '',
    brand: 'Visa',
    exp_month: '',
    exp_year: '',
    is_default: false
  });

  const fetchCards = async () => {
    if (!user?.customer_id) return;
    try {
      setIsLoading(true);
      const data = await api.paymentMethods.getByCustomer(user.customer_id);
      setCards(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [user]);

  const handleAddCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const last4 = formData.number.slice(-4);
      const token = `tok_${Math.random().toString(36).substr(2, 9)}`;
      
      await api.paymentMethods.create({
        user_id: user.customer_id,
        provider: 'redsys',
        provider_token: token,
        type: 'card',
        last4,
        brand: formData.brand,
        exp_month: parseInt(formData.exp_month),
        exp_year: parseInt(formData.exp_year),
        is_default: formData.is_default
      });

      await fetchCards();
      setIsAdding(false);
      setFormData({ number: '', brand: 'Visa', exp_month: '', exp_year: '', is_default: false });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    openModal({
      title: '¿Eliminar tarjeta?',
      message: '¿Estás seguro de que quieres eliminar este método de pago? Tendrás que volver a introducir los datos en tu próxima compra.',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await api.paymentMethods.delete(id);
          fetchCards();
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const handleSetDefault = async (id: number) => {
    if (!user) return;
    try {
      await api.paymentMethods.setDefault(user.customer_id, id);
      fetchCards();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-display font-black uppercase tracking-tighter mb-2">
            Métodos de <span className="italic font-serif lowercase text-primary">pago</span>
          </h1>
          <p className="text-gray-500 font-medium">Gestiona tus tarjetas y formas de pago seguras.</p>
        </div>
        
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-3 px-6 py-3 bg-white text-black font-black uppercase italic tracking-widest text-[10px] rounded-full hover:bg-primary hover:text-white transition-all shadow-xl shadow-white/5"
        >
          <Plus className="w-4 h-4" />
          Añadir Tarjeta
        </button>
      </header>

      {isAdding && (
        <AddCardForm 
          formData={formData}
          setFormData={setFormData}
          onClose={() => setIsAdding(false)}
          onSubmit={handleAddCard}
          isSubmitting={isSubmitting}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {isLoading || !user?.customer_id ? (
          <div className="lg:col-span-2 py-20 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              {!user?.customer_id ? 'Sincronizando sesión...' : 'Cargando métodos de pago...'}
            </p>
          </div>
        ) : cards.length > 0 ? (
          cards.map((card) => (
            <PaymentCard 
              key={card.id}
              card={card}
              user={user}
              onDelete={handleDelete}
              onSetDefault={handleSetDefault}
            />
          ))
        ) : (
          <div className="lg:col-span-2 py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-[2rem]">
            <CreditCard className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">No tienes tarjetas guardadas</p>
            <button 
              onClick={() => setIsAdding(true)}
              className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline"
            >
              Añade tu primera tarjeta
            </button>
          </div>
        )}

        <SecurityBanner />
      </div>
    </div>
  );
};
