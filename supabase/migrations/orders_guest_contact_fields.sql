-- Datos de contacto en checkout invitado (sin cuenta customers)
alter table orders add column if not exists guest_name text;
alter table orders add column if not exists guest_surname text;
alter table orders add column if not exists guest_phone text;
