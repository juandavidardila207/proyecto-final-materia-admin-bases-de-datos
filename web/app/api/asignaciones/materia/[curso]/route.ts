// Profesores que dictan una materia (tabla ASIGNACIONES, vista desde la materia).
import oracledb from "oracledb";
import { NextResponse } from "next/server";
import { ErrorHttp, ejecutar, enTransaccion, leerJson, ruta, sesionDe } from "@/lib/servidor/oracle";
import { idNumerico } from "@/lib/servidor/datos";

type Ctx = RouteContext<"/api/asignaciones/materia/[curso]">;

// GET → todos los profesores, marcando los asignados y cuántas matrículas tiene cada uno en esta materia
export const GET = ruta(async (req, ctx: Ctx) => {
  const s = sesionDe(req);
  const curso = idNumerico((await ctx.params).curso);
  const r = await ejecutar(
    s,
    `SELECT p.id_profesor, p.nombre, p.departamento,
            CASE WHEN a.id_profesor IS NULL THEN 0 ELSE 1 END AS asignada,
            (SELECT COUNT(*) FROM MATRICULAS m WHERE m.id_curso = :curso AND m.id_profesor = p.id_profesor) AS matriculas
     FROM PROFESORES p
     LEFT JOIN ASIGNACIONES a ON a.id_profesor = p.id_profesor AND a.id_curso = :curso
     ORDER BY p.nombre`,
    { curso },
  );
  return NextResponse.json(r.rows);
});

// PUT { profesores: [1, 11, ...] } → deja exactamente esos profesores asignados, en una sola transacción
export const PUT = ruta(async (req, ctx: Ctx) => {
  const s = sesionDe(req);
  const curso = idNumerico((await ctx.params).curso);
  const cuerpo = await leerJson(req);
  if (!Array.isArray(cuerpo.profesores)) throw new ErrorHttp(400, "Envía la lista de profesores.");
  const deseados = new Set(cuerpo.profesores.map((p: unknown) => idNumerico(String(p))));

  const cambios = await enTransaccion(s, async (conn) => {
    const r = await conn.execute<[number]>(
      "SELECT id_profesor FROM ASIGNACIONES WHERE id_curso = :curso",
      { curso },
      { outFormat: oracledb.OUT_FORMAT_ARRAY },
    );
    const actuales = new Set((r.rows ?? []).map((f) => f[0]));
    const agregar = [...deseados].filter((p) => !actuales.has(p));
    const quitar = [...actuales].filter((p) => !deseados.has(p));
    for (const id_profesor of quitar) {
      await conn.execute("DELETE FROM ASIGNACIONES WHERE id_curso = :curso AND id_profesor = :id_profesor", { curso, id_profesor });
    }
    for (const id_profesor of agregar) {
      await conn.execute("INSERT INTO ASIGNACIONES (id_curso, id_profesor) VALUES (:curso, :id_profesor)", { curso, id_profesor });
    }
    return { agregados: agregar.length, quitados: quitar.length };
  });
  return NextResponse.json({ ok: true, ...cambios });
});
