---
name: melomerezco
description: >-
  Proyecto Modas Me lo Merezco: React/Vite, Cloudflare R2, admin tienda,
  checkout Redsys/Nacex. Usar para contexto general del repo, rutas de features
  o convenciones del proyecto.
---

# Modas Me lo Merezco

## Stack

- **Frontend:** React + Vite + TypeScript + Tailwind + Zustand + TanStack Query
- **Deploy:** Vercel (API en `api/`)
- **Imágenes de producto:** Cloudflare R2 (`api/_r2.ts`, subida vía `/api/chat` action `upload-image`; cliente en `src/lib/api/storage.ts`)
- **Datos / Auth:** Postgres + Auth vía cliente `@supabase/supabase-js` en `src/lib/supabase.ts` y `src/lib/api/*` (nombres de env legacy `VITE_SUPABASE_*`). **No** se usa Supabase Storage ni el panel/SQL Editor de Supabase.
- **Migraciones SQL:** carpeta `supabase/migrations/` (nombre histórico). Aplicar el SQL en la base Postgres del proyecto; no indicar “ejecutar en Supabase”.
- **Pagos:** Redsys; **envío:** Nacex (`api/nacex.ts`)

## Estructura

- `src/features/shop` — tienda pública
- `src/features/admin` — panel admin (`AdminDashboard`, `ProductModal`)
- `src/features/customer` — área cliente
- `src/features/auth` — login/registro
- Ver `src/features/STRUCTURE.md` para mapa de componentes

## Variables de entorno

- Plantilla: `.env.example` (commitear)
- **No commitear:** `.env`, `.env.preview`, `.env.production`
- Datos/Auth (legacy naming): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Backup/migración Postgres: `SUPABASE_DB_URL` (Session pooler **:5432**, user `postgres.<project_ref>`). No hace falta en Vercel.
- Cloudflare R2 (imágenes, sin prefijo `VITE_`): `R2_ACCOUNT_ID`, `R2_ENDPOINT`, `R2_BUCKET`, `R2_PUBLIC_URL`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`

## Backups de Postgres (migración)

- Generar: `./scripts/backup-db.sh` (usa Docker `postgres:17` si el `pg_dump` local es anterior a 17).
- Salida gitignored: `backups/latest.dump`, `backups/latest.sql`, `backups/MANIFEST.txt`.
- Copia durable fuera del repo: `~/Backups/melomerezco/<fecha>/`.
- Último backup conocido: **2026-09-15** → `db-20260915-000323` (public+auth, esquema+filas).
- Restaurar: `pg_restore --clean --if-exists --no-owner --no-acl -d "$SUPABASE_DB_URL" backups/latest.dump`
- Doc: `docs/database-backups.md`. **Nunca** commitear dumps ni subirlos a un bucket R2 público.

## Convenciones

- Responder al usuario en **español** si no indica otro idioma.
- Commits/PRs: mensajes claros; no incluir secretos en git.
- Inventario productos: leer skill `melomerezco-inventario` antes de tocar stock/colores/variantes.
- Logos y assets de marca: servir desde el sitio (`/logo.png`, `/assets/logo/…`), nunca URLs de `*.supabase.co/storage/…`.

## SEO

### Middleware de inyección (`middleware.ts`)
- Intercepta peticiones de crawlers (Googlebot, Bingbot, redes sociales) y sirve HTML con meta tags inyectados vía `api/_injectSeoHtml.ts`.
- Los datos SEO se resuelven desde `api/_seoMeta.ts` (productos: consulta Postgres vía cliente de datos; categorías/páginas estáticas: diccionario local).
- Para productos no encontrados/no publicados → 404 a crawlers.
- Configuración de rutas interceptadas: `middleware.ts:config.matcher`.

### Meta tags dinámicos (SPA)
- `src/components/seo/RouteSeo.tsx` — SEO por ruta para páginas estáticas.
- `src/components/seo/SeoHelmet.tsx` — componente genérico (`react-helmet-async`) usado por páginas de producto y categoría.
- `src/lib/seo/constants.ts` — constantes (`SITE_URL`, `SITE_NAME`, `SITE_LOGO`, `DEFAULT_OG_IMAGE`, helpers).
- Siempre usar `absoluteUrl()` para URLs canónicas; los query params se eliminan al generar la canonical (`SeoHelmet.tsx:33`).

### Datos estructurados (JSON-LD)
| Página | Schema | Ubicación |
|--------|--------|-----------|
| Homepage | `ClothingStore` (logo, dirección, redes) | `RouteSeo.tsx:73` |
| Producto | `BreadcrumbList` + `Product` + `Offer` (envío, devolución) | `ProductPage.tsx:242-300` |
| Categoría | `BreadcrumbList` | `CategoryPage.tsx:184` |

### Sitemap
- Generado dinámicamente en `api/sitemap.ts` (páginas estáticas + productos publicados).
- Expuesto en `/sitemap.xml` vía rewrite en `vercel.json`.
- Excluye productos con nombre "test" o "prueba".

### Imágenes y logo
- `public/logo.png` — usado en datos estructurados (`ClothingStore.logo`). Mínimo 500x500, formato PNG.
- `public/og-image.png` — Open Graph (1200x630). Meta tags en `index.html` + `SeoHelmet`.
- `index.html` tiene los meta tags estáticos de fallback (OG, Twitter, favicon, canonical, google-site-verification).

### Redirecciones y DNS
- **Canonical siempre con www:** `https://www.modasmelomerezco.es`.
- Redirecciones en `vercel.json`: HTTP→HTTPS, apex→www, rutas antiguas WP→home.
- `robots.txt`: bloquea `/admin/`, `/cuenta/`, `/wp-includes/`, `/wp-content/`, `/ropa-2/`.
- El apex (`modasmelomerezco.es` sin www) debe apuntar a Vercel (A record `216.198.79.1`); el CNAME `www` a Vercel DNS.

### Buenas prácticas SEO
- **Alt de imágenes:** nunca `alt="Logo"` en enlaces de navegación; usar el nombre de la marca para evitar que Google lo convierta en sitelink.
- **Canonical:** siempre sin query params.
- **Productos no publicados:** middleware devuelve 404 a crawlers; SPA muestra página con `noindex`.
- **No duplicar:** no incluir URLs con filtros (`?sub=`, `?color=`) en sitemap ni en navegación principal.
