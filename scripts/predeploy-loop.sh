#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

max_attempts="${1:-3}"
sleep_seconds="${2:-5}"

run_checks() {
  echo "▶ Verificando dependencias con Expo Doctor..."
  npx expo doctor

  echo "▶ Verificando tipos con TypeScript..."
  npx tsc --noEmit

  echo "▶ Generando exportación de producción para Android..."
  npx expo export --platform android --clear
}

for attempt in $(seq 1 "$max_attempts"); do
  echo ""
  echo "=== Revisión previa al despliegue (intento $attempt/$max_attempts) ==="

  if run_checks; then
    echo "✅ Revisión previa aprobada."
    exit 0
  fi

  if [[ "$attempt" -lt "$max_attempts" ]]; then
    echo "⚠️ La revisión falló. Reintentando en ${sleep_seconds}s..."
    sleep "$sleep_seconds"
  fi
done

echo "❌ La revisión previa falló después de $max_attempts intentos."
exit 1
