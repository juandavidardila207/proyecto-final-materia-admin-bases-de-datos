#!/bin/bash
# Backup LÓGICO con Data Pump: esquema UNIVERSIDAD (estructura + datos).
# El .dmp también se copia a backup/archivos/ de tu Mac.
set -euo pipefail
source "$(dirname "$0")/_comun.sh"
docker exec "$C" mkdir -p "$DIR_DP"
sql_pdb >/dev/null <<SQL
CREATE OR REPLACE DIRECTORY DIR_UNIV_BACKUP AS '$DIR_DP';
EXIT
SQL
ARCHIVO="universidad_$(date +%Y%m%d_%H%M%S).dmp"
docker exec -e ORACLE_PDB_SID=FREEPDB1 "$C" bash -lc \
  "expdp \\\"/ as sysdba\\\" SCHEMAS=UNIVERSIDAD DIRECTORY=DIR_UNIV_BACKUP DUMPFILE=$ARCHIVO LOGFILE=$ARCHIVO.log" \
  || { registrar "Data Pump export" "$ARCHIVO" "" "ERROR"; exit 1; }
mkdir -p "$HOST_DIR"
docker cp "$C:$DIR_DP/$ARCHIVO" "$HOST_DIR/$ARCHIVO"
MB=$(du -m "$HOST_DIR/$ARCHIVO" | cut -f1)
registrar "Data Pump export" "$ARCHIVO (copia en backup/archivos)" "$MB" "OK"
echo "Exportado: backup/archivos/$ARCHIVO"
