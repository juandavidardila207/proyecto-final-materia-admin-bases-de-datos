-- =========================================================
-- Permisos sobre datos
-- =========================================================
GRANT SELECT ON UNIVERSIDAD.PROFESORES TO ROL_UNIV_CONSULTA;
GRANT SELECT ON UNIVERSIDAD.CURSOS     TO ROL_UNIV_CONSULTA;
GRANT SELECT ON UNIVERSIDAD.MATRICULAS TO ROL_UNIV_CONSULTA;
GRANT SELECT ON UNIVERSIDAD.ESTUDIANTES TO ROL_UNIV_CONSULTA;
GRANT INSERT, UPDATE, DELETE ON UNIVERSIDAD.ESTUDIANTES TO ROL_UNIV_OPERADOR;
GRANT INSERT, UPDATE, DELETE ON UNIVERSIDAD.PROFESORES TO ROL_UNIV_OPERADOR;
GRANT INSERT, UPDATE, DELETE ON UNIVERSIDAD.CURSOS     TO ROL_UNIV_OPERADOR;
GRANT INSERT, UPDATE, DELETE ON UNIVERSIDAD.MATRICULAS TO ROL_UNIV_OPERADOR;

-- =========================================================
-- Bitácora de cambios (valores antes/después de cada fila)
-- =========================================================
CREATE TABLE UNIV_SEC.BITACORA (
  id_evento   NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha       TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
  usuario_bd  VARCHAR2(128) NOT NULL,
  ip_cliente  VARCHAR2(64),
  operacion   VARCHAR2(10) NOT NULL,
  tabla       VARCHAR2(30) NOT NULL,
  id_registro NUMBER,
  antes       VARCHAR2(1000),
  despues     VARCHAR2(1000)
) TABLESPACE TS_UNIV_AUDITORIA;

CREATE OR REPLACE TRIGGER UNIV_SEC.TRG_BITACORA_INMUTABLE
BEFORE UPDATE OR DELETE ON UNIV_SEC.BITACORA
BEGIN
  RAISE_APPLICATION_ERROR(-20110, 'La bitácora no se puede modificar ni borrar.');
END;
/

CREATE OR REPLACE PROCEDURE UNIV_SEC.REGISTRAR_CAMBIO (
  p_operacion VARCHAR2, p_tabla VARCHAR2, p_id NUMBER, p_antes VARCHAR2, p_despues VARCHAR2
) AUTHID DEFINER IS
BEGIN
  INSERT INTO UNIV_SEC.BITACORA (usuario_bd, ip_cliente, operacion, tabla, id_registro, antes, despues)
  VALUES (SYS_CONTEXT('USERENV','SESSION_USER'), SYS_CONTEXT('USERENV','IP_ADDRESS'),
          p_operacion, p_tabla, p_id, p_antes, p_despues);
END;
/
GRANT EXECUTE ON UNIV_SEC.REGISTRAR_CAMBIO TO UNIVERSIDAD;
GRANT SELECT ON UNIV_SEC.BITACORA TO ROL_UNIV_AUDITOR;

CREATE OR REPLACE TRIGGER UNIVERSIDAD.TRG_AUD_PROFESORES
AFTER INSERT OR UPDATE OR DELETE ON UNIVERSIDAD.PROFESORES FOR EACH ROW
BEGIN
  UNIV_SEC.REGISTRAR_CAMBIO(
    CASE WHEN INSERTING THEN 'INSERT' WHEN UPDATING THEN 'UPDATE' ELSE 'DELETE' END, 'PROFESORES',
    COALESCE(:NEW.id_profesor, :OLD.id_profesor),
    CASE WHEN NOT INSERTING THEN JSON_OBJECT('nombre' VALUE :OLD.nombre, 'departamento' VALUE :OLD.departamento) END,
    CASE WHEN NOT DELETING  THEN JSON_OBJECT('nombre' VALUE :NEW.nombre, 'departamento' VALUE :NEW.departamento) END);
