#!/usr/bin/env bash
# Dump completo de Postgres (esquema + todas las filas) para backup / migración.
#
# Requisitos:
#   - Docker (imagen postgres:17; Supabase está en PG 17) o pg_dump >= versión del servidor
#   - SUPABASE_DB_URL en .env (Session pooler, puerto 5432 — NO 6543)
#
# Uso:
#   ./scripts/backup-db.sh
#   ./scripts/backup-db.sh --data-only   # solo filas (si el destino ya tiene esquema)
#   ./scripts/backup-db.sh --full       # todos los schemas accesibles
#
# Restaurar (ejemplo):
#   pg_restore --clean --if-exists --no-owner --no-acl -d "$SUPABASE_DB_URL" backups/db-XXXX.dump
#   psql "$SUPABASE_DB_URL" -f backups/db-XXXX.sql

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

load_env_var() {
  local key="$1"
  [[ -f .env ]] || return 0
  local line
  line="$(grep -E "^${key}=" .env | tail -n1 || true)"
  [[ -n "$line" ]] || return 0
  line="${line#*=}"
  line="${line%\"}"
  line="${line#\"}"
  line="${line%\'}"
  line="${line#\'}"
  printf '%s' "$line"
}

DB_URL="${SUPABASE_DB_URL:-}"
if [[ -z "$DB_URL" ]]; then
  DB_URL="$(load_env_var SUPABASE_DB_URL)"
fi
if [[ -z "$DB_URL" ]]; then
  DB_URL="${DATABASE_URL:-$(load_env_var DATABASE_URL)}"
fi

if [[ -z "$DB_URL" ]]; then
  echo "Falta SUPABASE_DB_URL (o DATABASE_URL) en .env"
  echo ""
  echo "En Supabase: Project Settings → Database → Connection string"
  echo "  Usa Session pooler (puerto 5432), no Transaction (6543)."
  echo "  Ejemplo:"
  echo "  postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres"
  exit 1
fi

mkdir -p backups
STAMP="$(date +%Y%m%d-%H%M%S)"
MODE="${1:-}"

DUMP_ARGS=(--no-owner --no-acl)

if [[ "$MODE" == "--full" ]]; then
  echo "Modo --full: dump de todos los schemas accesibles"
elif [[ "$MODE" == "--data-only" ]]; then
  DUMP_ARGS+=(--data-only --disable-triggers --schema=public --schema=auth)
  echo "Modo --data-only: solo filas (public + auth)"
else
  DUMP_ARGS+=(--schema=public --schema=auth)
  echo "Modo completo: esquema + todas las filas (public + auth)"
fi

OUT_DUMP="backups/db-${STAMP}.dump"
OUT_SQL="backups/db-${STAMP}.sql"

# Exporta ARGS como string seguro para el contenedor
ARGS_STR="$(printf '%q ' "${DUMP_ARGS[@]}")"

run_dump() {
  local format="$1"
  local outfile="$2"
  local container_out="/backups/$(basename "$outfile")"

  if command -v docker >/dev/null 2>&1; then
    echo "  (pg_dump vía Docker postgres:17)"
    # shellcheck disable=SC2086
    docker run --rm \
      --user "$(id -u):$(id -g)" \
      -e DATABASE_URL="$DB_URL" \
      -v "$ROOT/backups:/backups" \
      postgres:17 \
      bash -lc "pg_dump --dbname=\"\$DATABASE_URL\" ${ARGS_STR} --format=${format} --file='${container_out}'"
  else
    if ! command -v pg_dump >/dev/null 2>&1; then
      echo "Necesitas Docker o pg_dump >= 17"
      exit 1
    fi
    echo "  (pg_dump local)"
    pg_dump --dbname="$DB_URL" "${DUMP_ARGS[@]}" --format="$format" --file="$outfile"
  fi
}

echo "→ Custom dump: $OUT_DUMP"
run_dump custom "$OUT_DUMP"

echo "→ SQL plano (migración fácil): $OUT_SQL"
run_dump plain "$OUT_SQL"

# Punteros estables + copia fuera del repo
cp -f "$OUT_DUMP" backups/latest.dump
cp -f "$OUT_SQL" backups/latest.sql

SAFE_DIR="${HOME}/Backups/melomerezco/$(date +%Y-%m-%d)"
mkdir -p "$SAFE_DIR"
cp -f "$OUT_DUMP" "$OUT_SQL" backups/latest.dump backups/latest.sql "$SAFE_DIR/"

{
  echo "backup_id: db-${STAMP}"
  echo "created_at: $(date -Iseconds)"
  echo "schemas: public, auth (salvo --full / --data-only)"
  echo "formats: db-${STAMP}.dump, db-${STAMP}.sql, latest.dump, latest.sql"
  echo "safe_copy: ${SAFE_DIR}/"
  echo "regen: ./scripts/backup-db.sh"
} | tee backups/MANIFEST.txt > "$SAFE_DIR/MANIFEST.txt"

ls -lh "$OUT_DUMP" "$OUT_SQL" backups/latest.dump backups/latest.sql
echo ""
echo "Listo."
echo "  Repo (gitignored): backups/latest.dump | backups/latest.sql"
echo "  Copia segura:      $SAFE_DIR/"
echo "Restaurar: pg_restore --clean --if-exists --no-owner --no-acl -d \"\$SUPABASE_DB_URL\" backups/latest.dump"
echo "Tras un dump nuevo, actualiza docs/database-backups.md y AGENTS.md con la fecha/ID."
