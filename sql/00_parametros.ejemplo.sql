-- Plantilla de parámetros. Cópiala como 00_parametros.sql y cambia las contraseñas:
--   cp sql/00_parametros.ejemplo.sql sql/00_parametros.sql
-- Cada contraseña debe tener mínimo 10 caracteres, mayúscula, minúscula, número y símbolo,
-- y no puede contener el nombre del usuario (lo exige la función VERIFICA_CLAVE_UNIV).
DEFINE pw_owner     = "Cambia_Owner#1"
DEFINE pw_admin     = "Cambia_Admin#1"
DEFINE pw_operador  = "Cambia_Oper#1"
DEFINE pw_consulta  = "Cambia_Cons#1"
DEFINE pw_auditor   = "Cambia_Audi#1"
DEFINE ruta_datos   = "/opt/oracle/oradata/FREE/FREEPDB1"
