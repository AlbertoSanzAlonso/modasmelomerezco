import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Tag, Pencil, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/useCartStore';
import { DiscountSubcategoryPicker } from './DiscountSubcategoryPicker';
import type { DiscountCode, DiscountCodeInput, DiscountType } from '@/types';

const emptyForm = (): DiscountCodeInput => ({
  code: '',
  discount_type: 'percent',
  discount_value: 10,
  is_active: true,
  starts_at: null,
  expires_at: null,
  max_uses: null,
  subcategory_ids: [],
});

function formatDiscount(dc: DiscountCode): string {
  return dc.discount_type === 'percent'
    ? `${dc.discount_value}%`
    : `${dc.discount_value.toFixed(2)}€`;
}

function toDatetimeLocal(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value.trim()) return null;
  return new Date(value).toISOString();
}

export const DiscountCodesTab: React.FC = () => {
  const queryClient = useQueryClient();
  const openModal = useCartStore((s) => s.openModal);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<DiscountCodeInput>(emptyForm());

  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['admin-discount-codes'],
    queryFn: () => api.discountCodes.getAll(),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.categories.getAll(),
  });

  const { data: subcategories = [] } = useQuery({
    queryKey: ['admin-subcategories'],
    queryFn: () => api.categories.getSubcategories(),
  });

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.code.trim()) throw new Error('El código es obligatorio.');
      if (form.discount_value <= 0) throw new Error('El valor del descuento debe ser mayor que 0.');
      if (form.discount_type === 'percent' && form.discount_value > 100) {
        throw new Error('El porcentaje no puede superar 100.');
      }
      const payload: DiscountCodeInput = { ...form };
      if (editingId) return api.discountCodes.update(editingId, payload);
      return api.discountCodes.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-discount-codes'] });
      resetForm();
      openModal({
        title: editingId ? 'Código actualizado' : 'Código creado',
        message: 'Los cambios se han guardado correctamente.',
        type: 'info',
        actionLabel: 'Aceptar',
      });
    },
    onError: (err: Error) => {
      openModal({
        title: 'Error',
        message: err.message || 'No se pudo guardar el código.',
        type: 'warning',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.discountCodes.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-discount-codes'] });
      if (editingId) resetForm();
    },
    onError: (err: Error) => {
      openModal({
        title: 'Error',
        message: err.message || 'No se pudo eliminar el código.',
        type: 'warning',
      });
    },
  });

  const startEdit = (dc: DiscountCode) => {
    setEditingId(dc.id);
    setForm({
      code: dc.code,
      discount_type: dc.discount_type,
      discount_value: dc.discount_value,
      is_active: dc.is_active,
      starts_at: dc.starts_at ?? null,
      expires_at: dc.expires_at ?? null,
      max_uses: dc.max_uses ?? null,
      subcategory_ids: dc.subcategory_ids ?? [],
    });
  };

  const subcategoryNameById = new Map(subcategories.map((s) => [s.id, s.name]));

  const formatSubcategories = (ids?: number[]): string => {
    if (!ids?.length) return '—';
    return ids.map((id) => subcategoryNameById.get(id) || `#${id}`).join(', ');
  };

  const confirmDelete = (dc: DiscountCode) => {
    openModal({
      title: 'Eliminar código',
      message: `¿Eliminar el código "${dc.code}"? Se quitará de productos y subcategorías vinculados.`,
      type: 'confirm',
      onConfirm: () => deleteMutation.mutate(dc.id),
    });
  };

  return (
    <div className="space-y-10">
      <div>
        <h2 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-3">
          <Tag className="w-8 h-8 text-primary" />
          Códigos de descuento
        </h2>
        <p className="text-gray-500 text-sm mt-2">
          Crea códigos y aplícalos a subcategorías completas (pantalones, bolsos…) o a productos
          concretos desde la ficha de cada pieza.
        </p>
      </div>

      <div className="bg-(--bg-card) border border-(--border-main) p-8 md:p-10 rounded-[2.5rem] shadow-sm space-y-6">
        <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary">
          {editingId ? 'Editar código' : 'Nuevo código'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Código</label>
            <input
              type="text"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="VERANO15"
              className="w-full bg-(--bg-main) border border-(--border-main) rounded-xl px-4 py-3 text-sm font-bold uppercase focus:border-primary outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Tipo</label>
            <select
              value={form.discount_type}
              onChange={(e) =>
                setForm({ ...form, discount_type: e.target.value as DiscountType })
              }
              className="w-full bg-(--bg-main) border border-(--border-main) rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none"
            >
              <option value="percent">Porcentaje (%)</option>
              <option value="fixed">Importe fijo (€)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Valor {form.discount_type === 'percent' ? '(%)' : '(€)'}
            </label>
            <input
              type="number"
              min={0.01}
              max={form.discount_type === 'percent' ? 100 : undefined}
              step={form.discount_type === 'percent' ? 1 : 0.01}
              value={form.discount_value}
              onChange={(e) =>
                setForm({ ...form, discount_value: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-(--bg-main) border border-(--border-main) rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Válido desde
            </label>
            <input
              type="datetime-local"
              value={toDatetimeLocal(form.starts_at)}
              onChange={(e) =>
                setForm({ ...form, starts_at: fromDatetimeLocal(e.target.value) })
              }
              className="w-full bg-(--bg-main) border border-(--border-main) rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Válido hasta
            </label>
            <input
              type="datetime-local"
              value={toDatetimeLocal(form.expires_at)}
              onChange={(e) =>
                setForm({ ...form, expires_at: fromDatetimeLocal(e.target.value) })
              }
              className="w-full bg-(--bg-main) border border-(--border-main) rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Máx. usos (vacío = ilimitado)
            </label>
            <input
              type="number"
              min={1}
              value={form.max_uses ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  max_uses: e.target.value ? parseInt(e.target.value, 10) : null,
                })
              }
              className="w-full bg-(--bg-main) border border-(--border-main) rounded-xl px-4 py-3 text-sm font-bold focus:border-primary outline-none"
            />
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active ?? true}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-[10px] font-black uppercase tracking-widest text-(--text-main)">
            Código activo
          </span>
        </label>

        <div className="space-y-3 pt-4 border-t border-(--border-main)">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">
              Subcategorías
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
              El descuento aplicará a todos los productos de las subcategorías seleccionadas.
            </p>
          </div>
          <DiscountSubcategoryPicker
            categories={categories}
            subcategories={subcategories}
            selectedIds={form.subcategory_ids ?? []}
            onChange={(subcategory_ids) => setForm({ ...form, subcategory_ids })}
          />
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            isLoading={saveMutation.isPending}
            className="font-black uppercase tracking-widest italic"
          >
            {editingId ? 'Guardar cambios' : 'Crear código'}
          </Button>
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancelar edición
            </Button>
          )}
        </div>
      </div>

      <div className="bg-(--bg-card) border border-(--border-main) overflow-hidden rounded-[2.5rem] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="border-b border-(--border-main) bg-(--bg-main)/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Código</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Descuento</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Subcategorías</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Estado</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary">Usos</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.4em] text-primary text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--border-main)">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-sm text-gray-400">
                    Cargando…
                  </td>
                </tr>
              ) : codes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-sm text-gray-400 italic">
                    No hay códigos. Crea el primero arriba o ejecuta la migración SQL en Supabase.
                  </td>
                </tr>
              ) : (
                codes.map((dc) => (
                  <tr key={dc.id} className="hover:bg-primary/5 transition-colors">
                    <td className="px-8 py-6 text-sm font-black uppercase tracking-wide">{dc.code}</td>
                    <td className="px-8 py-6 text-sm font-bold">{formatDiscount(dc)}</td>
                    <td className="px-8 py-6 text-xs text-gray-500 max-w-[200px]">
                      {formatSubcategories(dc.subcategory_ids)}
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                          dc.is_active
                            ? 'bg-primary/10 text-primary'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {dc.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-500">
                      {dc.used_count}
                      {dc.max_uses != null ? ` / ${dc.max_uses}` : ''}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(dc)}
                          className="p-2 text-gray-400 hover:text-primary transition-colors"
                          aria-label="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => confirmDelete(dc)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
