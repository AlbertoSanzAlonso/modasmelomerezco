
import React from 'react';
import { Button } from "@/components/ui/Button";

interface NewsletterTabProps {
  subscriptions?: any[];
  newsletterSubject: string;
  newsletterContent: string;
  isSendingNewsletter: boolean;
  sendingProgress: { current: number, total: number };
  onSubjectChange: (val: string) => void;
  onContentChange: (val: string) => void;
  onSend: () => void;
}

export const NewsletterTab: React.FC<NewsletterTabProps> = ({
  subscriptions,
  newsletterSubject,
  newsletterContent,
  isSendingNewsletter,
  sendingProgress,
  onSubjectChange,
  onContentChange,
  onSend
}) => {
  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Newsletter</h2>
          <p className="text-gray-500 text-sm">
            Envía comunicados a tus {subscriptions?.filter(s => s.status === 'active').length || 0} suscriptores activos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-(--bg-card) border border-(--border-main) p-10 rounded-[2.5rem] shadow-sm space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary">Asunto del Correo</label>
              <input 
                type="text"
                value={newsletterSubject}
                onChange={(e) => onSubjectChange(e.target.value)}
                placeholder="Ej: ¡Nueva colección de primavera disponible!"
                className="w-full bg-(--bg-main) border border-(--border-main) rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary">Contenido del Mensaje</label>
              <textarea 
                value={newsletterContent}
                onChange={(e) => onContentChange(e.target.value)}
                placeholder="Escribe aquí el cuerpo del mensaje..."
                rows={12}
                className="w-full bg-(--bg-main) border border-(--border-main) rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:border-primary/50 transition-all resize-none"
              />
            </div>

            <div className="pt-4">
              <Button 
                className="w-full py-6 font-black tracking-widest uppercase italic"
                disabled={isSendingNewsletter || !newsletterSubject || !newsletterContent}
                isLoading={isSendingNewsletter}
                onClick={onSend}
              >
                {isSendingNewsletter ? `ENVIANDO... (${sendingProgress.current}/${sendingProgress.total})` : 'ENVIAR A TODOS LOS SUSCRIPTORES'}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-primary/5 border border-primary/20 p-8 rounded-4xl space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-primary italic">Vista Previa</h3>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-inner overflow-hidden max-h-[500px] overflow-y-auto">
              <div className="text-center mb-6">
                <img src="https://vyus42nj.insforge.site/assets/logo/LOGO%20MELOMEREZCO%20completo%20color.png" alt="Logo" className="w-32 mx-auto" />
              </div>
              <div className="text-xs text-gray-800 space-y-4 leading-relaxed whitespace-pre-wrap">
                {newsletterContent || 'El contenido de tu newsletter aparecerá aquí...'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
