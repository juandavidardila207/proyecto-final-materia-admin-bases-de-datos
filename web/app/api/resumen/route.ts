import { NextResponse } from "next/server";
import { ejecutar, ruta, sesionDe } from "@/lib/servidor/oracle";

export const GET = ruta(async (req) => {
  const s = sesionDe(req);
  const [totales, departamentos] = await Promise.all([
    ejecutar(s, `
      SELECT (SELECT COUNT(*) FROM PROFESORES) AS profesores,
             (SELECT COUNT(*) FROM CURSOS) AS cursos,
             (SELECT COUNT(*) FROM MATRICULAS) AS matriculas,
             (SELECT COUNT(*) FROM ESTUDIANTES) AS estudiantes,
             (SELECT COUNT(DISTINCT departamento) FROM PROFESORES) AS departamentos
      FROM dual`),
    ejecutar(s, `
      SELECT p.departamento, COUNT(DISTINCT p.id_profesor) AS profesores, COUNT(*) AS matriculas
      FROM MATRICULAS m JOIN PROFESORES p ON p.id_profesor = m.id_profesor
      GROUP BY p.departamento ORDER BY matriculas DESC, p.departamento FETCH FIRST 5 ROWS ONLY`),
  ]);
  return NextResponse.json({ totales: totales.rows?.[0], departamentosTop: departamentos.rows });
});
