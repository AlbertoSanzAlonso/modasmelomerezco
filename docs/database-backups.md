# Backups de base de datos

Dump lógico de Postgres (Supabase) con **esquema + todas las filas** de `public` y `auth`, pensado para migración o recuperación.

## Cómo generar

1. En `.env`, `SUPABASE_DB_URL` = Session pooler puerto **5432** (no Transaction/6543):

   `postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-<REGION>.pooler.supabase.com:5432/postgres`

2. Ejecutar:

   ```bash
   ./scripts/backup-db.sh
   ```

   Opciones: `--data-only` (solo filas), `--full` (todos los schemas accesibles).

## Dónde están

| Ubicación | Notas |
|-----------|--------|
| `backups/` (gitignored) | `latest.dump`, `latest.sql`, `MANIFEST.txt`, dumps con timestamp |
| `~/Backups/melomerezco/YYYY-MM-DD/` | Copia segura fuera del repo |

**No** versionar dumps en git. **No** subirlos a R2 público (contienen datos de clientes/auth).

## Último backup conocido

| Campo | Valor |
|-------|--------|
| Fecha | 2026-09-15 (~00:03 Europe/Madrid) |
| ID | `db-20260915-000323` |
| Proyecto | `aoyafhjpgmxcygqnklvl` |
| Schemas | `public`, `auth` |
| Filas aprox. | ~1406 |
| Local | `backups/latest.dump` / `backups/latest.sql` |
| Copia | `~/Backups/melomerezco/2026-09-15/` |

## Restaurar

```bash
pg_restore --clean --if-exists --no-owner --no-acl -d "$SUPABASE_DB_URL" backups/latest.dump
# o
psql "$SUPABASE_DB_URL" -f backups/latest.sql
```

Tras un dump nuevo, actualizar esta sección y `AGENTS.md` / skill `melomerezco` con la fecha e ID.
