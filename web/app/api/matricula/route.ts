// Formulario de matrícula: consulta y matricula varias materias de un estudiante a la vez.
import oracledb from "oracledb";
import { NextResponse } from "next/server";
import { ErrorHttp, ejecutar, enTransaccion, leerJson, ruta, sesionDe } from "@/lib/servidor/oracle";

const SEMESTRE = /^\d{4}-[12]$/;
const MAX_MATERIAS = 10;

function codigoEstudiante(valor: unknown) {
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0 || n > 999999) {
    throw new ErrorHttp(400, "El código del estudiante debe ser un número entero entre 1 y 999999.");
  }
  return n;
}

// GET /api/matricula?estudiante=201 → todas sus matrículas, de la más reciente a la más antigua
export const GET = ruta(async (req) => {
  const s = sesionDe(req);
  const estudiante = codigoEstudiante(req.nextUrl.searchParams.get("estudiante"));
  const ficha = await ejecutar(
    s,
    "SELECT id_estudiante, nombre, programa, correo FROM ESTUDIANTES WHERE id_estudiante = :estudiante",
    { estudiante },
  );
  if (!ficha.rows?.length) {
    throw new ErrorHttp(404, `No hay ningún estudiante registrado con el código ${estudiante}.`);
  }
  const r = await ejecutar(
    s,
    `SELECT m.id_matricula, m.semestre, c.id_curso, c.nombre AS curso, c.creditos,
            p.id_profesor, p.nombre AS profesor, p.departamento
     FROM MATRICULAS m
     JOIN CURSOS c ON c.id_curso = m.id_curso
     JOIN PROFESORES p ON p.id_profesor = m.id_profesor
     WHERE m.id_estudiante = :estudiante
     ORDER BY m.semestre DESC, c.nombre`,
    { estudiante },
  );
  return NextResponse.json({ estudiante: ficha.rows[0], matriculas: r.rows });
});

// POST /api/matricula { estudiante, semestre, materias: [{ id_curso, id_profesor }] }
export const POST = ruta(async (req) => {
  const s = sesionDe(req);
  const c = await leerJson(req);
  const estudiante = codigoEstudiante(c.estudiante);
  const semestre = String(c.semestre ?? "").trim();
  if (!SEMESTRE.test(semestre)) throw new ErrorHttp(400, "El semestre debe tener el formato AAAA-1 o AAAA-2, por ejemplo 2026-2.");

  const materias = Array.isArray(c.materias) ? c.materias : [];
  if (!materias.length) throw new ErrorHttp(400, "Agrega al menos una materia.");
  if (materias.length > MAX_MATERIAS) throw new ErrorHttp(400, `Máximo ${MAX_MATERIAS} materias por matrícula.`);
  const filas = materias.map((m: Record<string, unknown>) => {
    const id_curso = Number(m?.id_curso);
    const id_profesor = Number(m?.id_profesor);
    if (!Number.isInteger(id_curso) || !Number.isInteger(id_profesor)) {
      throw new ErrorHttp(400, "Cada materia necesita un curso y un profesor.");
    }
    return { id_curso, id_profesor };
  });
  if (new Set(filas.map((f: { id_curso: number }) => f.id_curso)).size !== filas.length) {
    throw new ErrorHttp(400, "Hay una materia repetida en la lista.");
  }

  const creadas = await enTransaccion(s, async (conn) => {
    // El bloqueo evita que dos matrículas simultáneas tomen el mismo código.
    await conn.execute("LOCK TABLE MATRICULAS IN EXCLUSIVE MODE");
    const r = await conn.execute<[number]>("SELECT NVL(MAX(id_matricula), 0) FROM MATRICULAS", [], {
      outFormat: oracledb.OUT_FORMAT_ARRAY,
    });
    let siguiente = r.rows?.[0][0] ?? 0;
    const ids: number[] = [];
    for (const f of filas) {
      siguiente += 1;
      await conn.execute(
        `INSERT INTO MATRICULAS (id_matricula, id_curso, id_profesor, id_estudiante, semestre)
         VALUES (:id, :id_curso, :id_profesor, :estudiante, :semestre)`,
        { id: siguiente, ...f, estudiante, semestre },
      );
      ids.push(siguiente);
    }
    return ids;
  });
  return NextResponse.json({ ok: true, matriculas: creadas }, { status: 201 });
});
