-- Elimina SOLO los objetos de este proyecto. No toca HR, BIBLIOTECA ni otros esquemas.
SET VERIFY OFF FEEDBACK OFF SERVEROUTPUT ON
ALTER SESSION SET CONTAINER = FREEPDB1;
BEGIN
  FOR p IN (SELECT DISTINCT policy_name FROM audit_unified_enabled_policies WHERE policy_name LIKE 'POL\_UNIV\_%' ESCAPE '\') LOOP
    EXECUTE IMMEDIATE 'NOAUDIT POLICY ' || p.policy_name;
  END LOOP;
  FOR p IN (SELECT DISTINCT policy_name FROM audit_unified_policies WHERE policy_name LIKE 'POL\_UNIV\_%' ESCAPE '\') LOOP
    EXECUTE IMMEDIATE 'DROP AUDIT POLICY ' || p.policy_name;
  END LOOP;
  FOR u IN (SELECT username FROM dba_users WHERE username LIKE 'U\_%' ESCAPE '\' OR username IN ('UNIVERSIDAD','UNIV_SEC')) LOOP
    EXECUTE IMMEDIATE 'DROP USER ' || u.username || ' CASCADE';
  END LOOP;
  FOR r IN (SELECT role FROM dba_roles WHERE role LIKE 'ROL\_UNIV\_%' ESCAPE '\') LOOP
    EXECUTE IMMEDIATE 'DROP ROLE ' || r.role;
  END LOOP;
  FOR t IN (SELECT tablespace_name FROM dba_tablespaces WHERE tablespace_name IN ('TS_UNIV_DATOS','TS_UNIV_INDICES','TS_UNIV_AUDITORIA','TEMP_UNIV')) LOOP
    EXECUTE IMMEDIATE 'DROP TABLESPACE ' || t.tablespace_name || ' INCLUDING CONTENTS AND DATAFILES';
  END LOOP;
  FOR x IN (SELECT profile FROM dba_profiles WHERE profile = 'PERF_UNIV_USUARIOS' AND ROWNUM = 1) LOOP
    EXECUTE IMMEDIATE 'DROP PROFILE PERF_UNIV_USUARIOS';
  END LOOP;
  FOR f IN (SELECT object_name FROM dba_objects WHERE owner='SYS' AND object_name='VERIFICA_CLAVE_UNIV') LOOP
    EXECUTE IMMEDIATE 'DROP FUNCTION SYS.VERIFICA_CLAVE_UNIV';
  END LOOP;
END;
/
EXIT
