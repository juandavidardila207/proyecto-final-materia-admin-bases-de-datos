#!/bin/bash
# Configura la Fast Recovery Area y activa ARCHIVELOG (requisito de RMAN en caliente).
# Reinicia la instancia. Se ejecuta una sola vez; si ya está activo no hace nada.
set -euo pipefail
source "$(dirname "$0")/_comun.sh"
docker exec "$C" mkdir -p "$FRA"
sql_cdb <<SQL
WHENEVER SQLERROR EXIT SQL.SQLCODE
ALTER SYSTEM SET db_recovery_file_dest_size = 20G SCOPE=BOTH;
ALTER SYSTEM SET db_recovery_file_dest = '$FRA' SCOPE=BOTH;
SET HEADING OFF FEEDBACK OFF
SELECT 'Modo actual: ' || log_mode FROM v\$database;
EXIT
SQL
MODO=$(echo "SET HEADING OFF FEEDBACK OFF PAGES 0
SELECT log_mode FROM v\$database;
EXIT" | sql_cdb | tr -d '[:space:]')
if [ "$MODO" = "ARCHIVELOG" ]; then echo "ARCHIVELOG ya estaba activo."; exit 0; fi
sql_cdb <<'SQL'
WHENEVER SQLERROR EXIT SQL.SQLCODE
SHUTDOWN IMMEDIATE
STARTUP MOUNT
ALTER DATABASE ARCHIVELOG;
ALTER DATABASE OPEN;
ALTER PLUGGABLE DATABASE ALL OPEN;
ALTER PLUGGABLE DATABASE FREEPDB1 SAVE STATE;
ARCHIVE LOG LIST
EXIT
SQL
