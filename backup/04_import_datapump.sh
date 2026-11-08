#!/bin/bash
# Restaura el esquema UNIVERSIDAD desde un .dmp, REEMPLAZANDO sus tablas actuales.
# Uso: ./04_import_datapump.sh universidad_YYYYMMDD_HHMMSS.dmp
set -euo pipefail
source "$(dirname "$0")/_comun.sh"
ARCHIVO="${1:?Indica el .dmp que está en backup/archivos/}"
read -r -p "Esto reemplaza las tablas de UNIVERSIDAD con $ARCHIVO. Escribe SI para continuar: " R
[ "$R" = "SI" ] || { echo "Cancelado."; exit 1; }
[ -f "$HOST_DIR/$ARCHIVO" ] && cat "$HOST_DIR/$ARCHIVO" | docker exec -i "$C" bash -c "mkdir -p $DIR_DP && cat > $DIR_DP/$ARCHIVO"
docker exec -e ORACLE_PDB_SID=FREEPDB1 "$C" bash -lc \
  "impdp \\\"/ as sysdba\\\" SCHEMAS=UNIVERSIDAD DIRECTORY=DIR_UNIV_BACKUP DUMPFILE=$ARCHIVO LOGFILE=imp_$ARCHIVO.log TABLE_EXISTS_ACTION=REPLACE EXCLUDE=USER" \
  || { registrar "Data Pump import" "$ARCHIVO" "" "ERROR"; exit 1; }
# REPLACE recrea las tablas y deja vacía la política de auditoría: hay que volver a crearla.
SQL_DIR="$(cd "$(dirname "$0")/../sql" && pwd)"
{ echo "WHENEVER SQLERROR EXIT SQL.SQLCODE"; cat "$SQL_DIR/06b_politica_datos.sql"; echo "EXIT"; } | sql_pdb >/dev/null \
  || { registrar "Data Pump import" "$ARCHIVO: falló la política de auditoría" "" "ERROR"; exit 1; }
N=$(sql_pdb <<'SQL' | tr -d '[:space:]' | grep -oE '[0-9]+$'
SET HEADING OFF FEEDBACK OFF PAGES 0
SELECT COUNT(*) FROM audit_unified_policies WHERE policy_name = 'POL_UNIV_DATOS' AND object_schema = 'UNIVERSIDAD';
EXIT
SQL
)
[ "${N:-0}" -eq 14 ] || { registrar "Data Pump import" "$ARCHIVO: auditoría incompleta ($N/14)" "" "ERROR"; echo "ERROR: la política de auditoría quedó incompleta ($N/14)."; exit 1; }
echo "Política de auditoría restablecida ($N/9 acciones)."
registrar "Data Pump import" "$ARCHIVO" "" "OK"
echo "Importado $ARCHIVO"
