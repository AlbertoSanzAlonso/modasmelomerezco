-- Muestra de estampado (imagen) además del hex de color sólido.
alter table colors
  add column if not exists swatch_url text;

comment on column colors.swatch_url is
  'URL de muestra de estampado; si está presente se muestra en lugar del hex sólido.';
