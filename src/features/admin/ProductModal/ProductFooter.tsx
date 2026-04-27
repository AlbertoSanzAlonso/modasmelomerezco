
import React from 'react';
import { Save } from 'lucide-react';
import { Button } from "@/components/ui/Button";

interface ProductFooterProps {
  onCancel: () => void;
}

export const ProductFooter: React.FC<ProductFooterProps> = ({ onCancel }) => {
  return (
    <div className="pt-8 flex flex-col sm:flex-row justify-end gap-4 sm:gap-6">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel} 
        className="w-full sm:w-auto px-12 font-black tracking-widest text-[10px] rounded-xl py-4 order-2 sm:order-1"
      >
        CANCELAR
      </Button>
      <Button 
        type="submit" 
        className="w-full sm:w-auto px-16 font-black tracking-widest text-[10px] italic rounded-xl shadow-lg shadow-primary/20 py-4 order-1 sm:order-2"
      >
         <Save className="w-4 h-4 mr-2" /> GUARDAR PIEZA
      </Button>
    </div>
  );
};
