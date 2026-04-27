import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, Plus } from 'lucide-react';
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";
import { api } from "@/lib/api";
import type { Address } from '@/types';
import { CITIES_BY_PROVINCE } from "@/constants/locations";

// Sub-components
import { ProfileForm } from './components/ProfileForm';
import { AddressForm } from './components/AddressForm';
import { AddressCard } from './components/AddressCard';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { openModal } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState<number | 'new' | null>(null);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    surname: user?.surname || '',
    phone: user?.phone || '',
  });

  const [addressForm, setAddressForm] = useState<Partial<Address>>({
    type: 'Principal',
    street: '',
    floor: '',
    door: '',
    stair: '',
    province: '',
    city: '',
    zip: '',
    location_id: undefined,
    isDefault: false
  });

  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        surname: user.surname || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  // Zip Code Autocomplete Logic
  useEffect(() => {
    const fetchLocation = async () => {
      if (addressForm.zip && addressForm.zip.length === 5) {
        setIsLocating(true);
        try {
          const result = await api.locations.getByZip(addressForm.zip);
          if (result) {
            setAddressForm(prev => ({
              ...prev,
              city: result.city,
              province: result.province,
              location_id: 'id' in result ? result.id : undefined
            }));
          }
        } catch (error) {
          console.error('Location fetch error:', error);
        } finally {
          setIsLocating(false);
        }
      }
    };
    fetchLocation();
  }, [addressForm.zip]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);
    try {
      await api.customers.update(user.customer_id, profileData);
      updateUser(profileData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProvinceChange = (newProv: string) => {
    setAddressForm({
      ...addressForm,
      province: newProv,
      city: '',
      zip: ''
    });
  };

  const handleCityChange = (newCity: string) => {
    if (newCity === 'otra') {
      setAddressForm({ ...addressForm, city: '' });
      return;
    }

    let detectedProv = addressForm.province;
    if (!detectedProv) {
      for (const [prov, cities] of Object.entries(CITIES_BY_PROVINCE)) {
        if ((cities as string[]).includes(newCity)) {
          detectedProv = prov;
          break;
        }
      }
    }

    setAddressForm({
      ...addressForm,
      city: newCity,
      province: detectedProv
    });
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    const newAddress: Address = {
      ...addressForm,
      type: addressForm.type || 'Principal',
      street: addressForm.street || '',
      floor: addressForm.floor,
      door: addressForm.door,
      stair: addressForm.stair,
      province: addressForm.province || '',
      city: addressForm.city || '',
      zip: addressForm.zip || '',
      location_id: addressForm.location_id,
      isDefault: !user.addresses?.length || addressForm.isDefault
    } as Address;

    try {
      if (isEditingAddress === 'new') {
        await api.addresses.create(user.customer_id, newAddress);
      } else if (typeof isEditingAddress === 'number') {
        await api.addresses.update(isEditingAddress, newAddress);
        if (newAddress.isDefault) {
          await api.addresses.setDefault(user.customer_id, isEditingAddress);
        }
      }

      const updatedUser = await api.customers.getById(user.customer_id);
      updateUser(updatedUser);
      
      setIsEditingAddress(null);
      resetAddressForm();
    } catch (error) {
      console.error(error);
      alert('Error al guardar la dirección');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAddress = async (id: number) => {
    if (!user) return;
    
    openModal({
      title: '¿Eliminar dirección?',
      message: 'Esta acción no se puede deshacer. ¿Estás seguro de que quieres eliminar esta dirección de envío?',
      type: 'confirm',
      onConfirm: async () => {
        try {
          await api.addresses.delete(id);
          const updatedUser = await api.customers.getById(user.customer_id);
          updateUser(updatedUser);
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const resetAddressForm = () => {
    setAddressForm({
      type: 'Principal',
      street: '',
      floor: '',
      door: '',
      stair: '',
      province: '',
      city: '',
      zip: '',
      location_id: undefined,
      isDefault: false
    });
  };

  const startEdit = (addr: Address) => {
    setAddressForm({
      type: addr.type,
      street: addr.street,
      floor: addr.floor || '',
      door: addr.door || '',
      stair: addr.stair || '',
      province: addr.province || '',
      city: addr.city,
      zip: addr.zip,
      location_id: addr.location_id,
      isDefault: addr.isDefault || false
    });
    setIsEditingAddress(addr.shipping_address_id || null);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sincronizando sesión...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-5xl">
      <header>
        <h1 className="text-4xl font-display font-black uppercase tracking-tighter mb-2">
          Mi <span className="italic font-serif lowercase text-primary">perfil</span>
        </h1>
        <p className="text-gray-500 font-medium">Gestiona tus datos personales y direcciones de envío.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-8">
          <ProfileForm 
            user={user}
            profileData={profileData}
            setProfileData={setProfileData}
            isLoading={isLoading}
            onSubmit={handleProfileSubmit}
          />
        </div>

        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black uppercase tracking-widest italic flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" /> Mis Direcciones
              </h3>
              {!isEditingAddress && (
                <button 
                  onClick={() => {
                    resetAddressForm();
                    setIsEditingAddress('new');
                  }}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-secondary hover:scale-105 transition-all"
                >
                  <Plus className="w-4 h-4" /> Añadir Nueva
                </button>
              )}
            </div>

            {isEditingAddress ? (
              <AddressForm 
                formData={addressForm}
                setFormData={setAddressForm}
                isLocating={isLocating}
                isLoading={isLoading}
                isEditing={isEditingAddress}
                onSubmit={handleAddressSubmit}
                onCancel={() => setIsEditingAddress(null)}
                onProvinceChange={handleProvinceChange}
                onCityChange={handleCityChange}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {user.addresses && user.addresses.length > 0 ? (
                  user.addresses.map((addr) => (
                    <AddressCard 
                      key={addr.shipping_address_id || addr.type}
                      address={addr}
                      onEdit={startEdit}
                      onDelete={deleteAddress}
                    />
                  ))
                ) : (
                  <div className="col-span-2 py-20 text-center bg-white/5 border border-dashed border-white/10 rounded-3xl">
                    <MapPin className="w-8 h-8 text-gray-600 mx-auto mb-4" />
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500">No tienes direcciones guardadas</p>
                    <button onClick={() => setIsEditingAddress('new')} className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary hover:underline">Añade tu primera dirección</button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
