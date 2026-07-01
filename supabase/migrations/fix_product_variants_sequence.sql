-- Corrige el contador variant_id cuando insert devuelve 409 (product_variants_pkey).
-- Ejecutar en el SQL Editor de Supabase si los inserts de variantes fallan.

SELECT setval(
  pg_get_serial_sequence('public.product_variants', 'variant_id'),
  COALESCE((SELECT MAX(variant_id) FROM public.product_variants), 1),
  true
);

CREATE OR REPLACE FUNCTION public.fix_product_variants_sequence()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT setval(
    pg_get_serial_sequence('public.product_variants', 'variant_id'),
    COALESCE((SELECT MAX(variant_id) FROM public.product_variants), 1),
    true
  );
$$;
