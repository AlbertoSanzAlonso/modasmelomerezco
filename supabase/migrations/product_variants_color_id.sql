-- Variantes: color_id FK nullable (NULL = solo talla, sin selector de color en tienda)
-- Ejecutar TODO este archivo en el SQL Editor de Supabase (una sola vez)

alter table product_variants
  add column if not exists color_id integer references colors(id) on delete restrict;

-- Mapear colores reales por nombre (columna legacy "color")
update product_variants pv
set color_id = c.id
from colors c
where pv.color_id is null
  and pv.color is not null
  and trim(pv.color) <> ''
  and lower(trim(pv.color)) not in ('único', 'unico', 'neutro')
  and lower(trim(c.name)) = lower(trim(pv.color));

-- Neutro / Único / vacío → sin variante de color
update product_variants
set color_id = null
where color_id is not null
  and (
    color is null
    or trim(color) = ''
    or lower(trim(color)) in ('único', 'unico', 'neutro')
  );

update product_variants
set color_id = null
where color is null
   or trim(color) = ''
   or lower(trim(color)) in ('único', 'unico', 'neutro');

-- Una sola fila "solo talla" por producto + talla
create unique index if not exists idx_product_variants_size_no_color
  on product_variants (product_id, size)
  where color_id is null;

-- Una fila por combinación talla + color
create unique index if not exists idx_product_variants_size_color
  on product_variants (product_id, size, color_id)
  where color_id is not null;

-- Eliminar columna de texto (ya migrada a color_id)
alter table product_variants drop column if exists color;
