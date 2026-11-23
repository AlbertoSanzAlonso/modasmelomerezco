-- Historial de stock: ventas (tienda y web), entradas y ajustes.
-- Aplicar TODO este archivo en la base Postgres del proyecto (una sola vez).

do $$
declare
  pid_type text;
  vid_type text;
  pid_sql text;
  vid_sql text;
begin
  if to_regclass('public.stock_movements') is not null then
    return;
  end if;

  select data_type into pid_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'products'
    and column_name = 'product_id';

  if pid_type is null then
    raise exception 'No se encontró la columna products.product_id';
  end if;

  if pid_type = 'uuid' then
    pid_sql := 'uuid';
  elsif pid_type in ('text', 'character varying') then
    pid_sql := 'text';
  else
    raise exception 'Tipo no soportado para products.product_id: %', pid_type;
  end if;

  select data_type into vid_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'product_variants'
    and column_name = 'variant_id';

  if vid_type = 'bigint' then
    vid_sql := 'bigint';
  elsif vid_type in ('integer', 'smallint') then
    vid_sql := 'integer';
  else
    vid_sql := 'integer';
  end if;

  execute format($sql$
    create table stock_movements (
      id bigserial primary key,
      variant_id %s references product_variants(variant_id) on delete set null,
      product_id %s references products(product_id) on delete set null,
      product_name text not null default '',
      image_url text,
      size text not null default '',
      color_name text,
      delta integer not null,
      resulting_stock integer not null,
      kind text not null,
      note text,
      created_at timestamptz not null default now(),
      constraint stock_movements_kind_check check (
        kind in ('sale', 'entry', 'web_sale', 'adjustment', 'undo')
      ),
      constraint stock_movements_delta_nonzero check (delta <> 0)
    )
  $sql$, vid_sql, pid_sql);
end $$;

create index if not exists idx_stock_movements_created_at
  on stock_movements (created_at desc);

create index if not exists idx_stock_movements_kind
  on stock_movements (kind);

create index if not exists idx_stock_movements_product
  on stock_movements (product_id);

alter table stock_movements enable row level security;

drop policy if exists "stock_movements read" on stock_movements;
drop policy if exists "stock_movements insert" on stock_movements;

create policy "stock_movements read"
  on stock_movements for select
  using (true);

create policy "stock_movements insert"
  on stock_movements for insert
  with check (true);

grant select, insert on table stock_movements to anon, authenticated, service_role;
grant usage, select on sequence stock_movements_id_seq to anon, authenticated, service_role;

comment on table stock_movements is
  'Movimientos de stock: venta en tienda, entrada, venta web, ajuste de ficha y deshacer.';
