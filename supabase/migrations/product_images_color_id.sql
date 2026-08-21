-- Asociar una foto de galería a un color del catálogo (opcional).
-- En la ficha de producto, al elegir ese color se muestra la foto asociada.
alter table product_images
  add column if not exists color_id integer references colors(id) on delete set null;

create index if not exists product_images_color_id_idx
  on product_images (color_id)
  where color_id is not null;

comment on column product_images.color_id is
  'Color asociado a esta foto; null = sin asociación. Al seleccionar el color en tienda se muestra esta imagen.';
