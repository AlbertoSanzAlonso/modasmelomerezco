import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/useCartStore';
import { useAuthStore } from '@/store/useAuthStore';

type Result = 'success' | 'error' | null;

/**
 * Página pública tras el retorno de Redsys (vía /api/redsys/return-ok|ko).
 * Funciona para clientes logueados e invitados.
 */
const PaymentConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const { clearCart, openModal, closeModal } = useCartStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const handled = useRef(false);
  const [result] = useState<Result>(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success') return 'success';
    if (payment === 'error') return 'error';
    return null;
  });

  useEffect(() => {
    if (handled.current) return;
    if (result !== 'success' && result !== 'error') return;
    handled.current = true;

    window.history.replaceState({}, '', window.location.pathname);

    if (result === 'success') {
      clearCart();
      openModal({
        title: '¡Pago completado!',
        message:
          'Tu pedido está confirmado. Recibirás un email con los detalles en breve.',
        type: 'success',
        actionLabel: 'Entendido',
        onAction: () => closeModal(),
      });
      return;
    }

    openModal({
      title: 'Pago no completado',
      message:
        'El pago no se ha podido completar. Puedes intentarlo de nuevo desde el checkout o con el enlace que te enviemos.',
      type: 'warning',
      actionLabel: 'Entendido',
      onAction: () => closeModal(),
    });
  }, [result, clearCart, openModal, closeModal]);

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

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-20 bg-accent">
      <div className="max-w-md w-full bg-white p-10 md:p-14 rounded-[2.5rem] shadow-xl text-center border border-gray-100 space-y-8">
        {isSuccess ? (
          <>
            <div className="bg-green-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-black uppercase italic tracking-tighter">
                ¡Pago correcto!
              </h1>
              <p className="text-gray-500 text-sm font-medium leading-relaxed">
                Gracias por tu compra. Te hemos enviado (o te enviaremos en breve) la confirmación
                por email.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {isAuthenticated ? (
                <Link to="/cuenta/pedidos">
                  <Button className="w-full py-5 font-black tracking-widest uppercase italic">
                    Ver mis pedidos
                  </Button>
                </Link>
              ) : null}
              <Link to="/">
                <Button
                  variant={isAuthenticated ? 'outline' : 'primary'}
                  className="w-full py-5 font-black tracking-widest uppercase italic"
                >
                  Seguir comprando
                </Button>
              </Link>
            </div>
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
                intentarlo cuando quieras.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/checkout">
                <Button className="w-full py-5 font-black tracking-widest uppercase italic">
                  Volver al checkout
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" className="w-full py-5 font-black tracking-widest uppercase italic">
                  Ir a la tienda
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
