// Conexión a Oracle. Cada persona entra con su usuario REAL de la base:
// los permisos los aplica Oracle y la auditoría registra a quien hizo cada cambio.
import crypto from "node:crypto";
import oracledb from "oracledb";
import { unstable_rethrow } from "next/navigation";
import { NextResponse, type NextRequest } from "next/server";

export const DB = process.env.DB_CONNECT || "localhost:1521/FREEPDB1";
const INACTIVIDAD_MS = 30 * 60 * 1000;

oracledb.fetchAsString = [oracledb.CLOB];

export type Permisos = { escribir: boolean; auditar: boolean; administrar: boolean };
export type Sesion = {
  pool: oracledb.Pool;
  usuario: string;
  rol: string;
  permisos: Permisos;
  ultimoUso: number;
};

// Las sesiones viven en memoria del servidor (globalThis para que todas las rutas compartan el mismo mapa).
// La contraseña no se guarda: solo el pool de conexiones ya autenticado.
const global = globalThis as unknown as {
  __univSesiones?: Map<string, Sesion>;
  __univLimpieza?: NodeJS.Timeout;
};
const sesiones = (global.__univSesiones ??= new Map<string, Sesion>());

if (!global.__univLimpieza) {
  global.__univLimpieza = setInterval(() => {
    for (const [sid, s] of sesiones) {
      if (Date.now() - s.ultimoUso > INACTIVIDAD_MS) void cerrarSesion(sid);
    }
  }, 60_000);
  global.__univLimpieza.unref();
}

export class ErrorHttp extends Error {
  constructor(public estado: number, mensaje: string) {
    super(mensaje);
  }
}

const ROLES_ORDEN = ["ROL_UNIV_ADMIN", "ROL_UNIV_AUDITOR", "ROL_UNIV_OPERADOR", "ROL_UNIV_CONSULTA"];

export async function iniciarSesion(usuario: string, password: string) {
  const pool = await oracledb.createPool({
    user: usuario,
    password,
    connectString: DB,
    poolMin: 0,
    poolMax: 4,
    poolIncrement: 1,
    poolTimeout: 120,
    sessionCallback: (conn, _tag, cb) => {
      conn.execute("ALTER SESSION SET CURRENT_SCHEMA = UNIVERSIDAD").then(() => cb(), cb);
    },
  });
  try {
    const conn = await pool.getConnection();
    let roles: string[];
    try {
      const r = await conn.execute<[string]>(
        "SELECT role FROM session_roles WHERE role LIKE 'ROL\\_UNIV\\_%' ESCAPE '\\'",
        [],
        { outFormat: oracledb.OUT_FORMAT_ARRAY },
      );
      roles = (r.rows ?? []).map((f) => f[0]);
    } finally {
      await conn.close();
    }
    if (!roles.length) throw new ErrorHttp(403, "Este usuario no tiene ningún rol de la aplicación.");
    const sesion: Sesion = {
      pool,
      usuario: usuario.toUpperCase(),
      rol: ROLES_ORDEN.find((x) => roles.includes(x))!,
      ultimoUso: Date.now(),
      permisos: {
        escribir: roles.includes("ROL_UNIV_OPERADOR"),
        auditar: roles.includes("ROL_UNIV_AUDITOR"),
        administrar: roles.includes("ROL_UNIV_ADMIN"),
      },
    };
    const sid = crypto.randomBytes(32).toString("hex");
    sesiones.set(sid, sesion);
    return { sid, sesion };
  } catch (e) {
    await pool.close(0).catch(() => {});
    throw e;
  }
}

export async function cerrarSesion(sid: string | undefined) {
  const s = sid && sesiones.get(sid);
  if (!s || !sid) return;
  sesiones.delete(sid);
  await s.pool.close(0).catch(() => {});
}

export function sesionDe(req: NextRequest): Sesion {
  const sid = req.cookies.get("sid")?.value;
  const s = sid && /^[a-f0-9]{64}$/.test(sid) ? sesiones.get(sid) : undefined;
  if (!s) throw new ErrorHttp(401, "Tu sesión terminó. Vuelve a iniciar sesión.");
  s.ultimoUso = Date.now();
  return s;
}

export function exigir(s: Sesion, permiso: keyof Permisos) {
  if (!s.permisos[permiso]) throw new ErrorHttp(403, "Tu rol no tiene permiso para esta sección.");
}

export async function ejecutar<T = Record<string, unknown>>(
  s: Sesion,
  sql: string,
  binds: oracledb.BindParameters = {},
  opciones: oracledb.ExecuteOptions = {},
) {
  const conn = await s.pool.getConnection();
  try {
    return await conn.execute<T>(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      autoCommit: true,
      ...opciones,
    });
  } finally {
    await conn.close();
  }
}

export const comoArreglo = { outFormat: oracledb.OUT_FORMAT_ARRAY } as const;

