// Tablas del taller (lista blanca de columnas) y los reportes obligatorios.
import fs from "node:fs";
import path from "node:path";
import { ErrorHttp } from "./oracle";

type Tipo = "number" | "text";
export type Definicion = {
  tabla: string;
  pk: string;
  columnas: Record<string, Tipo>;
  select: string;
  filtro: string;
  orden: Record<string, string>;
};

export const TABLAS: Record<string, Definicion> = {
  profesores: {
    tabla: "PROFESORES",
    pk: "ID_PROFESOR",
    columnas: { ID_PROFESOR: "number", NOMBRE: "text", DEPARTAMENTO: "text" },
    select: "SELECT t.id_profesor, t.nombre, t.departamento FROM PROFESORES t",
    filtro: "UPPER(t.nombre || ' ' || t.departamento || ' ' || t.id_profesor)",
    orden: { ID_PROFESOR: "t.id_profesor", NOMBRE: "t.nombre", DEPARTAMENTO: "t.departamento" },
  },
  cursos: {
    tabla: "CURSOS",
    pk: "ID_CURSO",
    columnas: { ID_CURSO: "number", NOMBRE: "text", CREDITOS: "number" },
    select: "SELECT t.id_curso, t.nombre, t.creditos FROM CURSOS t",
    filtro: "UPPER(t.nombre || ' ' || t.id_curso)",
    orden: { ID_CURSO: "t.id_curso", NOMBRE: "t.nombre", CREDITOS: "t.creditos" },
  },
  estudiantes: {
    tabla: "ESTUDIANTES",
    pk: "ID_ESTUDIANTE",
    columnas: { ID_ESTUDIANTE: "number", NOMBRE: "text", PROGRAMA: "text", CORREO: "text" },
    select: "SELECT t.id_estudiante, t.nombre, t.programa, t.correo FROM ESTUDIANTES t",
    filtro: "UPPER(t.nombre || ' ' || t.programa || ' ' || t.correo || ' ' || t.id_estudiante)",
    orden: { ID_ESTUDIANTE: "t.id_estudiante", NOMBRE: "t.nombre", PROGRAMA: "t.programa", CORREO: "t.correo" },
  },
  matriculas: {
    tabla: "MATRICULAS",
    pk: "ID_MATRICULA",
    columnas: {
      ID_MATRICULA: "number",
      ID_CURSO: "number",
      ID_PROFESOR: "number",
      ID_ESTUDIANTE: "number",
      SEMESTRE: "text",
    },
    select: `SELECT t.id_matricula, t.id_estudiante, e.nombre AS estudiante, t.id_curso, c.nombre AS curso,
                    t.id_profesor, p.nombre AS profesor, t.semestre
             FROM MATRICULAS t
             LEFT JOIN ESTUDIANTES e ON e.id_estudiante = t.id_estudiante
             LEFT JOIN CURSOS c ON c.id_curso = t.id_curso
             LEFT JOIN PROFESORES p ON p.id_profesor = t.id_profesor`,
    filtro:
      "UPPER(e.nombre || ' ' || c.nombre || ' ' || p.nombre || ' ' || t.id_matricula || ' ' || t.id_estudiante || ' ' || t.semestre)",
    orden: {
      ID_MATRICULA: "t.id_matricula",
      ESTUDIANTE: "e.nombre",
      CURSO: "c.nombre",
      PROFESOR: "p.nombre",
      SEMESTRE: "t.semestre",
    },
  },
};

export function definicion(nombre: string): Definicion {
  const d = Object.hasOwn(TABLAS, nombre) ? TABLAS[nombre] : undefined;
  if (!d) throw new ErrorHttp(404, "Tabla no encontrada.");
  return d;
}

export function valoresDelFormulario(def: Definicion, cuerpo: Record<string, unknown>, columnas: string[]) {
  const binds: Record<string, string | number | null> = {};
  for (const col of columnas) {
    const crudo = cuerpo[col];
    if (crudo === undefined || crudo === null || String(crudo).trim() === "") {
      binds[col] = null;
      continue;
    }
    if (def.columnas[col] === "number") {
      const n = Number(crudo);
      if (!Number.isFinite(n)) throw new ErrorHttp(400, `${col} debe ser un número.`);
      binds[col] = n;
    } else {
      binds[col] = String(crudo).trim();
    }
  }
  return binds;
}

export function idNumerico(valor: string) {
  const n = Number(valor);
  if (!Number.isFinite(n)) throw new ErrorHttp(400, "Código no válido.");
  return n;
}

// Los reportes se leen del mismo archivo SQL que se entrega en el proyecto.
export type Reporte = { id: string; enunciado: string; sql: string };

export function reportes(): Reporte[] {
  const archivo = path.join(process.cwd(), "..", "sql", "07_consultas.sql");
  const texto = fs.readFileSync(archivo, "utf8");
  return texto
    .split(/^-- @reporte /m)
    .slice(1)
    .map((b) => {
      const salto = b.indexOf("\n");
      const [id, enunciado] = b.slice(0, salto).split("|").map((x) => x.trim());
      return { id, enunciado, sql: b.slice(salto + 1).trim().replace(/;\s*$/, "") };
    });
}
