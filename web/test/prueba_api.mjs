// Prueba de extremo a extremo contra la app y la base reales. Uso: node test/prueba_api.mjs
// (con el servidor encendido). Deja los datos como estaban.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const params = fs.readFileSync(path.join(raiz, 'sql', '00_parametros.sql'), 'utf8');
const clave = (n) => new RegExp(`DEFINE ${n}\\s*=\\s*"([^"]+)"`).exec(params)[1];
const BASE = process.env.BASE || 'http://localhost:3000';
let fallos = 0, ok = 0;
function check(nombre, cond, extra = '') {
  if (cond) { ok++; console.log(`  ok   ${nombre}`); }
  else { fallos++; console.log(`  FALLA ${nombre} ${extra}`); }
}
function cliente() {
  let cookie = '';
  return async (ruta, metodo = 'GET', cuerpo) => {
    const r = await fetch(BASE + '/api' + ruta, {
      method: metodo,
      headers: { ...(cuerpo ? { 'Content-Type': 'application/json' } : {}), cookie },
      body: cuerpo ? JSON.stringify(cuerpo) : undefined,
    });
    const sc = r.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    return { s: r.status, d: await r.json().catch(() => ({})) };
  };
}
async function entrar(usuario, password) {
  const c = cliente();
  const r = await c('/login', 'POST', { usuario, password });
  return { c, r };
}
const sql = (c, s) => c('/sql', 'POST', { sql: s });

console.log('Acceso');
{
  const a = await entrar('U_CONSULTA', 'incorrecta');
  check('contraseña errada → 401', a.r.s === 401, JSON.stringify(a.r));
  const b = await cliente()('/resumen');
  check('sin sesión → 401', b.s === 401);
}
const admin = (await entrar('U_ADMIN', clave('pw_admin'))).c;
const oper = (await entrar('U_OPERADOR', clave('pw_operador'))).c;
const cons = (await entrar('U_CONSULTA', clave('pw_consulta'))).c;
const audi = (await entrar('U_AUDITOR', clave('pw_auditor'))).c;

console.log('Lectura y reportes');
// Las pruebas no dependen de cuántos registros haya: comparan contra los totales iniciales.
const base = (await cons('/resumen')).d.totales;
{
  check('resumen con totales', base?.PROFESORES >= 30 && base?.CURSOS >= 40 && base?.MATRICULAS >= 120 && base?.ESTUDIANTES >= 60, JSON.stringify(base));
  const b = await cons('/tablas/profesores?q=' + encodeURIComponent('ramírez'));
  check('búsqueda con tilde encuentra a Jorge Ramírez', b.d.filas?.[0]?.NOMBRE === 'Jorge Ramírez', JSON.stringify(b.d));
  const m = await cons('/tablas/matriculas?tam=5&pagina=2&orden=CURSO&dir=desc');
  check('matrículas paginadas y ordenadas', m.d.filas?.length === 5 && m.d.total === base.MATRICULAS && !!m.d.filas[0].CURSO);
  const inj = await cons('/tablas/profesores?orden=' + encodeURIComponent('1; DROP TABLE x'));
  check('orden no permitido se ignora', inj.s === 200);
  const ts = await cons('/tablas/__proto__');
  check('tabla inexistente → 404', ts.s === 404);
  for (const [id, n] of [['1', null], ['2', base.CURSOS], ['3', base.MATRICULAS], ['4', null]]) {
    const rep = await cons('/reportes/' + id);
    check(`reporte ${id}: ${rep.d.filas?.length} filas`, rep.s === 200 && rep.d.filas.length > 0 && (n === null || rep.d.filas.length === n), JSON.stringify(rep.d).slice(0, 200));
  }
}

