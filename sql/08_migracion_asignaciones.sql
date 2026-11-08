-- =========================================================
-- Migración para una base YA instalada antes de que existiera ASIGNACIONES.
-- No borra datos. Se ejecuta con ../migrar_asignaciones.sh
-- Una instalación nueva no la necesita: instalar.sql ya incluye todo.
-- =========================================================
WHENEVER SQLERROR EXIT SQL.SQLCODE
SET VERIFY OFF FEEDBACK OFF SERVEROUTPUT ON
ALTER SESSION SET CONTAINER = FREEPDB1;

PROMPT Creando ASIGNACIONES con las parejas profesor-materia existentes...
ALTER SESSION SET CURRENT_SCHEMA = UNIVERSIDAD;
@@03c_asignaciones.sql
ALTER SESSION SET CURRENT_SCHEMA = SYS;

PROMPT Ajustando índices...
DROP INDEX UNIVERSIDAD.IDX_MAT_CURSO;
CREATE INDEX UNIVERSIDAD.IDX_MAT_CURSO_PROFESOR ON UNIVERSIDAD.MATRICULAS (id_curso, id_profesor) TABLESPACE TS_UNIV_INDICES;
CREATE INDEX UNIVERSIDAD.IDX_ASIG_PROFESOR ON UNIVERSIDAD.ASIGNACIONES (id_profesor) TABLESPACE TS_UNIV_INDICES;

PROMPT Permisos, bitácora y auditoría...
@@05b_asignaciones_seguridad.sql
@@06b_politica_datos.sql

BEGIN
  DBMS_STATS.GATHER_TABLE_STATS('UNIVERSIDAD', 'ASIGNACIONES');
END;
/
PROMPT Migración terminada.
EXIT
