import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const SecurityBanner: React.FC = () => {
  return (
    <div className="lg:col-span-2 p-6 bg-green-500/5 border border-green-500/20 rounded-2xl flex items-center gap-6">
      <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
        <ShieldCheck className="w-6 h-6" />
      </div>
      <div>
        <p className="text-sm font-black uppercase tracking-widest mb-1 text-green-500">Pagos Seguros y Encriptados</p>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          Tus datos de pago están protegidos mediante cifrado SSL de 256 bits y cumplen con la normativa PCI-DSS. Nunca almacenamos tu código de seguridad CVV.
        </p>
      </div>
    </div>
  );
};