console.log('Permisos aplicados por Oracle');
{
  const r = await cons('/tablas/cursos', 'POST', { ID_CURSO: 999, NOMBRE: 'x', CREDITOS: 3 });
  check('consulta no inserta (ORA-01031)', r.s === 403, JSON.stringify(r));
  const d = await sql(cons, 'DELETE FROM matriculas');
  check('consulta no borra por consola SQL', d.s === 403, JSON.stringify(d));
  const b = await sql(oper, 'SELECT * FROM UNIV_SEC.BITACORA');
  check('operador no lee bitácora', b.s === 403, JSON.stringify(b));
  check('operador sin sección usuarios', (await oper('/usuarios')).s === 403);
  check('auditor sin sección usuarios', (await audi('/usuarios')).s === 403);
  check('consulta sin auditoría', (await cons('/auditoria/cambios')).s === 403);
  const e = await sql(oper, "BEGIN UNIV_SEC.PKG_USUARIOS.bloquear('U_ADMIN'); END;");
  check('operador no ejecuta el paquete', e.s >= 400, JSON.stringify(e));
  const f = await sql(admin, 'ALTER USER SYSTEM ACCOUNT LOCK');
  check('admin no puede tocar SYSTEM directamente', f.s === 403, JSON.stringify(f));
  const g = await sql(admin, 'CREATE USER HACK IDENTIFIED BY "Abcdef#12345"');
  check('admin no tiene CREATE USER directo', g.s === 403, JSON.stringify(g));
  const h = await sql(admin, 'SELECT * FROM dba_users');
  check('admin no lee DBA_USERS completo', h.s === 403, JSON.stringify(h));
  const i = await sql(admin, 'SELECT COUNT(*) FROM HR.EMPLOYEES');
  check('admin no ve el esquema HR', i.s === 403, JSON.stringify(i));
}

console.log('CRUD y restricciones de integridad');
{
  const id = (await oper('/tablas/cursos/siguiente-id')).d.id;
  const maximo = Math.max(...(await cons('/catalogo')).d.cursos.map((c) => c.ID_CURSO));
  check('siguiente id de cursos = máximo + 1', id === maximo + 1, `${id} vs ${maximo}`);
  const c = await oper('/tablas/cursos', 'POST', { ID_CURSO: id, NOMBRE: 'Curso de Prueba ñ', CREDITOS: 3 });
  check('crear curso', c.s === 201, JSON.stringify(c));
  check('PK duplicada', (await oper('/tablas/cursos', 'POST', { ID_CURSO: id, NOMBRE: 'dup', CREDITOS: 3 })).s === 409);
  const chk = await oper('/tablas/cursos', 'POST', { ID_CURSO: id + 1, NOMBRE: 'malo', CREDITOS: 9 });
  check('CHECK créditos (ORA-02290)', chk.s === 400 && /02290/.test(chk.d.error), JSON.stringify(chk));
  const nn = await oper('/tablas/cursos', 'POST', { ID_CURSO: id + 1, NOMBRE: '', CREDITOS: 3 });
  check('NOT NULL nombre', nn.s === 400, JSON.stringify(nn));
  const fk = await oper('/tablas/matriculas', 'POST', { ID_MATRICULA: 9000, ID_CURSO: 77777, ID_PROFESOR: 1, ID_ESTUDIANTE: 201, SEMESTRE: '2026-2' });
  check('FK materia inexistente (ORA-02291)', fk.s === 400 && /materia indicada no existe/.test(fk.d.error), JSON.stringify(fk));
  const sinAsignar = await oper('/tablas/matriculas', 'POST', { ID_MATRICULA: 9000, ID_CURSO: id, ID_PROFESOR: 1, ID_ESTUDIANTE: 201, SEMESTRE: '2026-2' });
  check('no se matricula con un profesor sin la materia asignada (FK_MAT_ASIGNACION)', sinAsignar.s === 400 && /no tiene asignada/.test(sinAsignar.d.error), JSON.stringify(sinAsignar));
  const asig1 = (await oper('/asignaciones/1')).d;
  const deProf1 = asig1.filter((m) => m.ASIGNADA).map((m) => m.ID_CURSO);
  check('asignar la materia nueva al profesor 1', (await oper('/asignaciones/1', 'PUT', { cursos: [...deProf1, id] })).s === 200);
  const mat = await oper('/tablas/matriculas', 'POST', { ID_MATRICULA: 9000, ID_CURSO: id, ID_PROFESOR: 1, ID_ESTUDIANTE: 201, SEMESTRE: '2026-2' });
  check('crear matrícula', mat.s === 201, JSON.stringify(mat));
  const hijo = await oper(`/tablas/cursos/${id}`, 'DELETE');
  check('borrar curso con matrículas (ORA-02292)', hijo.s === 409 && /02292/.test(hijo.d.error), JSON.stringify(hijo));
  const u = await oper(`/tablas/cursos/${id}`, 'PUT', { NOMBRE: 'Curso Editado', CREDITOS: 5 });
  check('editar curso', u.s === 200, JSON.stringify(u));
  check('editar inexistente → 404', (await oper('/tablas/cursos/88888', 'PUT', { NOMBRE: 'x', CREDITOS: 1 })).s === 404);
  check('borrar matrícula', (await oper('/tablas/matriculas/9000', 'DELETE')).s === 200);
  check('borrar curso (sus asignaciones se borran en cascada)', (await oper(`/tablas/cursos/${id}`, 'DELETE')).s === 200);
  check('la asignación desapareció con el curso', !(await oper('/asignaciones/1')).d.some((m) => m.ID_CURSO === id && m.ASIGNADA));
  const bit = await audi('/auditoria/cambios');
  const fila = bit.d.find((x) => x.TABLA === 'CURSOS' && x.OPERACION === 'UPDATE' && x.ID_REGISTRO === id);
  check('bitácora con usuario y antes/después', fila?.USUARIO_BD === 'U_OPERADOR' && /Curso de Prueba ñ/.test(fila.ANTES) && /Curso Editado/.test(fila.DESPUES), JSON.stringify(fila));
  const inm = await sql(admin, 'DELETE FROM UNIV_SEC.BITACORA');
  check('nadie borra la bitácora', inm.s >= 400, JSON.stringify(inm));
}

