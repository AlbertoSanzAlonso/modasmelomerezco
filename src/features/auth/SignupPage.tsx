import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CITIES_BY_PROVINCE } from "@/constants/locations";

// Sub-components
import { SignupPersonalForm } from './components/SignupPersonalForm';
import { SignupAddressForm } from './components/SignupAddressForm';

export const SignupPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);

  const [address, setAddress] = useState({
    street: '',
    floor: '',
    door: '',
    stair: '',
    province: '',
    city: '',
    zip: '',
    location_id: undefined as number | undefined,
  });

  const [isLocating, setIsLocating] = useState(false);

  // Zip Code Autocomplete Logic
  useEffect(() => {
    const fetchLocation = async () => {
      if (address.zip.length === 5) {
        setIsLocating(true);
        try {
          const result = await api.locations.getByZip(address.zip);
          if (result) {
            setAddress(prev => ({
              ...prev,
              city: result.city,
              province: result.province,
              location_id: (result as any).id
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
  }, [address.zip]);

  const handleProvinceChange = (newProv: string) => {
    setAddress({
      ...address,
      province: newProv,
      city: '',
      zip: ''
    });
  };

  const handleCityChange = (newCity: string) => {
    if (newCity === 'otra') {
      setAddress({ ...address, city: '' });
      return;
    }

    let detectedProv = address.province;
    if (!detectedProv) {
      for (const [prov, cities] of Object.entries(CITIES_BY_PROVINCE)) {
        if ((cities as string[]).includes(newCity)) {
          detectedProv = prov;
          break;
        }
      }
    }

    setAddress({
      ...address,
      city: newCity,
      province: detectedProv
    });
  };

  const setFormData = (field: string, value: string) => {
    switch (field) {
      case 'name': setName(value); break;
      case 'surname': setSurname(value); break;
      case 'email': setEmail(value); break;
      case 'phone': setPhone(value); break;
      case 'password': setPassword(value); break;
      case 'repeatPassword': setRepeatPassword(value); break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== repeatPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    
    try {
      const initialAddress = {
        type: 'Principal',
        ...address,
        isDefault: true
      };

      const { user, token } = await api.auth.signup({
        email,
        name,
        surname,
        password,
        phone,
        addresses: [initialAddress]
      });
      
      login(user, token);
      
      const pendingFavorite = useAuthStore.getState().pendingFavorite;
      if (pendingFavorite) {
        const currentFavorites = user.favorites || [];
        if (!currentFavorites.includes(pendingFavorite)) {
          const newFavorites = [...currentFavorites, pendingFavorite];
          await api.favorites.add(user.customer_id, pendingFavorite);
          useAuthStore.getState().updateUser({ favorites: newFavorites });
        }
        
        useAuthStore.getState().setPendingFavorite(null);
        
        import("@/store/useCartStore").then(m => {
          m.useCartStore.getState().openModal({
            title: '¡Bienvenida!',
            message: 'Hemos guardado el artículo en tu lista de deseos.',
            type: 'success'
          });
        });

        navigate(`/producto/${pendingFavorite}`);
      } else {
        navigate('/');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al crear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-(--bg-main) flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-8 right-8 z-50">
        <ThemeToggle />
      </div>
      
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <img src="/assets/logo/LOGO MELOMEREZCO corona.svg" alt="Logo" className="w-24 h-24 object-contain" />
          </motion.div>
          
          <h1 className="text-4xl font-display font-black text-(--text-main) uppercase tracking-tighter mb-2 transition-colors duration-300">
            Crea tu <span className="italic font-serif lowercase text-primary">cuenta</span>
          </h1>
          <p className="text-gray-500 text-sm font-medium tracking-wide">
            Únete para disfrutar de una experiencia personalizada.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <SignupPersonalForm 
            formData={{ name, surname, email, phone, password, repeatPassword }}
            setFormData={setFormData}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
          />

          <SignupAddressForm 
            address={address}
            setAddress={setAddress}
            isLocating={isLocating}
            onProvinceChange={handleProvinceChange}
            onCityChange={handleCityChange}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-5 bg-(--text-main) text-(--bg-main) font-black uppercase italic tracking-[0.2em] rounded-2xl flex items-center justify-center gap-3 hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                Registrarme
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <Link to="/login" className="text-gray-500 hover:text-primary transition-colors text-[10px] font-black uppercase tracking-[0.3em] italic">
            ¿Ya tienes cuenta?
          </Link>
        </div>
        <div className="pt-6 border-t border-(--border-main)/5">
          <Link to="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-primary transition-colors flex items-center justify-center gap-2">
            <span className="text-lg">←</span> Volver a la tienda
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
