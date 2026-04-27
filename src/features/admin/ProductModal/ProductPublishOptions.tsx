
import React from 'react';

interface ProductPublishOptionsProps {
  isNew: boolean;
  isPublished: boolean;
  onNewChange: (value: boolean) => void;
  onPublishedChange: (value: boolean) => void;
}

export const ProductPublishOptions: React.FC<ProductPublishOptionsProps> = ({
  isNew,
  isPublished,
  onNewChange,
  onPublishedChange
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-8 py-6 border-y border-[var(--border-main)]">
      <div className="flex items-center gap-4">
        <input 
          type="checkbox" 
          id="is_new"
          className="accent-primary w-5 h-5 rounded-md"
          checked={!!isNew}
          onChange={(e) => onNewChange(e.target.checked)}
        />
        <label htmlFor="is_new" className="text-[10px] font-black uppercase tracking-[0.4em] cursor-pointer text-[var(--text-main)]">Marcar como Novedad</label>
      </div>

      <div className="flex items-center gap-4">
        <input 
          type="checkbox" 
          id="is_published"
          className="accent-primary w-5 h-5 rounded-md"
          checked={!!isPublished}
          onChange={(e) => onPublishedChange(e.target.checked)}
        />
        <label htmlFor="is_published" className="text-[10px] font-black uppercase tracking-[0.4em] cursor-pointer text-[var(--text-main)]">Publicado en la Web</label>
      </div>
    </div>
  );
};
