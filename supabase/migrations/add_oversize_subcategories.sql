-- Subcategorías de Oversize: chaquetas, pantalones, sudaderas, camisetas y conjuntos.
-- La columna id no tiene DEFAULT/sequence fiable; se asigna el siguiente id libre.
-- El mismo nombre puede existir en otra categoría (p. ej. pantalones en Ropa).
insert into subcategories (id, name, category_id)
select
  coalesce((select max(id) from subcategories), 0) + row_number() over (order by v.ord),
  v.name,
  c.id
from categories c
cross join (
  values
    (1, 'chaquetas'),
    (2, 'pantalones'),
    (3, 'sudaderas'),
    (4, 'camisetas'),
    (5, 'conjuntos')
) as v(ord, name)
where lower(c.name) = 'oversize'
  and not exists (
    select 1
    from subcategories s
    where lower(s.name) = lower(v.name)
      and s.category_id = c.id
  );
