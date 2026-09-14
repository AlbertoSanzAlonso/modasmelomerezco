-- Etiquetas (labels) para filtrar productos en tienda y admin
-- Aplicar TODO este archivo en la base Postgres del proyecto (una sola vez)

-- Tabla de etiquetas
create table if not exists labels (
  id serial primary key,
  name text not null,
  slug text not null unique,
  created_at timestamptz default now()
);

-- Borra intentos fallidos anteriores
drop table if exists product_labels cascade;

-- Crea product_labels con el MISMO tipo que products.product_id (uuid o text)
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
      create table product_labels (
        product_id uuid not null references products(product_id) on delete cascade,
        label_id integer not null references labels(id) on delete cascade,
        primary key (product_id, label_id)
      )
    $sql$;
  elsif pid_type in ('text', 'character varying') then
    execute $sql$
      create table product_labels (
        product_id text not null references products(product_id) on delete cascade,
        label_id integer not null references labels(id) on delete cascade,
        primary key (product_id, label_id)
      )
    $sql$;
  else
    raise exception 'Tipo no soportado para products.product_id: %', pid_type;
  end if;
end $$;

create index if not exists idx_product_labels_label on product_labels(label_id);
create index if not exists idx_product_labels_product on product_labels(product_id);

-- RLS
alter table labels enable row level security;
alter table product_labels enable row level security;

drop policy if exists "labels read" on labels;
drop policy if exists "labels insert" on labels;
drop policy if exists "product_labels read" on product_labels;
drop policy if exists "product_labels write" on product_labels;

create policy "labels read" on labels for select using (true);
create policy "labels insert" on labels for insert with check (true);
create policy "product_labels read" on product_labels for select using (true);
create policy "product_labels write" on product_labels for all using (true);
