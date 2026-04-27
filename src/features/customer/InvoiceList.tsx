import React from 'react';
import { FileText, Download, Calendar } from 'lucide-react';

export const InvoiceList: React.FC = () => {
  const invoices = [
    { id: 'FAC-2024-001', orderId: '#ORD-7231', date: '22 Abr, 2024', amount: '124.00€' },
    { id: 'FAC-2024-002', orderId: '#ORD-6912', date: '10 Abr, 2024', amount: '89.50€' },
    { id: 'FAC-2024-003', orderId: '#ORD-6543', date: '28 Mar, 2024', amount: '210.00€' },
  ];

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-4xl font-display font-black uppercase tracking-tighter mb-2">
          Mis <span className="italic font-serif lowercase text-primary">facturas</span>
        </h1>
        <p className="text-gray-500 font-medium">Descarga tus facturas legales para contabilidad o garantía.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="p-8 bg-white/5 border border-white/10 rounded-3xl hover:border-primary/30 transition-all group">
            <div className="flex items-start justify-between mb-8">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6" />
              </div>
              <button className="p-3 bg-white/10 rounded-xl hover:bg-primary hover:text-white transition-all">
                <Download className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Nº Factura</p>
                <p className="font-black text-lg uppercase">{invoice.id}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Pedido</p>
                  <p className="font-bold text-xs">{invoice.orderId}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Importe</p>
                  <p className="font-black text-xs">{invoice.amount}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-2 text-[10px] text-gray-400 font-medium">
                <Calendar className="w-3 h-3" />
                <span>Emitida el {invoice.date}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
