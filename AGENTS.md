# Agentes — Modas Me lo Merezco

## Skills del proyecto

| Skill | Cuándo usarla |
|-------|----------------|
| [melomerezco](.cursor/skills/melomerezco/SKILL.md) | Contexto general del repo, stack, env, estructura, SEO |
| [melomerezco-inventario](.cursor/skills/melomerezco-inventario/SKILL.md) | Stock, tallas, colores, variantes, admin de piezas, pedidos |

## Reglas rápidas

- Inventario: una fila en `product_variants` = talla + color + stock; color por defecto **Neutro**.
- Imágenes de producto: **Cloudflare R2** (no Supabase Storage).
- Migraciones SQL en `supabase/migrations/` (carpeta de nombre histórico): aplicarlas en la base Postgres; no usar panel/SQL Editor de Supabase.
- Logos/assets de marca: `/logo.png` o `/assets/logo/…` del sitio, nunca URLs `*.supabase.co/storage/…`.
- No commitear archivos `.env` con credenciales.
- SEO: el `alt` de imágenes de logo en links no debe ser `"Logo"` (Google lo toma como sitelink). Usar `"Modas Me lo Merezco"`.
- SEO: la canonical siempre es `https://www.modasmelomerezco.es` (con www), sin query params.
- SEO: `public/logo.png` debe ser ≥500x500px (usado en datos estructurados `ClothingStore`).
