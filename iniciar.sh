#!/bin/bash
# Enciende Oracle y la interfaz web (Next.js). Uso: ./iniciar.sh [nombre_contenedor]
# Puerto: 3000 (cámbialo con PORT=3100 ./iniciar.sh)
set -euo pipefail
C="${1:-oracle}"
cd "$(dirname "$0")"
docker start "$C" >/dev/null
echo "Esperando a Oracle..."
until docker exec "$C" healthcheck.sh >/dev/null 2>&1; do sleep 3; done
cd web
[ -d node_modules ] || npm install --no-audit --no-fund
[ -f .next/BUILD_ID ] || npm run build
echo "Abre http://localhost:${PORT:-3000}"
exec npx next start -H 127.0.0.1 -p "${PORT:-3000}"