// Varias sentencias en una sola transacción: si alguna falla, se deshacen todas.
export async function enTransaccion<T>(s: Sesion, trabajo: (conn: oracledb.Connection) => Promise<T>) {
  const conn = await s.pool.getConnection();
  try {
    const resultado = await trabajo(conn);
    await conn.commit();
    return resultado;
  } catch (e) {
    await conn.rollback().catch(() => {});
    throw e;
  } finally {
    await conn.close();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function aTabla(r: oracledb.Result<any>) {
  return { columnas: (r.metaData ?? []).map((m) => m.name), filas: (r.rows ?? []) as unknown[][] };
}

export async function leerJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const cuerpo = await req.json();
    return cuerpo && typeof cuerpo === "object" ? cuerpo : {};
  } catch {
    throw new ErrorHttp(400, "Solicitud no válida.");
  }
}

// ---------- Errores de Oracle en lenguaje claro ----------
const ERRORES: Record<number, [number, string]> = {
  1: [409, "Ya existe un registro con ese código."],
  942: [403, "No tienes acceso a esa tabla o no existe."],
  1017: [401, "Usuario o contraseña incorrectos."],
  1031: [403, "Tu rol no tiene privilegios para esta operación (ORA-01031)."],
  1400: [400, "Falta un campo obligatorio."],
  1438: [400, "El número es demasiado grande para ese campo."],
  1920: [409, "Ese usuario ya existe."],
  1940: [409, "El usuario tiene sesiones abiertas. Debe cerrar sesión antes de eliminarlo."],
  2290: [400, "El valor no cumple una restricción: los créditos deben estar entre 1 y 5 (ORA-02290)."],
  2291: [400, "El curso o el profesor indicado no existe (ORA-02291)."],
  2292: [409, "No se puede eliminar: tiene matrículas asociadas (ORA-02292)."],
  12899: [400, "El texto es demasiado largo para ese campo."],
  28000: [403, "La cuenta está bloqueada."],
  28001: [403, "La contraseña expiró. Pide a un administrador que la restablezca."],
  28003: [400, "La contraseña no cumple la política de seguridad."],
  28007: [400, "Esa contraseña ya se usó antes. Elige otra."],
  41900: [403, "Tu rol no tiene privilegios para esta operación (ORA-41900)."],
};

function traducirError(e: unknown): [number, string] {
  if (e instanceof ErrorHttp) return [e.estado, e.message];
  const err = e as { errorNum?: number; code?: string; message?: string };
  const num = err.errorNum ?? 0;
  const msg = err.message ?? "";
  if (num >= 20000 && num <= 20999) {
    const m = /ORA-20\d{3}:\s*([^\n]+)/.exec(msg);
    return [400, m ? m[1] : msg];
  }
  // Mensajes según la restricción que Oracle reporta
  const porRestriccion: [number, RegExp, number, string][] = [
    [1, /UQ_MAT_EST_CURSO_SEM/, 409, "Ese estudiante ya tiene esa materia matriculada en ese semestre."],
    [1, /UQ_EST_CORREO/, 409, "Ya hay un estudiante registrado con ese correo."],
    [2290, /CK_EST_CORREO/, 400, "El correo no tiene un formato válido (ORA-02290)."],
    [2291, /FK_MAT_ESTUDIANTE/, 400, "El estudiante no está registrado. Regístralo primero en Estudiantes (ORA-02291)."],
    [2291, /FK_MAT_ASIGNACION/, 400, "Ese profesor no tiene asignada esa materia. Asígnasela en Profesores (ORA-02291)."],
    [2292, /FK_MAT_ASIGNACION/, 409, "No se puede quitar: hay matrículas de esa materia con ese profesor (ORA-02292)."],
    [2291, /FK_MAT_CURSO/, 400, "La materia indicada no existe (ORA-02291)."],
    [2291, /FK_MAT_PROFESOR/, 400, "El profesor indicado no existe (ORA-02291)."],
    [2292, /FK_MAT_ESTUDIANTE/, 409, "No se puede eliminar: el estudiante tiene matrículas (ORA-02292)."],
  ];
  for (const [codigo, patron, estado, texto] of porRestriccion) {
    if (num === codigo && patron.test(msg)) return [estado, texto];
  }
  if (num === 28003) {
    const m = /ORA-201\d{2}:\s*([^\n]+)/.exec(msg);
    if (m) return [400, m[1]];
  }
  if (ERRORES[num]) return ERRORES[num];
  if (/^NJS-(5\d\d|040)/.test(err.code ?? "") || [3113, 3114, 12514, 12541].includes(num)) {
    return [503, "No hay conexión con la base de datos. Revisa que el contenedor esté encendido."];
  }
  if (num) return [400, msg.split("\n")[0]];
  console.error(e);
  return [500, "Error interno del servidor."];
}

// Envuelve cada route handler: convierte cualquier error en una respuesta JSON
// y rechaza peticiones que cambian datos si vienen de otro sitio.
export function ruta<C>(fn: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C) => {
    try {
      if (req.method !== "GET") {
        const origen = req.headers.get("origin");
        if (origen && new URL(origen).host !== req.headers.get("host")) {
          throw new ErrorHttp(403, "Origen no permitido.");
        }
      }
      return await fn(req, ctx);
    } catch (e) {
      // Señales internas de Next.js (p. ej. al prerenderizar en el build) no son errores nuestros.
      unstable_rethrow(e);
      const [estado, mensaje] = traducirError(e);
      return NextResponse.json({ error: mensaje }, { status: estado });
    }
  };
}