END;
/
CREATE OR REPLACE TRIGGER UNIVERSIDAD.TRG_AUD_CURSOS
AFTER INSERT OR UPDATE OR DELETE ON UNIVERSIDAD.CURSOS FOR EACH ROW
BEGIN
  UNIV_SEC.REGISTRAR_CAMBIO(
    CASE WHEN INSERTING THEN 'INSERT' WHEN UPDATING THEN 'UPDATE' ELSE 'DELETE' END, 'CURSOS',
    COALESCE(:NEW.id_curso, :OLD.id_curso),
    CASE WHEN NOT INSERTING THEN JSON_OBJECT('nombre' VALUE :OLD.nombre, 'creditos' VALUE :OLD.creditos) END,
    CASE WHEN NOT DELETING  THEN JSON_OBJECT('nombre' VALUE :NEW.nombre, 'creditos' VALUE :NEW.creditos) END);
END;
/
CREATE OR REPLACE TRIGGER UNIVERSIDAD.TRG_AUD_MATRICULAS
AFTER INSERT OR UPDATE OR DELETE ON UNIVERSIDAD.MATRICULAS FOR EACH ROW
BEGIN
  UNIV_SEC.REGISTRAR_CAMBIO(
    CASE WHEN INSERTING THEN 'INSERT' WHEN UPDATING THEN 'UPDATE' ELSE 'DELETE' END, 'MATRICULAS',
    COALESCE(:NEW.id_matricula, :OLD.id_matricula),
    CASE WHEN NOT INSERTING THEN JSON_OBJECT('id_curso' VALUE :OLD.id_curso, 'id_profesor' VALUE :OLD.id_profesor,
         'id_estudiante' VALUE :OLD.id_estudiante, 'semestre' VALUE :OLD.semestre) END,
    CASE WHEN NOT DELETING  THEN JSON_OBJECT('id_curso' VALUE :NEW.id_curso, 'id_profesor' VALUE :NEW.id_profesor,
         'id_estudiante' VALUE :NEW.id_estudiante, 'semestre' VALUE :NEW.semestre) END);
END;
/

CREATE OR REPLACE TRIGGER UNIVERSIDAD.TRG_AUD_ESTUDIANTES
AFTER INSERT OR UPDATE OR DELETE ON UNIVERSIDAD.ESTUDIANTES FOR EACH ROW
BEGIN
  UNIV_SEC.REGISTRAR_CAMBIO(
    CASE WHEN INSERTING THEN 'INSERT' WHEN UPDATING THEN 'UPDATE' ELSE 'DELETE' END, 'ESTUDIANTES',
    COALESCE(:NEW.id_estudiante, :OLD.id_estudiante),
    CASE WHEN NOT INSERTING THEN JSON_OBJECT('nombre' VALUE :OLD.nombre, 'programa' VALUE :OLD.programa, 'correo' VALUE :OLD.correo) END,
    CASE WHEN NOT DELETING  THEN JSON_OBJECT('nombre' VALUE :NEW.nombre, 'programa' VALUE :NEW.programa, 'correo' VALUE :NEW.correo) END);
END;
/

@@05b_asignaciones_seguridad.sql

-- =========================================================
-- Historial de backups (lo alimentan los scripts de la carpeta backup/)
-- =========================================================
CREATE TABLE UNIV_SEC.HISTORIAL_BACKUPS (
  id_backup NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha     TIMESTAMP WITH TIME ZONE DEFAULT SYSTIMESTAMP NOT NULL,
  tipo      VARCHAR2(40) NOT NULL,
  detalle   VARCHAR2(400),
  tamano_mb NUMBER,
  estado    VARCHAR2(20) NOT NULL
) TABLESPACE TS_UNIV_AUDITORIA;
GRANT SELECT ON UNIV_SEC.HISTORIAL_BACKUPS TO ROL_UNIV_ADMIN;

