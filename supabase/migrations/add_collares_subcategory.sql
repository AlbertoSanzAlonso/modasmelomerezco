-- Subcategoría Collares dentro de Complementos (igual que bolsos).
-- La columna id no tiene DEFAULT/sequence fiable; se asigna el siguiente id libre.
insert into subcategories (id, name, category_id)
select
  coalesce((select max(id) from subcategories), 0) + 1,
  'collares',
  c.id
from categories c
where lower(c.name) = 'complementos'
  and not exists (
    select 1
    from subcategories s
    where lower(s.name) = 'collares'
      and s.category_id = c.id
  );
