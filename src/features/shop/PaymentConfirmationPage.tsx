import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/useCartStore';
import { GoogleCustomerReviewsOptIn } from './components/GoogleCustomerReviewsOptIn';
import {
  consumeGoogleCustomerReviewsPending,
  type GoogleCustomerReviewsPending,
} from '@/lib/googleCustomerReviews';

type Result = 'success' | 'error' | null;

/**
 * Página pública tras el retorno de Redsys (vía /api/redsys/[return-ok|return-ko]).
 * Funciona para clientes logueados e invitados.
 */
const PaymentConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);
  const handled = useRef(false);

  const [result] = useState<Result>(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') return 'success';
    if (payment === 'error') return 'error';
    return null;
  });

  // Conservar orderId aunque se limpie la query de la URL
  const [orderId] = useState(() => searchParams.get('order')?.trim() || null);
  const [reviewOptIn, setReviewOptIn] = useState<GoogleCustomerReviewsPending | null>(null);

  useEffect(() => {
    if (handled.current) return;
    if (result !== 'success' && result !== 'error') return;
    handled.current = true;

    if (result === 'success') {
      setReviewOptIn(consumeGoogleCustomerReviewsPending(orderId));
      clearCart();
    }

    window.history.replaceState({}, '', window.location.pathname);
  }, [result, orderId, clearCart]);

  if (!result) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-20 bg-accent">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-xl text-center border border-gray-100 space-y-6">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Cargando…</h1>
          <Link to="/">
            <Button variant="outline" className="w-full py-5 font-black tracking-widest uppercase italic">
              Ir a la tienda
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isSuccess = result === 'success';
  const resumePaymentPath = orderId ? `/pagar/${orderId}` : '/checkout';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20 bg-accent">
      {isSuccess && reviewOptIn ? (
        <GoogleCustomerReviewsOptIn
          orderId={reviewOptIn.orderId}
          email={reviewOptIn.email}
        />
      ) : null}
      <div className="max-w-md w-full bg-white p-10 md:p-14 rounded-[2.5rem] shadow-xl text-center border border-gray-100 space-y-8">
        {isSuccess ? (
          <>
            <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">
                Compra realizada con éxito
              </h1>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Gracias por tu compra. Te hemos enviado (o te enviaremos en breve) la confirmación
                por email.
              </p>
            </div>
            <Link to="/">
              <Button className="w-full py-5 font-black tracking-widest uppercase italic">
                Volver a la web
              </Button>
            </Link>
          </>
        ) : (
          <>
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <XCircle className="w-12 h-12 text-red-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">
                Pago no completado
              </h1>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                No se ha cargado ningún importe o el pago se ha cancelado. Puedes volver a
                intentarlo ahora mismo.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link to={resumePaymentPath}>
                <Button className="w-full py-5 font-black tracking-widest uppercase italic">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Volver al pago
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="w-full py-5 font-black tracking-widest uppercase italic">
                  Volver a la web
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentConfirmationPage;
