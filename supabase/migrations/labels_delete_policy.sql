-- Permitir borrar etiquetas desde el admin.
-- Al borrar una fila en labels, product_labels se limpia por ON DELETE CASCADE.

drop policy if exists "labels delete" on labels;
create policy "labels delete" on labels for delete using (true);
