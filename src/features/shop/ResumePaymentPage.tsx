import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, CreditCard } from 'lucide-react';
import { api } from '@/lib/api';
import { fetchRedsysParameters, REDSYS_URL_PROD, REDSYS_URL_TEST } from '@/lib/redsys';
import { isOrderPaid } from '@/lib/orderPayment';
import { getOrderContact } from '@/lib/orderContact';
import { Button } from '@/components/ui/Button';
import type { Order } from '@/types';

type PageStatus = 'loading' | 'redirecting' | 'paid' | 'error' | 'ready';

function paymentMethodFromOrder(order: Order): 'card' | 'bizum' {
  const method = (order.payment_method || '').toLowerCase();
  return method.includes('bizum') ? 'bizum' : 'card';
}

function submitRedsysForm(params: Record<string, string>) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = import.meta.env.PROD ? REDSYS_URL_PROD : REDSYS_URL_TEST;

  Object.entries(params).forEach(([key, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}

const ResumePaymentPage = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [status, setStatus] = useState<PageStatus>('loading');
  const [order, setOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [redsysParams, setRedsysParams] = useState<Record<string, string> | null>(null);
  const autoSubmitted = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!orderId) {
        setStatus('error');
        setErrorMessage('Enlace de pago no válido.');
        return;
      }

      try {
        const found = await api.orders.getById(orderId);
        if (cancelled) return;

        if (!found) {
          setStatus('error');
          setErrorMessage('No encontramos este pedido.');
          return;
        }

        setOrder(found);

        if (isOrderPaid(found)) {
          setStatus('paid');
          return;
        }

        if (found.order_status === 'Cancelled') {
          setStatus('error');
          setErrorMessage('Este pedido está cancelado y no se puede pagar.');
          return;
        }

        const params = await fetchRedsysParameters(found.order_id, found.total_amount, {
          urlOk: `${window.location.origin}/api/redsys/return-ok`,
          urlKo: `${window.location.origin}/api/redsys/return-ko`,
          urlNotification: `${window.location.origin}/api/webhooks/redsys`,
          productDescription: `Pedido #${found.order_id.split('-')[0].toUpperCase()}`,
          paymentMethod: paymentMethodFromOrder(found),
        });

        if (cancelled) return;
        setRedsysParams(params);
        setStatus('ready');
      } catch (err: any) {
        console.error('Resume payment error:', err);
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(err?.message || 'No se pudo preparar el pago. Inténtalo de nuevo.');
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => {
    if (status !== 'ready' || !redsysParams || autoSubmitted.current) return;
    autoSubmitted.current = true;
    // Pequeña pausa para que el usuario vea el resumen; el botón queda como respaldo
    const timer = window.setTimeout(() => {
      setStatus('redirecting');
      submitRedsysForm(redsysParams);
    }, 600);
    return () => window.clearTimeout(timer);
  }, [status, redsysParams]);

  const handleManualPay = () => {
    if (!redsysParams) return;
    setStatus('redirecting');
    submitRedsysForm(redsysParams);
  };

  const shortId = order?.order_id?.split('-')[0].toUpperCase();
  const contact = order ? getOrderContact(order) : null;
  const showPaySummary = (status === 'ready' || status === 'redirecting') && order && redsysParams;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20 bg-accent">
      <div className="max-w-md w-full bg-white p-10 md:p-14 rounded-[2.5rem] shadow-xl text-center border border-gray-100 space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="w-14 h-14 text-primary animate-spin mx-auto" />
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Preparando pago…</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Un momento</p>
          </>
        )}

        {status === 'paid' && (
          <>
            <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">Pedido ya pagado</h1>
            <p className="text-gray-500 text-sm">
              El pedido {shortId ? `#${shortId}` : ''} ya está confirmado. No hace falta volver a pagar.
            </p>
            <Link to="/">
              <Button className="w-full py-5 font-black tracking-widest uppercase italic">
                Ir a la tienda
              </Button>
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">No se puede pagar</h1>
            <p className="text-gray-500 text-sm">{errorMessage}</p>
            <Link to="/">
              <Button variant="outline" className="w-full py-5 font-black tracking-widest uppercase italic">
                Volver a la tienda
              </Button>
            </Link>
          </>
        )}

        {showPaySummary && (
          <>
            <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              {status === 'redirecting' ? (
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              ) : (
                <CreditCard className="w-10 h-10 text-primary" />
              )}
            </div>
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">
              {status === 'redirecting' ? 'Redirigiendo al pago…' : 'Completar pago'}
            </h1>
            <p className="text-gray-500 text-sm">
              Pedido #{shortId}
              {contact?.name ? ` · ${contact.name}` : ''}
            </p>
            <p className="text-lg font-black text-(--text-main)">
              {Number(order.total_amount).toFixed(2)} €
            </p>
            <Button
              className="w-full py-5 font-black tracking-widest uppercase italic"
              onClick={handleManualPay}
              disabled={status === 'redirecting'}
            >
              {status === 'redirecting' ? 'Abriendo pasarela…' : 'Pagar ahora'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ResumePaymentPage;
