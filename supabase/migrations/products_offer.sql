-- Estado OFERTA: precio tachado visual (compare-at) sin cambiar el precio de venta.
-- Tipo: percent (sumar %) o fixed (sumar €). Aplicar en la base Postgres del proyecto.

alter table products
  add column if not exists is_on_offer boolean not null default false;

alter table products
  add column if not exists offer_type text not null default 'percent';

alter table products
  add column if not exists offer_value numeric(10, 2) not null default 0;

-- Compatibilidad si ya existía offer_percent de una versión anterior
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'offer_percent'
  ) then
    execute $sql$
      update products
      set offer_value = coalesce(nullif(offer_percent, 0), offer_value),
          offer_type = 'percent'
      where coalesce(offer_percent, 0) > 0
        and coalesce(offer_value, 0) = 0
    $sql$;
  end if;
end $$;

alter table products drop column if exists offer_percent;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_offer_type_check'
  ) then
    alter table products
      add constraint products_offer_type_check
      check (offer_type in ('percent', 'fixed'));
  end if;
end $$;

comment on column products.is_on_offer is
  'Si true, en tienda se muestra un precio tachado (antiguo) según offer_type/offer_value.';

comment on column products.offer_type is
  'percent = sumar % al precio; fixed = sumar euros al precio. Solo visual.';

comment on column products.offer_value is
  'Valor de la oferta: porcentaje (puede ser >100) o euros según offer_type.';
