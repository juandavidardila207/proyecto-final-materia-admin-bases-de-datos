#!/bin/bash
# DEMO desastre físico: ELIMINA el datafile de TS_UNIV_DATOS y lo recupera con RMAN.
# Requiere haber hecho antes ./02_backup_rman.sh. Solo afecta al tablespace de este proyecto.
set -euo pipefail
source "$(dirname "$0")/_comun.sh"
DF=/opt/oracle/oradata/FREE/FREEPDB1/ts_univ_datos01.dbf
read -r -p "Esto borra $DF y lo restaura desde el último backup. Escribe SI para continuar: " R
[ "$R" = "SI" ] || { echo "Cancelado."; exit 1; }
conteo() { sql_pdb <<'SQL'
SET FEEDBACK OFF
-- COUNT(semestre) obliga a leer la tabla; COUNT(*) se resolvería solo con un índice,
-- que está en otro tablespace y seguiría disponible.
SELECT COUNT(semestre) AS matriculas FROM UNIVERSIDAD.MATRICULAS;
EXIT
SQL
}
echo "=== 1. Estado inicial"; conteo
echo "=== 2. Simulando la pérdida del archivo"
sql_pdb >/dev/null <<'SQL'
ALTER SYSTEM CHECKPOINT;
ALTER TABLESPACE TS_UNIV_DATOS OFFLINE IMMEDIATE;
EXIT
SQL
docker exec "$C" rm -f "$DF"
docker exec "$C" ls -la "$DF" 2>&1 || true
echo "=== 3. La tabla ya no se puede leer (error esperado)"; conteo || true
echo "=== 4. RESTORE y RECOVER con RMAN"
rman_cmd <<'RMAN'
RESTORE TABLESPACE FREEPDB1:TS_UNIV_DATOS;
RECOVER TABLESPACE FREEPDB1:TS_UNIV_DATOS;
EXIT
RMAN
sql_pdb >/dev/null <<'SQL'
ALTER TABLESPACE TS_UNIV_DATOS ONLINE;
EXIT
SQL
echo "=== 5. Estado final"; conteo
registrar "RMAN recuperación" "Restore/recover de TS_UNIV_DATOS" "" "OK"