console.log('Asignación de materias a profesores');
{
  const a = await cons('/asignaciones/1');
  const dictadas = a.d.filter((m) => m.ASIGNADA);
  check('consultar materias del profesor 1', a.s === 200 && dictadas.some((m) => m.ID_CURSO === 101 && m.MATRICULAS > 0), JSON.stringify(dictadas).slice(0, 200));
  check('consulta no puede cambiar asignaciones', (await cons('/asignaciones/1', 'PUT', { cursos: [] })).s === 403);
  const quitar = await oper('/asignaciones/1', 'PUT', { cursos: dictadas.filter((m) => m.ID_CURSO !== 101).map((m) => m.ID_CURSO) });
  check('no se quita una materia con matrículas (FK_MAT_ASIGNACION)', quitar.s === 409 && /hay matrículas/.test(quitar.d.error), JSON.stringify(quitar));
  const despues = (await cons('/asignaciones/1')).d.filter((m) => m.ASIGNADA).length;
  check('si falla, no se cambia ninguna asignación (transacción)', despues === dictadas.length, `${despues} vs ${dictadas.length}`);
  // Desde la materia: profesores de la materia 101
  const pm = (await cons('/asignaciones/materia/101')).d;
  const de101 = pm.filter((p) => p.ASIGNADA).map((p) => p.ID_PROFESOR);
  check('consultar profesores de la materia 101', de101.includes(1) && pm.some((p) => p.ID_PROFESOR === 1 && p.MATRICULAS > 0), JSON.stringify(de101));
  check('consulta no puede cambiar profesores de una materia', (await cons('/asignaciones/materia/101', 'PUT', { profesores: [] })).s === 403);
  const sinUno = await oper('/asignaciones/materia/101', 'PUT', { profesores: de101.filter((p) => p !== 1) });
  check('no se quita a un profesor con matrículas en la materia', sinUno.s === 409 && /hay matrículas/.test(sinUno.d.error), JSON.stringify(sinUno));
  const libre = pm.find((p) => !p.ASIGNADA)?.ID_PROFESOR;
  check('agregar un profesor a la materia', (await oper('/asignaciones/materia/101', 'PUT', { profesores: [...de101, libre] })).s === 200);
  check('el profesor agregado ve la materia', (await cons(`/asignaciones/${libre}`)).d.some((m) => m.ID_CURSO === 101 && m.ASIGNADA));
  check('quitar de nuevo al profesor agregado', (await oper('/asignaciones/materia/101', 'PUT', { profesores: de101 })).s === 200);
  check('la materia queda como estaba', (await cons('/asignaciones/materia/101')).d.filter((p) => p.ASIGNADA).length === de101.length);
  const cat = await cons('/catalogo');
  check('el catálogo usa ASIGNACIONES', cat.d.asignaciones?.length > 0 && cat.d.asignaciones.every((x) => x.ID_CURSO && x.ID_PROFESOR));
}

