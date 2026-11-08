-- =========================================================
-- AUDITORÍA UNIFICADA de Oracle (complementa la bitácora de 05_seguridad.sql)
-- Consultar en: UNIFIED_AUDIT_TRAIL
-- =========================================================
-- Inicios de sesión, exitosos y fallidos
CREATE AUDIT POLICY POL_UNIV_ACCESOS ACTIONS LOGON;

-- Administración de cuentas, roles y estructuras
CREATE AUDIT POLICY POL_UNIV_ADMINISTRACION
  ACTIONS CREATE USER, ALTER USER, DROP USER,
          CREATE ROLE, DROP ROLE, GRANT, REVOKE,
          CREATE TABLESPACE, ALTER TABLESPACE, DROP TABLESPACE;

AUDIT POLICY POL_UNIV_ACCESOS;
AUDIT POLICY POL_UNIV_ADMINISTRACION;
-- Cambios en los datos del taller
@@06b_politica_datos.sql
