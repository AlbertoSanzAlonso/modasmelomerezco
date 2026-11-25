-- Fecha en la que el cliente recoge el pedido en tienda (o se marca como entregado).
alter table orders add column if not exists delivery_date timestamptz;
