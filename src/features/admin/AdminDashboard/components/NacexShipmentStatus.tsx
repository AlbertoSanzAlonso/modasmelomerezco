import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { NacexShipmentStatus, NacexTrackingEvent } from '@/lib/api/shipping';

function statusTone(status: string): string {
  const value = status.toLowerCase();
  if (/entreg|disponible/.test(value)) return 'bg-green-500/15 text-green-700';
  if (/incidenc|anulad|ausente|devuel/.test(value)) return 'bg-red-500/15 text-red-600';
  if (/tr[aá]nsito|reparto|aceptada|recog|solicitada/.test(value)) return 'bg-primary/15 text-primary';
  return 'bg-yellow-500/15 text-yellow-700';
}

function EventLine({ event }: { event: NacexTrackingEvent }) {
  const when = [event.date, event.time].filter(Boolean).join(' ');
  return (
    <li className="grid grid-cols-[88px_1fr] gap-3">
      <span className="text-[9px] font-bold uppercase tracking-wide text-gray-400">{when}</span>
      <span className="text-[10px] font-black uppercase leading-tight text-(--text-main)">
        {event.status}
        {event.place ? <span className="block font-bold normal-case text-gray-500">{event.place}</span> : null}
      </span>
    </li>
  );
}

export const NacexShipmentStatusPanel: React.FC<{
  trackingNumber: string;
  labelUnavailable?: boolean;
}> = ({ trackingNumber, labelUnavailable = false }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shipment, setShipment] = useState<NacexShipmentStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setShipment(null);

    api.shipping.getNacexStatus(trackingNumber)
      .then((status) => {
        if (!cancelled) setShipment(status);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo consultar el estado en Nacex.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trackingNumber]);

  const timeline = shipment ? [...shipment.events].reverse() : [];

  return (
    <div className="space-y-3 rounded-2xl border border-primary/20 bg-white/70 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[9px] font-black uppercase tracking-widest text-primary">Estado del envío</span>
        {shipment && (
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${statusTone(shipment.status)}`}>
            {shipment.status}
          </span>
        )}
      </div>

      {labelUnavailable && (
        <p className="text-[10px] font-bold leading-relaxed text-gray-500">
          Nacex ya no devuelve la etiqueta de esta expedición. El estado del envío es el de abajo.
        </p>
      )}

      {loading && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Consultando Nacex…</p>
      )}

      {!loading && error && (
        <p className="text-[10px] font-bold leading-relaxed text-red-600">{error}</p>
      )}

      {shipment && (
        <>
          <p className="text-[10px] font-bold text-gray-500">
            {[shipment.detail, shipment.date, shipment.time].filter(Boolean).join(' · ')}
          </p>
          {timeline.length > 0 && (
            <ol className="space-y-3 border-t border-primary/10 pt-3">
              {timeline.map((event, index) => (
                <EventLine key={`${event.date}-${event.time}-${event.status}-${index}`} event={event} />
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
};
