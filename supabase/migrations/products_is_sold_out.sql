-- Estado agotado del producto (independiente del stock numérico).
-- Por defecto false = en stock. Ejecutar una vez en el SQL Editor de Supabase.

alter table products
  add column if not exists is_sold_out boolean not null default false;

comment on column products.is_sold_out is
  'Si true, el producto se muestra como Agotado en tienda y no se puede comprar. El stock de variantes se conserva.';
