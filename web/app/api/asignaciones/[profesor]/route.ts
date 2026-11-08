// Materias que dicta un profesor (tabla ASIGNACIONES).
import oracledb from "oracledb";
import { NextResponse } from "next/server";
import { ErrorHttp, ejecutar, enTransaccion, leerJson, ruta, sesionDe } from "@/lib/servidor/oracle";
import { idNumerico } from "@/lib/servidor/datos";

type Ctx = RouteContext<"/api/asignaciones/[profesor]">;

// GET → todas las materias, marcando las asignadas y cuántas matrículas tiene cada una con este profesor
export const GET = ruta(async (req, ctx: Ctx) => {
  const s = sesionDe(req);
  const profesor = idNumerico((await ctx.params).profesor);
  const r = await ejecutar(
    s,
    `SELECT c.id_curso, c.nombre, c.creditos,
            CASE WHEN a.id_curso IS NULL THEN 0 ELSE 1 END AS asignada,
            (SELECT COUNT(*) FROM MATRICULAS m WHERE m.id_curso = c.id_curso AND m.id_profesor = :profesor) AS matriculas
     FROM CURSOS c
     LEFT JOIN ASIGNACIONES a ON a.id_curso = c.id_curso AND a.id_profesor = :profesor
     ORDER BY c.nombre`,
    { profesor },
  );
  return NextResponse.json(r.rows);
});

// PUT { cursos: [101, 102, ...] } → deja exactamente esas materias asignadas, en una sola transacción
export const PUT = ruta(async (req, ctx: Ctx) => {
  const s = sesionDe(req);
  const profesor = idNumerico((await ctx.params).profesor);
  const cuerpo = await leerJson(req);
  if (!Array.isArray(cuerpo.cursos)) throw new ErrorHttp(400, "Envía la lista de materias.");
  const deseadas = new Set(cuerpo.cursos.map((c: unknown) => idNumerico(String(c))));

  const cambios = await enTransaccion(s, async (conn) => {
    const r = await conn.execute<[number]>(
      "SELECT id_curso FROM ASIGNACIONES WHERE id_profesor = :profesor",
      { profesor },
      { outFormat: oracledb.OUT_FORMAT_ARRAY },
    );
    const actuales = new Set((r.rows ?? []).map((f) => f[0]));
    const agregar = [...deseadas].filter((c) => !actuales.has(c));
    const quitar = [...actuales].filter((c) => !deseadas.has(c));
    for (const id_curso of quitar) {
      await conn.execute("DELETE FROM ASIGNACIONES WHERE id_curso = :id_curso AND id_profesor = :profesor", { id_curso, profesor });
    }
    for (const id_curso of agregar) {
      await conn.execute("INSERT INTO ASIGNACIONES (id_curso, id_profesor) VALUES (:id_curso, :profesor)", { id_curso, profesor });
    }
    return { agregadas: agregar.length, quitadas: quitar.length };
  });
  return NextResponse.json({ ok: true, ...cambios });
});