-- =========================================================
-- Vistas de monitoreo (el rol no recibe acceso directo a las vistas DBA_*)
-- =========================================================
GRANT SELECT ON SYS.DBA_DATA_FILES      TO UNIV_SEC WITH GRANT OPTION;
GRANT SELECT ON SYS.DBA_TEMP_FILES      TO UNIV_SEC WITH GRANT OPTION;
GRANT SELECT ON SYS.DBA_FREE_SPACE      TO UNIV_SEC WITH GRANT OPTION;
GRANT SELECT ON SYS.DBA_TEMP_FREE_SPACE TO UNIV_SEC WITH GRANT OPTION;
GRANT SELECT ON SYS.DBA_SEGMENTS        TO UNIV_SEC WITH GRANT OPTION;
GRANT SELECT ON SYS.DBA_USERS           TO UNIV_SEC WITH GRANT OPTION;
GRANT SELECT ON SYS.DBA_ROLE_PRIVS      TO UNIV_SEC WITH GRANT OPTION;

CREATE OR REPLACE VIEW UNIV_SEC.V_TABLESPACES AS
SELECT f.tablespace_name, 'PERMANENTE' AS tipo, f.archivos,
       ROUND(f.bytes/1048576,1) AS asignado_mb,
       ROUND((f.bytes - NVL(l.bytes,0))/1048576,1) AS usado_mb,
       ROUND(f.max_bytes/1048576) AS maximo_mb,
       ROUND((f.bytes - NVL(l.bytes,0))/f.bytes*100,1) AS pct_usado
FROM (SELECT tablespace_name, COUNT(*) archivos, SUM(bytes) bytes,
             SUM(GREATEST(bytes, DECODE(autoextensible,'YES',maxbytes,bytes))) max_bytes
      FROM SYS.DBA_DATA_FILES GROUP BY tablespace_name) f
LEFT JOIN (SELECT tablespace_name, SUM(bytes) bytes FROM SYS.DBA_FREE_SPACE GROUP BY tablespace_name) l
       ON l.tablespace_name = f.tablespace_name
UNION ALL
SELECT t.tablespace_name, 'TEMPORAL', COUNT(*),
       ROUND(SUM(t.bytes)/1048576,1),
       ROUND((SUM(t.bytes) - MAX(NVL(l.free_space,0)))/1048576,1),
       ROUND(SUM(GREATEST(t.bytes, DECODE(t.autoextensible,'YES',t.maxbytes,t.bytes)))/1048576),
       ROUND((SUM(t.bytes) - MAX(NVL(l.free_space,0)))/SUM(t.bytes)*100,1)
FROM SYS.DBA_TEMP_FILES t
LEFT JOIN SYS.DBA_TEMP_FREE_SPACE l ON l.tablespace_name = t.tablespace_name
GROUP BY t.tablespace_name;

CREATE OR REPLACE VIEW UNIV_SEC.V_SEGMENTOS AS
SELECT owner AS esquema, segment_name AS segmento, segment_type AS tipo, tablespace_name,
       ROUND(bytes/1024) AS tamano_kb, extents AS extensiones
FROM SYS.DBA_SEGMENTS
WHERE owner IN ('UNIVERSIDAD','UNIV_SEC');

