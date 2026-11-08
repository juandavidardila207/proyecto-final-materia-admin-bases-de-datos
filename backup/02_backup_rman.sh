#!/bin/bash
# Backup FÍSICO completo con RMAN (toda la base + archivelogs) en la FRA.
# Uso: ./02_backup_rman.sh [--copiar]   (--copiar además lo guarda en backup/archivos/ de tu Mac)
set -euo pipefail
source "$(dirname "$0")/_comun.sh"
TAG="UNIV_$(date +%Y%m%d_%H%M%S)"
if ! rman_cmd <<RMAN
CONFIGURE RETENTION POLICY TO REDUNDANCY 2;
CONFIGURE CONTROLFILE AUTOBACKUP ON;
BACKUP AS COMPRESSED BACKUPSET TAG '$TAG' DATABASE PLUS ARCHIVELOG;
DELETE NOPROMPT OBSOLETE;
LIST BACKUP SUMMARY;
EXIT
RMAN
then registrar "RMAN completo" "$TAG" "" "ERROR"; exit 1; fi
MB=$(docker exec "$C" du -sm "$FRA" | cut -f1)
DETALLE="Tag $TAG en la FRA del contenedor"
if [ "${1:-}" = "--copiar" ]; then
  mkdir -p "$HOST_DIR/rman_$TAG"
  docker cp "$C:$FRA/." "$HOST_DIR/rman_$TAG/"
  DETALLE="$DETALLE y copia en backup/archivos/rman_$TAG"
fi
registrar "RMAN completo" "$DETALLE" "$MB" "OK"
echo "Backup RMAN terminado: $DETALLE"
