-- Estado OFERTA: precio tachado visual (compare-at) sin cambiar el precio de venta.
-- Aplicar una vez en la base Postgres del proyecto.

alter table products
  add column if not exists is_on_offer boolean not null default false;

alter table products
  add column if not exists offer_percent numeric(5, 2) not null default 0;

comment on column products.is_on_offer is
  'Si true, en tienda se muestra un precio tachado (antiguo) calculado con offer_percent.';

comment on column products.offer_percent is
  'Porcentaje a sumar al precio real para el precio tachado. Ej: price 50 + 20% → 60 tachado.';