console.log('Estudiantes');
const EST = 999001;
{
  const cat = await cons('/catalogo');
  check('catálogo completo', cat.d.estudiantes?.length === base.ESTUDIANTES && cat.d.cursos?.length === base.CURSOS && cat.d.profesores?.length === base.PROFESORES && cat.d.semestres?.includes('2026-2'), JSON.stringify(cat.d).slice(0, 200));
  const nuevo = (c, cuerpo) => c('/tablas/estudiantes', 'POST', { ID_ESTUDIANTE: EST, NOMBRE: 'Estudiante De Prueba', PROGRAMA: 'Derecho', CORREO: 'prueba.999001@universidad.edu.co', ...cuerpo });
  check('consulta no registra estudiantes', (await nuevo(cons)).s === 403);
  const malo = await nuevo(oper, { CORREO: 'sin-arroba' });
  check('correo inválido (CK_EST_CORREO)', malo.s === 400 && /correo/.test(malo.d.error), JSON.stringify(malo));
  const rep = await nuevo(oper, { CORREO: 'santiago.gomez201@universidad.edu.co' });
  check('correo repetido (UQ_EST_CORREO)', rep.s === 409 && /correo/.test(rep.d.error), JSON.stringify(rep));
  check('registrar estudiante', (await nuevo(oper)).s === 201);
  const borrar201 = await oper('/tablas/estudiantes/201', 'DELETE');
  check('no se borra un estudiante con matrículas (FK_MAT_ESTUDIANTE)', borrar201.s === 409 && /estudiante tiene matrículas/.test(borrar201.d.error), JSON.stringify(borrar201));
  const sinRegistro = await oper('/matricula', 'POST', { estudiante: 999002, semestre: '2026-1', materias: [{ id_curso: 101, id_profesor: 1 }] });
  check('no se matricula a un estudiante sin registrar', sinRegistro.s === 400 && /no está registrado/.test(sinRegistro.d.error), JSON.stringify(sinRegistro));
  check('consultar estudiante no registrado → 404', (await cons('/matricula?estudiante=999002')).s === 404);
}

console.log('Formulario de matrícula');
{
  const h = await cons('/matricula?estudiante=201');
  check('consultar matrículas del estudiante 201', h.s === 200 && h.d.matriculas?.length === 2 && h.d.estudiante?.NOMBRE === 'Santiago Gómez Hernández', JSON.stringify(h.d).slice(0, 200));
  check('código de estudiante inválido → 400', (await cons('/matricula?estudiante=abc')).s === 400);
  const nueva = (materias, semestre = '2026-1', c = oper) => c('/matricula', 'POST', { estudiante: EST, semestre, materias });
  check('consulta no puede matricular', (await nueva([{ id_curso: 101, id_profesor: 1 }], '2026-1', cons)).s === 403);
  check('semestre mal escrito → 400', (await nueva([{ id_curso: 101, id_profesor: 1 }], '2026-3')).s === 400);
  check('sin materias → 400', (await nueva([])).s === 400);
  check('materia repetida en la lista → 400', (await nueva([{ id_curso: 101, id_profesor: 1 }, { id_curso: 101, id_profesor: 2 }])).s === 400);
  const ok2 = await nueva([{ id_curso: 101, id_profesor: 1 }, { id_curso: 102, id_profesor: 2 }]);
  check('matricular 2 materias a la vez', ok2.s === 201 && ok2.d.matriculas?.length === 2, JSON.stringify(ok2));
  const dup = await nueva([{ id_curso: 103, id_profesor: 3 }, { id_curso: 101, id_profesor: 1 }]);
  check('misma materia y semestre otra vez → 409 (UQ_MAT_EST_CURSO_SEM)', dup.s === 409 && /ya tiene esa materia/.test(dup.d.error), JSON.stringify(dup));
  const fk = await nueva([{ id_curso: 103, id_profesor: 3 }, { id_curso: 77777, id_profesor: 1 }]);
  check('materia inexistente → 400 (ORA-02291)', fk.s === 400 && /02291/.test(fk.d.error), JSON.stringify(fk));
  const noDicta = await nueva([{ id_curso: 101, id_profesor: 2 }], '2027-1');
  check('el formulario rechaza un profesor que no dicta la materia', noDicta.s === 400 && /no tiene asignada/.test(noDicta.d.error), JSON.stringify(noDicta));
  const tras = await oper(`/matricula?estudiante=${EST}`);
  check('si una falla no se guarda ninguna (transacción)', tras.d.matriculas?.length === 2 && !tras.d.matriculas.some((m) => m.ID_CURSO === 103), JSON.stringify(tras.d));
  check('la misma materia en otro semestre sí se permite', (await nueva([{ id_curso: 101, id_profesor: 1 }], '2026-2')).s === 201);
  const todas = (await oper(`/matricula?estudiante=${EST}`)).d.matriculas ?? [];
  for (const m of todas) await oper(`/tablas/matriculas/${m.ID_MATRICULA}`, 'DELETE');
  check('limpieza de matrículas de prueba', ((await oper(`/matricula?estudiante=${EST}`)).d.matriculas ?? []).length === 0);
  check('eliminar el estudiante de prueba', (await oper(`/tablas/estudiantes/${EST}`, 'DELETE')).s === 200);
}

