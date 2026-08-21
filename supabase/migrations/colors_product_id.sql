-- Colores propios de un artículo (creados desde el selector del modal).
-- product_id null = color legacy/global; con valor = solo ese producto.
-- Ejecutar una vez en el SQL Editor de Supabase.
-- Seguro si ya se ejecutó parcialmente (falló el índice por duplicados).

alter table colors
  add column if not exists product_id text;

create index if not exists colors_product_id_idx on colors (product_id);

-- Quitar unicidad global del nombre si existía
alter table colors drop constraint if exists colors_name_key;
alter table colors drop constraint if exists colors_name_unique;
drop index if exists colors_global_name_uidx;
drop index if exists colors_product_scoped_name_uidx;

-- Deduplicar colores globales (product_id null) con el mismo nombre (p. ej. "celeste").
-- Se conserva el id más bajo; variantes y product_colors se reasignan a ese id.
with keepers as (
  select lower(trim(name)) as color_key, min(id) as keep_id
  from colors
  where product_id is null
  group by lower(trim(name))
  having count(*) > 1
),
dups as (
  select c.id as dup_id, k.keep_id
  from colors c
  join keepers k on lower(trim(c.name)) = k.color_key
  where c.product_id is null
    and c.id <> k.keep_id
)
update product_variants pv
set color_id = d.keep_id
from dups d
where pv.color_id = d.dup_id;

with keepers as (
  select lower(trim(name)) as color_key, min(id) as keep_id
  from colors
  where product_id is null
  group by lower(trim(name))
  having count(*) > 1
),
dups as (
  select c.id as dup_id, k.keep_id
  from colors c
  join keepers k on lower(trim(c.name)) = k.color_key
  where c.product_id is null
    and c.id <> k.keep_id
)
delete from product_colors pc
using dups d
where pc.color_id = d.dup_id
  and exists (
    select 1
    from product_colors pc2
    where pc2.product_id = pc.product_id
      and pc2.color_id = d.keep_id
  );

with keepers as (
  select lower(trim(name)) as color_key, min(id) as keep_id
  from colors
  where product_id is null
  group by lower(trim(name))
  having count(*) > 1
),
dups as (
  select c.id as dup_id, k.keep_id
  from colors c
  join keepers k on lower(trim(c.name)) = k.color_key
  where c.product_id is null
    and c.id <> k.keep_id
)
update product_colors pc
set color_id = d.keep_id
from dups d
where pc.color_id = d.dup_id;

with keepers as (
  select lower(trim(name)) as color_key, min(id) as keep_id
  from colors
  where product_id is null
  group by lower(trim(name))
  having count(*) > 1
),
dups as (
  select c.id as dup_id, k.keep_id
  from colors c
  join keepers k on lower(trim(c.name)) = k.color_key
  where c.product_id is null
    and c.id <> k.keep_id
)
delete from colors c
using dups d
where c.id = d.dup_id;

-- Unicidad: un nombre por producto (colores propios)
create unique index if not exists colors_product_scoped_name_uidx
  on colors (product_id, lower(trim(name)))
  where product_id is not null;

-- Unicidad: nombre único entre colores globales (product_id null)
create unique index if not exists colors_global_name_uidx
  on colors (lower(trim(name)))
  where product_id is null;

comment on column colors.product_id is
  'Si tiene valor, el color solo está disponible para ese producto. Null = catálogo global legacy.';
