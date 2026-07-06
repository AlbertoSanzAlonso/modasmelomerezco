-- Detalles visibles en la ficha del producto (opcional)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS details TEXT;

COMMENT ON COLUMN products.details IS 'Detalles del producto mostrados en la ficha pública';
