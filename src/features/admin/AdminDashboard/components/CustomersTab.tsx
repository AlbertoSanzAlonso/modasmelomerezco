
import React from 'react';
import { Plus, Search, Mail, MailOff } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import type { Customer } from "@/types";

interface CustomersTabProps {
  customers?: (Customer & { is_subscribed?: boolean })[];
  totalCustomers: number;
  customerPage: number;
  pageSize: number;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onPageChange: (page: number) => void;
  onCreate: () => void;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  customers,
  totalCustomers,
  customerPage,
  pageSize,
  searchTerm,
  onSearchChange,
  onPageChange,
  onCreate
}) => {
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Gestión de Clientes</h2>
          <p className="text-gray-500 text-sm">Administra la base de usuarios y sus accesos.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="Buscar por nombre, email, tel..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-(--bg-card) border border-(--border-main) rounded-2xl pl-12 pr-4 py-3 text-xs font-bold focus:outline-none focus:border-primary transition-all"
            />
          </div>
          <Button size="sm" className="font-black tracking-widest text-[10px] px-8 w-full sm:w-auto" onClick={onCreate}>
            <Plus className="w-4 h-4 mr-2" /> NUEVO CLIENTE
          </Button>
        </div>
      </div>

      <div className="bg-(--bg-card) border border-(--border-main) overflow-hidden rounded-[2.5rem] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-(--border-main) bg-(--bg-main)/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Cliente</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Email</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Teléfono</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary text-center">Newsletter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-main)">
              {customers?.map((customer) => (
                <tr key={customer.customer_id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold uppercase italic text-(--text-main)">{customer.name} {customer.surname}</p>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">ID: {customer.customer_id.split('-')[0]}</p>
                  </td>
                  <td className="px-8 py-6 text-xs text-gray-500 font-bold">{customer.email}</td>
                  <td className="px-8 py-6 text-xs text-gray-500 font-bold">{customer.phone || '-'}</td>
                  <td className="px-8 py-6">
                    <div className="flex justify-center">
                      {customer.is_subscribed ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500/5 text-green-500 border border-green-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                          <Mail className="w-3 h-3" /> Suscrito
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-500/5 text-gray-400 border border-gray-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                          <MailOff className="w-3 h-3" /> No Suscrito
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {customers?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-gray-400 font-bold italic">
                    No se encontraron clientes para la búsqueda "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-center items-center gap-4 mt-10 pb-10">
          <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, customerPage - 1))} disabled={customerPage === 1} className="text-[10px] font-black uppercase tracking-widest px-6">Anterior</Button>
          <span className="text-[10px] font-black text-primary bg-primary/10 px-4 py-2 rounded-lg">PÁGINA {customerPage}</span>
          <Button variant="outline" size="sm" onClick={() => onPageChange(customerPage + 1)} disabled={!customers || customers.length < pageSize} className="text-[10px] font-black uppercase tracking-widest px-6">Siguiente</Button>
        </div>
      </div>
    </div>
  );
};
