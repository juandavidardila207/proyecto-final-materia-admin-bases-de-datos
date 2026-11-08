import { NextResponse } from "next/server";
import { ejecutar, ruta, sesionDe } from "@/lib/servidor/oracle";

export const GET = ruta(async (req) => {
  const s = sesionDe(req);
  const [cursos, profesores] = await Promise.all([
    ejecutar(s, "SELECT id_curso AS id, nombre FROM CURSOS ORDER BY nombre"),
    ejecutar(s, "SELECT id_profesor AS id, nombre FROM PROFESORES ORDER BY nombre"),
  ]);
  return NextResponse.json({ cursos: cursos.rows, profesores: profesores.rows });
});
