"use client";

export type Curso = { ID_CURSO: number; NOMBRE: string; CREDITOS: number; ESTUDIANTES: number; PROFESORES: number };
export type Profesor = { ID_PROFESOR: number; NOMBRE: string; DEPARTAMENTO: string | null; MATERIAS: number; ESTUDIANTES: number };
export type Estudiante = {
  ID_ESTUDIANTE: number;
  NOMBRE: string;
  PROGRAMA: string | null;
  CORREO: string;
  MATERIAS: number;
  CREDITOS: number;
};
export type Catalogo = {
  cursos: Curso[];
  profesores: Profesor[];
  estudiantes: Estudiante[];
  asignaciones: { ID_CURSO: number; ID_PROFESOR: number }[];
  departamentos: string[];
  programas: string[];
  semestres: string[];
};

// Semestres ofrecidos en el formulario: los que ya existen más el año actual y el siguiente.
export function semestresDisponibles(existentes: string[]) {
  const año = new Date().getFullYear();
  const propuestos = [año, año + 1].flatMap((a) => [`${a}-1`, `${a}-2`]);
  return [...new Set([...existentes, ...propuestos])].sort().reverse();
}
