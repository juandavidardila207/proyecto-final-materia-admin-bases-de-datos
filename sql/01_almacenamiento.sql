-- =========================================================
-- GESTIÓN DE ALMACENAMIENTO
-- Separa datos, índices, auditoría y temporales en tablespaces propios,
-- con crecimiento automático limitado para que no consuman todo el disco.
-- =========================================================
CREATE TABLESPACE TS_UNIV_DATOS
  DATAFILE '&ruta_datos/ts_univ_datos01.dbf' SIZE 100M AUTOEXTEND ON NEXT 25M MAXSIZE 1G
  EXTENT MANAGEMENT LOCAL AUTOALLOCATE
  SEGMENT SPACE MANAGEMENT AUTO;

CREATE TABLESPACE TS_UNIV_INDICES
  DATAFILE '&ruta_datos/ts_univ_indices01.dbf' SIZE 50M AUTOEXTEND ON NEXT 10M MAXSIZE 500M
  EXTENT MANAGEMENT LOCAL AUTOALLOCATE
  SEGMENT SPACE MANAGEMENT AUTO;

CREATE TABLESPACE TS_UNIV_AUDITORIA
  DATAFILE '&ruta_datos/ts_univ_auditoria01.dbf' SIZE 50M AUTOEXTEND ON NEXT 10M MAXSIZE 500M
  EXTENT MANAGEMENT LOCAL AUTOALLOCATE
  SEGMENT SPACE MANAGEMENT AUTO;

CREATE TEMPORARY TABLESPACE TEMP_UNIV
  TEMPFILE '&ruta_datos/temp_univ01.dbf' SIZE 50M AUTOEXTEND ON NEXT 10M MAXSIZE 500M;
