
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/Button";
import type { Customer } from "@/types";

interface CustomersTabProps {
  customers?: Customer[];
  customerPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onCreate: () => void;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({
  customers,
  customerPage,
  pageSize,
  onPageChange,
  onCreate
}) => {
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Gestión de Clientes</h2>
          <p className="text-gray-500 text-sm">Administra la base de usuarios y sus accesos.</p>
        </div>
        <Button size="sm" className="font-black tracking-widest text-[10px] px-8" onClick={onCreate}>
          <Plus className="w-4 h-4 mr-2" /> NUEVO CLIENTE
        </Button>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border-main)] overflow-hidden rounded-[2.5rem] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="border-b border-[var(--border-main)] bg-[var(--bg-main)]/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Cliente</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Email</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Teléfono</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-main)]">
              {customers?.map((customer) => (
                <tr key={customer.customer_id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold uppercase italic text-[var(--text-main)]">{customer.name} {customer.surname}</p>
                  </td>
                  <td className="px-8 py-6 text-xs text-gray-500 font-bold">{customer.email}</td>
                  <td className="px-8 py-6 text-xs text-gray-500 font-bold">{customer.phone || '-'}</td>
                </tr>
              ))}
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
