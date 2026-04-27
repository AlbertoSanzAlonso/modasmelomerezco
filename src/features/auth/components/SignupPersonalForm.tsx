import React from 'react';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

interface SignupPersonalFormProps {
  formData: {
    name: string;
    surname: string;
    email: string;
    phone: string;
    password: string;
    repeatPassword: string;
  };
  setFormData: (field: string, value: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

export const SignupPersonalForm: React.FC<SignupPersonalFormProps> = ({
  formData,
  setFormData,
  showPassword,
  setShowPassword
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData('name', e.target.value)}
            className="block w-full pl-12 pr-4 py-4 bg-(--bg-card) border border-(--border-main) rounded-2xl text-(--text-main) placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
            placeholder="Nombre"
          />
        </div>

        <div className="relative group">
          <input
            type="text"
            required
            value={formData.surname}
            onChange={(e) => setFormData('surname', e.target.value)}
            className="block w-full px-4 py-4 bg-(--bg-card) border border-(--border-main) rounded-2xl text-(--text-main) placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
            placeholder="Apellidos"
          />
        </div>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Mail className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData('email', e.target.value)}
          className="block w-full pl-12 pr-4 py-4 bg-(--bg-card) border border-(--border-main) rounded-2xl text-(--text-main) placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
          placeholder="tu@email.com"
        />
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          required
          value={formData.password}
          onChange={(e) => setFormData('password', e.target.value)}
          className="block w-full pl-12 pr-12 py-4 bg-(--bg-card) border border-(--border-main) rounded-2xl text-(--text-main) placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
          placeholder="Contraseña (mín. 8 caracteres)"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-primary transition-colors"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
        </div>
        <input
          type={showPassword ? 'text' : 'password'}
          required
          value={formData.repeatPassword}
          onChange={(e) => setFormData('repeatPassword', e.target.value)}
          className="block w-full pl-12 pr-12 py-4 bg-(--bg-card) border border-(--border-main) rounded-2xl text-(--text-main) placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
          placeholder="Repetir contraseña"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-primary transition-colors"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <span className="h-5 w-5 text-gray-500 font-black text-xs flex items-center justify-center">#</span>
        </div>
        <input
          type="tel"
          required
          value={formData.phone}
          onChange={(e) => setFormData('phone', e.target.value)}
          className="block w-full pl-12 pr-4 py-4 bg-(--bg-card) border border-(--border-main) rounded-2xl text-(--text-main) placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all font-medium"
          placeholder="Teléfono móvil"
        />
      </div>
    </div>
  );
};
