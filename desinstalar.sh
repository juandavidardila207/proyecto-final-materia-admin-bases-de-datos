#!/bin/bash
# Elimina solo los objetos de este proyecto. Uso: ./desinstalar.sh [nombre_contenedor]
set -euo pipefail
C="${1:-oracle}"
cd "$(dirname "$0")"
COPYFILE_DISABLE=1 tar --no-xattrs -C sql -cf - . | docker exec -i "$C" bash -c 'rm -rf /tmp/univ_sql && mkdir -p /tmp/univ_sql && tar --no-same-owner -xf - -C /tmp/univ_sql'
docker exec -i -e NLS_LANG=.AL32UTF8 -w /tmp/univ_sql "$C" bash -lc 'sqlplus -s / as sysdba @99_desinstalar.sql'
