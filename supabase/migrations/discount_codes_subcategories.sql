-- Vincular códigos de descuento a subcategorías completas (pantalones, bolsos, etc.)
-- Ejecutar en el SQL Editor de Supabase después de discount_codes.sql

create table if not exists subcategory_discount_codes (
  discount_code_id integer not null references discount_codes(id) on delete cascade,
  subcategory_id integer not null references subcategories(id) on delete cascade,
  primary key (discount_code_id, subcategory_id)
);

create index if not exists idx_subcategory_discount_codes_sub
  on subcategory_discount_codes(subcategory_id);
create index if not exists idx_subcategory_discount_codes_code
  on subcategory_discount_codes(discount_code_id);

alter table subcategory_discount_codes enable row level security;

drop policy if exists "subcategory_discount_codes read" on subcategory_discount_codes;
drop policy if exists "subcategory_discount_codes write" on subcategory_discount_codes;

create policy "subcategory_discount_codes read" on subcategory_discount_codes for select using (true);
create policy "subcategory_discount_codes write" on subcategory_discount_codes for all using (true);