CREATE OR REPLACE VIEW UNIV_SEC.V_USUARIOS AS
SELECT u.username, u.account_status,
       FROM_TZ(CAST(u.created AS TIMESTAMP),'UTC') AS creado,
       u.last_login AS ultimo_acceso, u.profile,
       (SELECT LISTAGG(r.granted_role, ',') WITHIN GROUP (ORDER BY r.granted_role)
          FROM SYS.DBA_ROLE_PRIVS r
         WHERE r.grantee = u.username AND r.granted_role LIKE 'ROL\_UNIV\_%' ESCAPE '\') AS rol
FROM SYS.DBA_USERS u
WHERE u.username LIKE 'U\_%' ESCAPE '\';

GRANT SELECT ON UNIV_SEC.V_TABLESPACES TO ROL_UNIV_ADMIN;
GRANT SELECT ON UNIV_SEC.V_SEGMENTOS   TO ROL_UNIV_ADMIN;
GRANT SELECT ON UNIV_SEC.V_USUARIOS    TO ROL_UNIV_ADMIN;

-- =========================================================
-- Gestión de usuarios: el administrador NO recibe CREATE/ALTER/DROP USER.
-- Solo ejecuta este paquete, que únicamente puede tocar cuentas U_* y los 4 roles.
-- =========================================================
GRANT CREATE USER, ALTER USER, DROP USER TO UNIV_SEC;
GRANT ROL_UNIV_CONSULTA, ROL_UNIV_OPERADOR, ROL_UNIV_AUDITOR, ROL_UNIV_ADMIN TO UNIV_SEC WITH ADMIN OPTION;

CREATE OR REPLACE PACKAGE UNIV_SEC.PKG_USUARIOS AUTHID DEFINER AS
  PROCEDURE crear (p_usuario VARCHAR2, p_password VARCHAR2, p_rol VARCHAR2);
  PROCEDURE cambiar_password (p_usuario VARCHAR2, p_password VARCHAR2);
  PROCEDURE cambiar_rol (p_usuario VARCHAR2, p_rol VARCHAR2);
  PROCEDURE bloquear (p_usuario VARCHAR2);
  PROCEDURE desbloquear (p_usuario VARCHAR2);
  PROCEDURE eliminar (p_usuario VARCHAR2);
END;
/
CREATE OR REPLACE PACKAGE BODY UNIV_SEC.PKG_USUARIOS AS

  FUNCTION nombre_valido (p_usuario VARCHAR2) RETURN VARCHAR2 IS
    v VARCHAR2(128) := UPPER(TRIM(p_usuario));
  BEGIN
    IF v IS NULL OR NOT REGEXP_LIKE(v, '^U_[A-Z0-9_]{1,28}$') THEN
      RAISE_APPLICATION_ERROR(-20001, 'El usuario debe empezar por U_ y usar solo letras, números y guion bajo (máx. 30).');
    END IF;
    RETURN v;
  END;

  FUNCTION rol_valido (p_rol VARCHAR2) RETURN VARCHAR2 IS
    v VARCHAR2(128) := UPPER(TRIM(p_rol));
  BEGIN
    IF v IS NULL OR v NOT IN ('ROL_UNIV_CONSULTA','ROL_UNIV_OPERADOR','ROL_UNIV_AUDITOR','ROL_UNIV_ADMIN') THEN
      RAISE_APPLICATION_ERROR(-20002, 'Rol no válido.');
    END IF;
    RETURN v;
  END;

  FUNCTION clave_segura (p_password VARCHAR2) RETURN VARCHAR2 IS
  BEGIN
    IF p_password IS NULL OR INSTR(p_password, '"') > 0 OR REGEXP_LIKE(p_password, '[[:cntrl:]]') THEN
      RAISE_APPLICATION_ERROR(-20003, 'La contraseña no puede estar vacía ni contener comillas dobles.');
    END IF;
    RETURN p_password;
  END;

  FUNCTION usuario_existente (p_usuario VARCHAR2) RETURN VARCHAR2 IS
    v VARCHAR2(128) := nombre_valido(p_usuario);
    n PLS_INTEGER;
  BEGIN
    SELECT COUNT(*) INTO n FROM SYS.DBA_USERS WHERE username = v;
    IF n = 0 THEN
      RAISE_APPLICATION_ERROR(-20004, 'El usuario ' || v || ' no existe.');
    END IF;
    RETURN v;
  END;

  PROCEDURE no_sobre_si_mismo (p_usuario VARCHAR2) IS
  BEGIN
    IF p_usuario = SYS_CONTEXT('USERENV','SESSION_USER') THEN
      RAISE_APPLICATION_ERROR(-20005, 'No puedes hacer esta operación sobre tu propia cuenta.');
    END IF;
  END;

  PROCEDURE quitar_roles (p_usuario VARCHAR2) IS
  BEGIN
    FOR r IN (SELECT granted_role FROM SYS.DBA_ROLE_PRIVS
               WHERE grantee = p_usuario AND granted_role LIKE 'ROL\_UNIV\_%' ESCAPE '\') LOOP
      EXECUTE IMMEDIATE 'REVOKE ' || r.granted_role || ' FROM ' || p_usuario;
    END LOOP;
  END;

  PROCEDURE crear (p_usuario VARCHAR2, p_password VARCHAR2, p_rol VARCHAR2) IS
    v_usuario VARCHAR2(128) := nombre_valido(p_usuario);
    v_rol     VARCHAR2(128) := rol_valido(p_rol);
  BEGIN
    EXECUTE IMMEDIATE 'CREATE USER ' || v_usuario || ' IDENTIFIED BY "' || clave_segura(p_password) || '"'
      || ' DEFAULT TABLESPACE TS_UNIV_DATOS TEMPORARY TABLESPACE TEMP_UNIV PROFILE PERF_UNIV_USUARIOS';
    EXECUTE IMMEDIATE 'GRANT ' || v_rol || ' TO ' || v_usuario;
  END;

  PROCEDURE cambiar_password (p_usuario VARCHAR2, p_password VARCHAR2) IS
  BEGIN
    EXECUTE IMMEDIATE 'ALTER USER ' || usuario_existente(p_usuario)
      || ' IDENTIFIED BY "' || clave_segura(p_password) || '"';
  END;

  PROCEDURE cambiar_rol (p_usuario VARCHAR2, p_rol VARCHAR2) IS
    v_usuario VARCHAR2(128) := usuario_existente(p_usuario);
    v_rol     VARCHAR2(128) := rol_valido(p_rol);
  BEGIN
    no_sobre_si_mismo(v_usuario);
    quitar_roles(v_usuario);
    EXECUTE IMMEDIATE 'GRANT ' || v_rol || ' TO ' || v_usuario;
  END;

  PROCEDURE bloquear (p_usuario VARCHAR2) IS
    v_usuario VARCHAR2(128) := usuario_existente(p_usuario);
  BEGIN
    no_sobre_si_mismo(v_usuario);
    EXECUTE IMMEDIATE 'ALTER USER ' || v_usuario || ' ACCOUNT LOCK';
  END;

  PROCEDURE desbloquear (p_usuario VARCHAR2) IS
  BEGIN
    EXECUTE IMMEDIATE 'ALTER USER ' || usuario_existente(p_usuario) || ' ACCOUNT UNLOCK';
  END;

  PROCEDURE eliminar (p_usuario VARCHAR2) IS
    v_usuario VARCHAR2(128) := usuario_existente(p_usuario);
  BEGIN
    no_sobre_si_mismo(v_usuario);
    EXECUTE IMMEDIATE 'DROP USER ' || v_usuario;
  END;
END;
/
GRANT EXECUTE ON UNIV_SEC.PKG_USUARIOS TO ROL_UNIV_ADMIN;

-- =========================================================
-- Usuarios de demostración, uno por rol
-- =========================================================
BEGIN
  UNIV_SEC.PKG_USUARIOS.crear('U_ADMIN',    '&pw_admin',    'ROL_UNIV_ADMIN');
  UNIV_SEC.PKG_USUARIOS.crear('U_OPERADOR', '&pw_operador', 'ROL_UNIV_OPERADOR');
  UNIV_SEC.PKG_USUARIOS.crear('U_CONSULTA', '&pw_consulta', 'ROL_UNIV_CONSULTA');
  UNIV_SEC.PKG_USUARIOS.crear('U_AUDITOR',  '&pw_auditor',  'ROL_UNIV_AUDITOR');
END;
/
