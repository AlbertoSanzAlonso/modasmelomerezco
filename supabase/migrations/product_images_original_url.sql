-- Conservar la versión original (sin recortar) de cada foto de galería.
-- Al reabrir el crop o restaurar, se usa original_image_url en lugar del recorte.
alter table product_images
  add column if not exists original_image_url text;

comment on column product_images.original_image_url is
  'URL de la imagen original sin recortar. Si existe, el crop/ajuste se aplica sobre ella y se puede restaurar.';
