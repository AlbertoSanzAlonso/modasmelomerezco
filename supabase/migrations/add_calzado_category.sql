-- Categoría Calzado para artículos de zapatería.
-- La columna id no tiene DEFAULT/sequence fiable; se asigna el siguiente id libre.
insert into categories (id, name)
select coalesce((select max(id) from categories), 0) + 1, 'Calzado'
where not exists (
  select 1 from categories where lower(name) = 'calzado'
);
