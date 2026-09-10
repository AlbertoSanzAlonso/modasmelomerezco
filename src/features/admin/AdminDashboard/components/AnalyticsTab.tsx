import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Eye, Loader2, Smartphone, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { AnalyticsApiError, type AnalyticsRange } from '@/lib/api/analytics';
import { useAdminStore } from '@/store/useAdminStore';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-ES').format(value);
}

function formatDayLabel(isoDate: string): string {
  if (!isoDate) return '';
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

function deviceLabel(device: string): string {
  const map: Record<string, string> = {
    desktop: 'Escritorio',
    mobile: 'Móvil',
    tablet: 'Tablet',
    unknown: 'Desconocido',
  };
  return map[device.toLowerCase()] || device;
}

export const AnalyticsTab: React.FC = () => {
  const adminToken = useAdminStore((s) => s.adminToken);
  const [range, setRange] = useState<AnalyticsRange>(7);

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['admin-analytics', range],
    queryFn: () => {
      if (!adminToken) throw new AnalyticsApiError('Sesión de admin no disponible', 401);
      return api.analytics.getAdminOverview(adminToken, range);
    },
    enabled: !!adminToken,
    staleTime: 60_000,
    retry: 1,
  });

  const maxDailyViews = useMemo(() => {
    if (!data?.daily?.length) return 1;
    return Math.max(1, ...data.daily.map((d) => d.pageviews));
  }, [data?.daily]);

  const apiError = error instanceof AnalyticsApiError ? error : null;
  const notConfigured = apiError?.code === 'NOT_CONFIGURED' || apiError?.status === 503;

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">Analíticas</h2>
          <p className="text-gray-500 text-sm">Tráfico de la web vía Vercel Web Analytics.</p>
        </div>

        <div className="flex items-center gap-2 bg-(--bg-card) border border-(--border-main) rounded-2xl p-1">
          {([7, 30] as AnalyticsRange[]).map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => setRange(days)}
              className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-colors ${
                range === days
                  ? 'bg-primary text-white'
                  : 'text-gray-500 hover:text-primary'
              }`}
            >
              {days} días
            </button>
          ))}
        </div>
      </div>

      {!adminToken && (
        <div className="p-12 text-center text-gray-500 text-xs font-bold uppercase italic border border-(--border-main) rounded-3xl">
          Inicia sesión de nuevo para ver las analíticas.
        </div>
      )}

      {adminToken && isLoading && (
        <div className="flex items-center justify-center gap-3 py-24 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Cargando métricas…</span>
        </div>
      )}

      {adminToken && !isLoading && notConfigured && (
        <div className="bg-(--bg-card) border border-primary/20 rounded-3xl p-10 space-y-4">
          <div className="flex items-center gap-3 text-primary">
            <BarChart3 className="w-6 h-6" />
            <h3 className="text-sm font-black uppercase tracking-[0.25em]">Configuración pendiente</h3>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">
            Añade en Vercel (Production) la variable{' '}
            <code className="text-primary">WEB_ANALYTICS_TOKEN</code> (token de Account Settings → Tokens).
            No crees <code className="text-primary">VERCEL_TOKEN</code> ni{' '}
            <code className="text-primary">VERCEL_PROJECT_ID</code> a mano: el project ID lo aporta el sistema.
          </p>
        </div>
      )}

      {adminToken && !isLoading && error && !notConfigured && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-10 text-center space-y-3">
          <p className="text-sm font-bold text-red-500 uppercase tracking-widest">
            {(error as Error).message || 'No se pudieron cargar las analíticas'}
          </p>
          {apiError?.status === 401 && (
            <p className="text-xs text-gray-500">
              Tu sesión ha caducado. Cierra sesión y vuelve a entrar en el admin.
            </p>
          )}
        </div>
      )}

      {adminToken && !isLoading && data && (
        <div className={`space-y-8 ${isFetching ? 'opacity-70 transition-opacity' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-(--bg-card) border border-(--border-main) rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Visitantes</p>
              </div>
              <p className="text-4xl font-black tracking-tighter italic text-(--text-main)">
                {formatNumber(data.totals.visitors)}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">
                Últimos {range} días
              </p>
            </div>

            <div className="bg-(--bg-card) border border-(--border-main) rounded-3xl p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Eye className="w-5 h-5" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">Páginas vistas</p>
              </div>
              <p className="text-4xl font-black tracking-tighter italic text-(--text-main)">
                {formatNumber(data.totals.pageviews)}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">
                {data.since} → {data.until}
              </p>
            </div>
          </div>

          <div className="bg-(--bg-card) border border-(--border-main) rounded-3xl overflow-hidden shadow-sm">
            <div className="p-8 border-b border-(--border-main)">
              <h3 className="font-black uppercase tracking-widest text-xs text-(--text-main)">
                Tendencia diaria
              </h3>
            </div>
            <div className="p-8">
              {data.daily.length === 0 ? (
                <p className="text-center text-gray-500 text-xs font-bold uppercase italic py-8">
                  Aún no hay datos en este periodo
                </p>
              ) : (
                <div className="flex items-end gap-2 sm:gap-3 h-48">
                  {data.daily.map((point) => {
                    const heightPct = Math.max(4, (point.pageviews / maxDailyViews) * 100);
                    return (
                      <div key={point.date} className="flex-1 min-w-0 flex flex-col items-center gap-2 h-full justify-end">
                        <span className="text-[9px] font-bold text-gray-500 tabular-nums">
                          {point.pageviews > 0 ? formatNumber(point.pageviews) : ''}
                        </span>
                        <div
                          className="w-full max-w-10 rounded-t-lg bg-primary/80 hover:bg-primary transition-colors"
                          style={{ height: `${heightPct}%` }}
                          title={`${point.date}: ${point.pageviews} vistas / ${point.visitors} visitantes`}
                        />
                        <span className="text-[8px] font-black uppercase tracking-wider text-gray-400 truncate w-full text-center">
                          {formatDayLabel(point.date)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-(--bg-card) border border-(--border-main) rounded-3xl overflow-hidden shadow-sm">
              <div className="p-8 border-b border-(--border-main)">
                <h3 className="font-black uppercase tracking-widest text-xs text-(--text-main)">
                  Páginas más visitadas
                </h3>
              </div>
              <div className="divide-y divide-(--border-main)">
                {data.topPaths.length === 0 && (
                  <p className="p-8 text-center text-gray-500 text-xs font-bold uppercase italic">
                    Sin datos de rutas
                  </p>
                )}
                {data.topPaths.map((row) => (
                  <div key={row.path} className="px-8 py-5 flex items-center justify-between gap-4">
                    <p className="text-xs font-bold text-(--text-main) truncate" title={row.path}>
                      {row.path || '/'}
                    </p>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-primary">{formatNumber(row.pageviews)}</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">
                        {formatNumber(row.visitors)} visit.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-(--bg-card) border border-(--border-main) rounded-3xl overflow-hidden shadow-sm">
              <div className="p-8 border-b border-(--border-main) flex items-center gap-3">
                <Smartphone className="w-4 h-4 text-primary" />
                <h3 className="font-black uppercase tracking-widest text-xs text-(--text-main)">
                  Dispositivos
                </h3>
              </div>
              <div className="divide-y divide-(--border-main)">
                {data.devices.length === 0 && (
                  <p className="p-8 text-center text-gray-500 text-xs font-bold uppercase italic">
                    Sin datos de dispositivos
                  </p>
                )}
                {data.devices.map((row) => (
                  <div key={row.device} className="px-8 py-5 flex items-center justify-between gap-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-(--text-main)">
                      {deviceLabel(row.device)}
                    </p>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-primary">{formatNumber(row.pageviews)}</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">
                        {formatNumber(row.visitors)} visit.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
