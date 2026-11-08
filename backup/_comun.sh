# Funciones compartidas por los scripts de backup.
C="${ORACLE_CONTAINER:-oracle}"
FRA=/opt/oracle/oradata/fast_recovery
DIR_DP=/opt/oracle/oradata/backup_univ
HOST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/archivos"

# Ejecuta SQL (stdin) en la raíz del CDB como SYSDBA
sql_cdb() { docker exec -i -e NLS_LANG=.AL32UTF8 "$C" bash -lc 'sqlplus -s / as sysdba'; }

# Ejecuta SQL (stdin) en FREEPDB1 como SYSDBA
sql_pdb() { { echo "ALTER SESSION SET CONTAINER = FREEPDB1;"; cat; } | sql_cdb; }

# Ejecuta comandos RMAN (stdin) sobre todo el CDB
rman_cmd() { docker exec -i -e NLS_LANG=.AL32UTF8 "$C" bash -lc 'rman target / '; }

# Guarda el resultado en el historial que muestra la interfaz web
registrar() { # tipo detalle tamano_mb estado
  sql_pdb >/dev/null <<SQL
INSERT INTO UNIV_SEC.HISTORIAL_BACKUPS (tipo, detalle, tamano_mb, estado)
VALUES ('$1', '$2', ${3:-NULL}, '$4');
COMMIT;
EXIT
SQL
}
