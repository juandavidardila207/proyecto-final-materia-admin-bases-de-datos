// Datos para los formularios: materias, profesores, quién dicta qué (ASIGNACIONES) y semestres usados.
import { NextResponse } from "next/server";
import { ejecutar, ruta, sesionDe } from "@/lib/servidor/oracle";

export const GET = ruta(async (req) => {
  const s = sesionDe(req);
  const [cursos, profesores, asignaciones, departamentos, semestres, estudiantes, programas] = await Promise.all([
    ejecutar(
      s,
      `SELECT c.id_curso, c.nombre, c.creditos,
              (SELECT COUNT(DISTINCT m.id_estudiante) FROM MATRICULAS m WHERE m.id_curso = c.id_curso) AS estudiantes,
              (SELECT COUNT(*) FROM ASIGNACIONES a WHERE a.id_curso = c.id_curso) AS profesores
       FROM CURSOS c
       ORDER BY c.nombre`,
    ),
    ejecutar(
      s,
      `SELECT p.id_profesor, p.nombre, p.departamento,
              (SELECT COUNT(*) FROM ASIGNACIONES a WHERE a.id_profesor = p.id_profesor) AS materias,
              (SELECT COUNT(DISTINCT m.id_estudiante) FROM MATRICULAS m WHERE m.id_profesor = p.id_profesor) AS estudiantes
       FROM PROFESORES p
       ORDER BY p.nombre`,
    ),
    ejecutar(s, "SELECT id_curso, id_profesor FROM ASIGNACIONES"),
    ejecutar(s, "SELECT DISTINCT departamento FROM PROFESORES WHERE departamento IS NOT NULL ORDER BY 1"),
    ejecutar(s, "SELECT DISTINCT semestre FROM MATRICULAS ORDER BY 1 DESC"),
    ejecutar(
      s,
      `SELECT e.id_estudiante, e.nombre, e.programa, e.correo,
              COUNT(m.id_matricula) AS materias, NVL(SUM(c.creditos), 0) AS creditos
       FROM ESTUDIANTES e
       LEFT JOIN MATRICULAS m ON m.id_estudiante = e.id_estudiante
       LEFT JOIN CURSOS c ON c.id_curso = m.id_curso
       GROUP BY e.id_estudiante, e.nombre, e.programa, e.correo
       ORDER BY e.nombre`,
    ),
    ejecutar(s, "SELECT DISTINCT programa FROM ESTUDIANTES WHERE programa IS NOT NULL ORDER BY 1"),
  ]);
  return NextResponse.json({
    cursos: cursos.rows,
    profesores: profesores.rows,
    asignaciones: asignaciones.rows,
    departamentos: (departamentos.rows ?? []).map((f) => (f as { DEPARTAMENTO: string }).DEPARTAMENTO),
    semestres: (semestres.rows ?? []).map((f) => (f as { SEMESTRE: string }).SEMESTRE),
    estudiantes: estudiantes.rows,
    programas: (programas.rows ?? []).map((f) => (f as { PROGRAMA: string }).PROGRAMA),
  });
});
