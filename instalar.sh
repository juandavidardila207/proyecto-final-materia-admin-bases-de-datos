#!/bin/bash
# Instala el proyecto en el contenedor Oracle. Uso: ./instalar.sh [nombre_contenedor]
set -euo pipefail
C="${1:-oracle}"
cd "$(dirname "$0")"
if [ ! -f sql/00_parametros.sql ]; then
  echo "Falta sql/00_parametros.sql (las contraseñas de los usuarios)."
  echo "Créalo con:  cp sql/00_parametros.ejemplo.sql sql/00_parametros.sql   y cambia las contraseñas."
  exit 1
fi
docker start "$C" >/dev/null
echo "Esperando a Oracle..."
until docker exec "$C" healthcheck.sh >/dev/null 2>&1; do sleep 3; done
COPYFILE_DISABLE=1 tar --no-xattrs -C sql -cf - . | docker exec -i "$C" bash -c 'rm -rf /tmp/univ_sql && mkdir -p /tmp/univ_sql && tar --no-same-owner -xf - -C /tmp/univ_sql'
docker exec -i -e NLS_LANG=.AL32UTF8 -w /tmp/univ_sql "$C" bash -lc 'sqlplus -s / as sysdba @instalar.sql'
