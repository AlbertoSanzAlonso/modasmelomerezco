-- Colores propios de un artículo (creados desde el selector del modal).
-- product_id null = color legacy/global; con valor = solo ese producto.
-- Ejecutar una vez en el SQL Editor de Supabase.

alter table colors
  add column if not exists product_id text;

create index if not exists colors_product_id_idx on colors (product_id);

-- Quitar unicidad global del nombre si existía (mismo nombre en distintos productos)
alter table colors drop constraint if exists colors_name_key;
alter table colors drop constraint if exists colors_name_unique;

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
