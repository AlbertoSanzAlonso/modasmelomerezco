-- Campos de descuento a nivel de pedido (opcional; los ítems guardan el desglose en JSON)
alter table orders add column if not exists discount_amount numeric(10, 2) default 0;
alter table orders add column if not exists discount_code text;
