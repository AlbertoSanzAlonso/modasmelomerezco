-- Códigos de descuento (uno a muchos con productos vía tabla puente)
-- Ejecutar TODO este archivo en el SQL Editor de Supabase (una sola vez)

create table if not exists discount_codes (
  id serial primary key,
  code text not null,
  discount_type text not null default 'percent'
    check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10, 2) not null
    check (discount_value > 0),
  is_active boolean not null default true,
  starts_at timestamptz,
  expires_at timestamptz,
  max_uses integer,
  used_count integer not null default 0,
  created_at timestamptz default now(),
  constraint discount_codes_code_unique unique (code)
);

create unique index if not exists idx_discount_codes_code_lower
  on discount_codes (lower(trim(code)));

-- Tabla puente: un código puede aplicarse a muchos productos
drop table if exists product_discount_codes cascade;

do $$
declare
  pid_type text;
begin
  select data_type into pid_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'products'
    and column_name = 'product_id';

  if pid_type is null then
    raise exception 'No se encontró la columna products.product_id';
  end if;

  if pid_type = 'uuid' then
    execute $sql$
      create table product_discount_codes (
        discount_code_id integer not null references discount_codes(id) on delete cascade,
        product_id uuid not null references products(product_id) on delete cascade,
        primary key (discount_code_id, product_id)
      )
    $sql$;
  elsif pid_type in ('text', 'character varying') then
    execute $sql$
      create table product_discount_codes (
        discount_code_id integer not null references discount_codes(id) on delete cascade,
        product_id text not null references products(product_id) on delete cascade,
        primary key (discount_code_id, product_id)
      )
    $sql$;
  else
    raise exception 'Tipo no soportado para products.product_id: %', pid_type;
  end if;
end $$;

create index if not exists idx_product_discount_codes_product
  on product_discount_codes(product_id);
create index if not exists idx_product_discount_codes_code
  on product_discount_codes(discount_code_id);

-- RLS: lectura pública para validar en tienda; escritura abierta (ajustar en producción si hace falta)
alter table discount_codes enable row level security;
alter table product_discount_codes enable row level security;

drop policy if exists "discount_codes read" on discount_codes;
drop policy if exists "discount_codes write" on discount_codes;
drop policy if exists "product_discount_codes read" on product_discount_codes;
drop policy if exists "product_discount_codes write" on product_discount_codes;

create policy "discount_codes read" on discount_codes for select using (true);
create policy "discount_codes write" on discount_codes for all using (true);
create policy "product_discount_codes read" on product_discount_codes for select using (true);
create policy "product_discount_codes write" on product_discount_codes for all using (true);
