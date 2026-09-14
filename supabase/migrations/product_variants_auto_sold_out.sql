-- Si el stock total de un producto llega a 0, marca products.is_sold_out = true.
-- No desmarca automáticamente al reponer (sigue siendo manual / restockWithSizes).
-- Aplicar una vez en la base Postgres del proyecto.

create or replace function public.sync_product_sold_out_from_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pid products.product_id%type;
  total integer;
begin
  pid := coalesce(new.product_id, old.product_id);
  if pid is null then
    return coalesce(new, old);
  end if;

  select coalesce(sum(stock), 0)::integer
    into total
  from product_variants
  where product_id = pid;

  if total <= 0 then
    update products
    set is_sold_out = true
    where product_id = pid
      and is_sold_out = false;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists product_variants_sync_sold_out on product_variants;

create trigger product_variants_sync_sold_out
after insert or update of stock or delete
on product_variants
for each row
execute function public.sync_product_sold_out_from_stock();

comment on function public.sync_product_sold_out_from_stock() is
  'Marca el producto como agotado cuando la suma de stock de sus variantes es 0.';