console.log('Gestión de usuarios');
const CLAVE1 = 'Prueba_Uno#2026', CLAVE2 = 'Prueba_Dos#2026';
{
  const debil = await admin('/usuarios', 'POST', { usuario: 'U_TEST', password: 'abc', rol: 'ROL_UNIV_CONSULTA' });
  check('contraseña débil rechazada', debil.s === 400 && /10 caracteres/.test(debil.d.error), JSON.stringify(debil));
  const pref = await admin('/usuarios', 'POST', { usuario: 'HR2', password: CLAVE1, rol: 'ROL_UNIV_CONSULTA' });
  check('sin prefijo U_ rechazado', pref.s === 400, JSON.stringify(pref));
  const iny = await admin('/usuarios', 'POST', { usuario: 'U_X IDENTIFIED BY x', password: CLAVE1, rol: 'ROL_UNIV_CONSULTA' });
  check('inyección en nombre rechazada', iny.s === 400, JSON.stringify(iny));
  const iny2 = await admin('/usuarios', 'POST', { usuario: 'U_TEST', password: 'A" b#1234567', rol: 'ROL_UNIV_CONSULTA' });
  check('comilla en contraseña rechazada', iny2.s === 400, JSON.stringify(iny2));
  const rolx = await admin('/usuarios', 'POST', { usuario: 'U_TEST', password: CLAVE1, rol: 'DBA' });
  check('rol DBA rechazado', rolx.s === 400, JSON.stringify(rolx));
  const c = await admin('/usuarios', 'POST', { usuario: 'U_TEST', password: CLAVE1, rol: 'ROL_UNIV_CONSULTA' });
  check('crear usuario', c.s === 201, JSON.stringify(c));
  check('duplicado → 409', (await admin('/usuarios', 'POST', { usuario: 'U_TEST', password: CLAVE1, rol: 'ROL_UNIV_CONSULTA' })).s === 409);

  let t = await entrar('U_TEST', CLAVE1);
  check('el nuevo usuario entra', t.r.s === 200 && t.r.d.rol === 'ROL_UNIV_CONSULTA', JSON.stringify(t.r));
  await t.c('/logout', 'POST');

  check('cambiar rol', (await admin('/usuarios/U_TEST/rol', 'POST', { rol: 'ROL_UNIV_OPERADOR' })).s === 200);
  t = await entrar('U_TEST', CLAVE1);
  check('rol nuevo aplicado', t.r.d.rol === 'ROL_UNIV_OPERADOR' && t.r.d.permisos.escribir, JSON.stringify(t.r));
  await t.c('/logout', 'POST');

  const lista = await admin('/usuarios');
  check('listado', lista.d.some((u) => u.USERNAME === 'U_TEST' && u.ROL === 'ROL_UNIV_OPERADOR'), JSON.stringify(lista.d));
  check('solo cuentas U_', lista.d.every((u) => u.USERNAME.startsWith('U_')));

  check('bloquear', (await admin('/usuarios/U_TEST/bloqueo', 'POST', { bloquear: true })).s === 200);
  t = await entrar('U_TEST', CLAVE1);
  check('bloqueado no entra', t.r.s === 403 && /bloqueada/.test(t.r.d.error), JSON.stringify(t.r));
  check('desbloquear', (await admin('/usuarios/U_TEST/bloqueo', 'POST', { bloquear: false })).s === 200);
  check('cambiar contraseña', (await admin('/usuarios/U_TEST/password', 'POST', { password: CLAVE2 })).s === 200);
  t = await entrar('U_TEST', CLAVE2);
  check('entra con la nueva clave', t.r.s === 200, JSON.stringify(t.r));
  const ocupado = await admin('/usuarios/U_TEST', 'DELETE');
  check('no borra con sesión abierta', ocupado.s === 409, JSON.stringify(ocupado));
  await t.c('/logout', 'POST');

  check('admin no se bloquea a sí mismo', (await admin('/usuarios/U_ADMIN/bloqueo', 'POST', { bloquear: true })).s === 400);
  check('admin no se elimina a sí mismo', (await admin('/usuarios/U_ADMIN', 'DELETE')).s === 400);
  check('no toca cuentas ajenas (HR)', (await admin('/usuarios/HR/bloqueo', 'POST', { bloquear: true })).s === 400);
  check('no toca cuentas ajenas (SYSTEM)', (await admin('/usuarios/SYSTEM', 'DELETE')).s === 400);
  const b = await admin('/usuarios/U_TEST', 'DELETE');
  check('eliminar usuario', b.s === 200, JSON.stringify(b));
}

