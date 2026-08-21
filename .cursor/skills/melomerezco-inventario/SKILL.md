---
name: melomerezco-inventario
description: >-
  Inventario y variantes de producto en Modas Me lo Merezco (talla × color, admin
  ProductInventory, Supabase product_variants.color_id). Usar al editar stock,
  colores, admin de piezas, carrito, checkout, pedidos o stock en tienda.
---

# Inventario talla × color (melomerezco)

## Agotado (`is_sold_out`)

- Columna `products.is_sold_out` (default `false` = en stock).
- Migración: `supabase/migrations/products_is_sold_out.sql`.
- Tienda: cartel Agotado + sin compra si `is_sold_out`.
- Admin: Agotar / En stock (solo si toda la selección es homogénea).
- Al reponer: modal de tallas → 3 uds por talla × color (`restockWithSizes`).

## Fuente de verdad

- **Stock:** tabla `product_variants` → `size`, `color_id` (FK nullable), `stock`, `variant_id`.
- **Agotado visual/compra:** `products.is_sold_out` (no borra el stock).
- **`color_id` null:** solo talla; en tienda **no** hay selector de color.
- **`color_id` con valor:** variante de color; selector visible si el producto tiene alguna variante con color.
- **Colores en ficha web:** tabla `product_colors` (derivada al guardar desde variantes con `color_id`).
- **Colores propios:** `colors.product_id` = id del artículo. Nombre en BD: `Amarillo_nombre-producto` (tienda muestra solo «Amarillo»). Migración: `colors_product_id.sql`.
- **Estampados:** `colors.swatch_url` = URL de muestra; si existe, el selector muestra la imagen en lugar del hex. Migración: `colors_swatch_url.sql`.
- **Helpers:** `src/lib/productVariants.ts` (`buildScopedColorName`, `getColorDisplayName`).

## Admin (`ProductInventory.tsx`)

- UI agrupada **por talla**, listas **plegadas por defecto**.
- Sin colores: un campo de stock por talla (`color_id` null).
- Con colores: tabla Color | Unidades; añadir con desplegable del catálogo.
- Al añadir el primer color a una talla, se elimina la fila `color_id` null y el stock pasa a la nueva línea.
- Formulario: `useProductForm.ts` → `consolidateVariantsForSave()` + `deriveProductColors()`.

## Ventas del día (tienda física)

- Pestaña admin **Ventas del día** (`DailySalesTab.tsx`): buscar producto → talla/color → cantidad → lista → restar.
- Usa `api.products.decrementStock(variant_id, quantity)` (no crea pedidos).
- Respeta stock disponible (incluye lo ya añadido a la lista del día).
- No marca `is_sold_out` automáticamente; eso sigue siendo manual (Agotar).

## Tienda y carrito

- Buscar variante: `findVariant(variants, size, { colorId })` o sin `colorId` si solo talla.
- Mostrar colores: `hasColorVariants(variants)` o `product.colors.length > 0`.
- Carrito: clave por `getCartItemKey()` (`variant_id` o `color_id`).
- Pedidos: `order_items` guardan `color` como **texto** (snapshot), no FK.

## Migración

- SQL: `supabase/migrations/product_variants_color_id.sql` (añade `color_id`, migra legacy, elimina columna `color`).

## Al cambiar inventario

1. Admin: `ProductInventory` + `useProductForm` + `productVariants.ts` + `products.ts` API.
2. No mezclar filas `color_id` null y con color en la misma talla al guardar (`consolidateVariantsForSave`).
3. Validar duplicados talla + `color_id` antes de guardar.

## Archivos clave

| Área | Archivo |
|------|---------|
| Helpers | `src/lib/productVariants.ts` |
| Admin UI | `src/features/admin/ProductModal/ProductInventory.tsx` |
| Ventas día | `src/features/admin/AdminDashboard/components/DailySalesTab.tsx` |
| Form | `src/features/admin/ProductModal/useProductForm.ts` |
| API | `src/lib/api/products.ts`, `src/lib/api/colors.ts` |
| Tienda | `src/features/shop/ProductPage.tsx` |
| Carrito | `src/store/useCartStore.ts` |
| Checkout | `src/features/shop/hooks/useCheckoutForm.ts` |
