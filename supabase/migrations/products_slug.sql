-- Slugs SEO-friendly para URLs de producto (/producto/{slug})
-- Ejecutar en el SQL Editor de Supabase

create or replace function public.slugify_product_name(input text)
returns text
language plpgsql
immutable
as $$
declare
  s text;
begin
  s := lower(coalesce(input, ''));
  s := translate(
    s,
    'áàäâãåéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÅÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
    'aaaaaaeeeeiiiiooooouuuuncAAAAAAEEEEIIIIOOOOOUUUUNC'
  );
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := regexp_replace(s, '^-+|-+$', '', 'g');
  if s is null or s = '' then
    s := 'producto';
  end if;
  return s;
end;
$$;

alter table products add column if not exists slug text;

do $$
declare
  r record;
  base text;
  candidate text;
  n int;
begin
  for r in
    select product_id, name
    from products
    where slug is null or btrim(slug) = ''
    order by created_at nulls last, product_id
  loop
    base := public.slugify_product_name(r.name);
    candidate := base;
    n := 2;
    while exists (
      select 1 from products p where p.slug = candidate and p.product_id is distinct from r.product_id
    ) loop
      candidate := base || '-' || n::text;
      n := n + 1;
    end loop;
    update products set slug = candidate where product_id = r.product_id;
  end loop;
end $$;

alter table products alter column slug set not null;

create unique index if not exists products_slug_unique on products (slug);