console.log('Almacenamiento y auditoría');
{
  const a = await admin('/almacenamiento');
  check('tablespaces y segmentos', a.d.tablespaces?.some((t) => t.TABLESPACE_NAME === 'TS_UNIV_DATOS') && a.d.segmentos?.length > 5 && Array.isArray(a.d.backups), JSON.stringify(a).slice(0, 300));
  const u = await audi('/auditoria/unificada');
  const acc = new Set((u.d || []).map((x) => x.ACTION_NAME));
  check('auditoría unificada: LOGON, CREATE USER, ALTER USER, DROP USER', ['LOGON', 'CREATE USER', 'ALTER USER', 'DROP USER'].every((x) => acc.has(x)), [...acc].join(','));
  check('registra inicio de sesión fallido', u.d.some((x) => x.ACTION_NAME === 'LOGON' && x.RETURN_CODE === 1017), '');
  const cu = u.d.find((x) => x.ACTION_NAME === 'CREATE USER');
  check('CREATE USER queda a nombre de quien lo hizo', cu?.DBUSERNAME === 'U_ADMIN', cu?.DBUSERNAME);
  const dml = await sql(audi, `SELECT action_name, COUNT(*) FROM unified_audit_trail
    WHERE dbusername = 'U_OPERADOR' AND object_schema = 'UNIVERSIDAD'
      AND event_timestamp > SYSTIMESTAMP - INTERVAL '5' MINUTE GROUP BY action_name`);
  const hechas = new Set((dml.d.filas || []).map((f) => f[0]));
  check('la política audita INSERT, UPDATE y DELETE recientes', ['INSERT', 'UPDATE', 'DELETE'].every((x) => hechas.has(x)), JSON.stringify(dml.d));
  const fin = await cons('/resumen');
  check('datos intactos al final', ['PROFESORES', 'CURSOS', 'MATRICULAS', 'ESTUDIANTES'].every((k) => fin.d.totales[k] === base[k]), JSON.stringify(fin.d.totales));
}
for (const c of [admin, oper, cons, audi]) await c('/logout', 'POST');
console.log(`\n${ok} correctas, ${fallos} fallidas`);
process.exit(fallos ? 1 : 0);
