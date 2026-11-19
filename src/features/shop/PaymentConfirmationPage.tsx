import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Clock, CreditCard, ShoppingBag, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import {
  clearPendingPaymentOrder,
  getLastPaymentConfirmation,
  getPendingPaymentOrder,
  saveLastPaymentConfirmation,
  savePendingPaymentOrder,
  type PaymentConfirmationResult,
} from '@/lib/redsys';
import { GoogleCustomerReviewsOptIn } from './components/GoogleCustomerReviewsOptIn';
import {
  consumeGoogleCustomerReviewsPending,
  type GoogleCustomerReviewsPending,
} from '@/lib/googleCustomerReviews';

type ConfirmationState = {
  result: PaymentConfirmationResult | null;
  orderId: string | null;
  fromUrl: boolean;
};

function parsePaymentParam(raw: string | null): PaymentConfirmationResult | null {
  if (raw === 'success') return 'success';
  if (raw === 'pending' || raw === 'error') return 'pending';
  return null;
}

/**
 * Página pública tras el retorno de Redsys (vía /api/redsys/[return-ok|return-ko]).
 * Funciona para clientes con cuenta e invitados.
 */
const PaymentConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const clearCart = useCartStore((s) => s.clearCart);
  const { isAuthenticated, user } = useAuthStore();
  const handled = useRef(false);

  const [confirmation] = useState<ConfirmationState>(() => {
    const urlResult = parsePaymentParam(searchParams.get('payment'));
    const urlOrderId = searchParams.get('order')?.trim() || null;

    if (urlResult) {
      return {
        result: urlResult,
        orderId: urlOrderId || getPendingPaymentOrder(),
        fromUrl: true,
      };
    }

    const stored = getLastPaymentConfirmation();
    if (stored) {
      return {
        result: stored.result,
        orderId: stored.orderId || (stored.result === 'pending' ? getPendingPaymentOrder() : null),
        fromUrl: false,
      };
    }

    return { result: null, orderId: null, fromUrl: false };
  });

  const [reviewOptIn] = useState<GoogleCustomerReviewsPending | null>(() => {
    if (confirmation.result === 'success' && confirmation.fromUrl) {
      return consumeGoogleCustomerReviewsPending(confirmation.orderId);
    }
    return null;
  });

  useEffect(() => {
    if (handled.current) return;
    if (!confirmation.result || !confirmation.fromUrl) return;
    handled.current = true;

    saveLastPaymentConfirmation({
      result: confirmation.result,
      orderId: confirmation.orderId,
    });

    if (confirmation.result === 'success') {
      clearPendingPaymentOrder();
      clearCart();
    } else if (confirmation.orderId) {
      savePendingPaymentOrder(confirmation.orderId);
    }

    queryClient.invalidateQueries({ queryKey: ['orders'] });
    window.history.replaceState({}, '', window.location.pathname);
  }, [confirmation, clearCart, queryClient]);

  const { result, orderId } = confirmation;
  const shortId = orderId ? orderId.split('-')[0].toUpperCase() : null;
  const firstName = user?.name?.trim().split(' ')[0] || null;

  if (!result) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-20 bg-accent">
        <div className="max-w-md w-full bg-white p-10 md:p-14 rounded-[2.5rem] shadow-xl text-center border border-gray-100 space-y-6">
          <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-black uppercase italic tracking-tighter">
              Estado de tu pedido
            </h1>
            <p className="text-gray-500 text-sm font-medium leading-relaxed">
              No encontramos una confirmación de pago reciente en esta sesión.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {isAuthenticated && (
              <Link to="/cuenta">
                <Button className="w-full py-5 font-black tracking-widest uppercase italic">
                  <User className="w-4 h-4 mr-2" />
                  Ir a mi cuenta
                </Button>
              </Link>
            )}
            <Link to="/">
              <Button
                variant={isAuthenticated ? 'outline' : 'primary'}
                className="w-full py-5 font-black tracking-widest uppercase italic"
              >
                Volver a la web
              </Button>
            </Link>
          </div>
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
            <div className="space-y-3">
              {shortId && (
                <span className="inline-block px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-[10px] font-black uppercase tracking-widest">
                  Pedido #{shortId}
                </span>
              )}
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">
                ¡Enhorabuena por tu compra!
              </h1>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                {firstName
                  ? `¡Muchas gracias, ${firstName}! Tu pedido se ha confirmado correctamente.`
                  : '¡Muchas gracias por confiar en Modas Me lo Merezco! Tu pedido se ha confirmado correctamente.'}{' '}
                Te hemos enviado la confirmación con todos los detalles por email.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {isAuthenticated && (
                <Link to="/cuenta">
                  <Button className="w-full py-5 font-black tracking-widest uppercase italic">
                    <User className="w-4 h-4 mr-2" />
                    Ir a mi cuenta
                  </Button>
                </Link>
              )}
              <Link to="/">
                <Button
                  variant={isAuthenticated ? 'outline' : 'primary'}
                  className="w-full py-5 font-black tracking-widest uppercase italic"
                >
                  Volver a la web
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="bg-amber-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-12 h-12 text-amber-500" />
            </div>
            <div className="space-y-3">
              <span className="inline-block px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-black uppercase tracking-widest">
                Aviso de pago pendiente{shortId ? ` · #${shortId}` : ''}
              </span>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">
                Pago pendiente
              </h1>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                No se ha completado el pago de tu pedido y no se ha realizado ningún cargo. Tu
                compra queda pendiente hasta que finalices el pago.
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
