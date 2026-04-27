# Estructura de Componentes del Proyecto (Modas Me Lo Merezco)

Este documento sirve como guía para agentes de IA y desarrolladores para localizar los componentes refactorizados.

## Shop Feature (`src/features/shop`)
- **HomePage.tsx**: Componente principal simplificado.
- **components/HeroSection.tsx**: Video de fondo, logo animado y scroll indicator.
- **components/NewArrivalsSection.tsx**: Reel de productos (Novedades).
- **components/FeaturedSection.tsx**: Sección editorial "Vístete para ti".
- **components/NewsletterSection.tsx**: Formulario de suscripción y lógica de confirmación.

## Checkout Feature (`src/features/shop`)
- **CheckoutPage.tsx**: Lógica de pedidos y validación.
- **components/CheckoutSummary.tsx**: Desglose de precios y badges de confianza.
- **components/ShippingMethodSelector.tsx**: Opciones de envío (Local, Nacex, Domicilio).
- **components/PaymentMethodSelector.tsx**: Selección de Tarjeta o Bizum.
- **components/CheckoutAddressForm.tsx**: Formulario de dirección de envío.

## Customer Feature (`src/features/customer`)
- **ProfilePage.tsx**: Gestión de perfil.
- **OrderHistory.tsx**: Listado de pedidos.
- **PaymentMethods.tsx**: Gestión de tarjetas guardadas.
- **components/OrderListTable.tsx**: Vista desktop de pedidos.
- **components/OrderListMobile.tsx**: Vista móvil de pedidos.
- **components/PaymentCard.tsx**: Tarjeta de crédito visual.
- **components/AddCardForm.tsx**: Formulario para nuevas tarjetas.

## Auth Feature (`src/features/auth`)
- **SignupPage.tsx**: Registro de usuarios.
- **components/SignupPersonalForm.tsx**: Datos básicos del usuario.
- **components/SignupAddressForm.tsx**: Dirección inicial de registro.
