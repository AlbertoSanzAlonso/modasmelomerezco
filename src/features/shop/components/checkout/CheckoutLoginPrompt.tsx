import React from 'react';
import { Link } from 'react-router-dom';
import { User, LogIn } from 'lucide-react';
import { Button } from "@/components/ui/Button";

export const CheckoutLoginPrompt: React.FC = () => {
  return (
    <div className="mb-12 p-8 bg-primary/5 border border-primary/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-black uppercase tracking-widest italic">¿Ya eres cliente?</h4>
          <p className="text-[10px] text-secondary/60 uppercase tracking-widest font-medium">Inicia sesión para usar tus datos guardados.</p>
        </div>
      </div>
      <Link to="/login" state={{ from: '/checkout' }}>
        <Button variant="outline" size="sm" className="px-8 border-primary/30 text-primary hover:bg-primary hover:text-white flex items-center gap-2">
          <LogIn className="w-4 h-4" /> INICIAR SESIÓN
        </Button>
      </Link>
    </div>
  );
};
