"use client";

import Link from "next/link";
import { CajaError, Cargando, Encabezado, TablaDatos } from "@/components/comunes";
import { useDatos, usePermiso } from "@/components/sesion";
import { cn } from "@/lib/utils";

type Resumen = {
  totales: Record<"PROFESORES" | "CURSOS" | "MATRICULAS" | "ESTUDIANTES" | "DEPARTAMENTOS", number>;
  departamentosTop: { DEPARTAMENTO: string; PROFESORES: number; MATRICULAS: number }[];
};

const ACCESOS = [
  { ruta: "/matricular", titulo: "Matricular materias", texto: "Busca al estudiante y agrégale materias del semestre." },
  { ruta: "/estudiantes", titulo: "Registrar estudiante", texto: "Nombre, programa y correo institucional." },
  { ruta: "/materias", titulo: "Crear materia", texto: "Código, nombre y créditos (1 a 5)." },
  { ruta: "/profesores", titulo: "Registrar profesor", texto: "Nombre y departamento." },
];

export default function Inicio() {
  const { datos, error, cargando } = useDatos<Resumen>("/resumen");
  const puedeEscribir = usePermiso("escribir");
  const t = datos?.totales;

  return (
    <>
      <Encabezado
        titulo="Resumen"
        descripcion="Estado actual de la base de datos del Caso 4: cursos, profesores, estudiantes y matrículas."
      />
      {error && <CajaError mensaje={error} />}
      {cargando && !datos && <Cargando filas={3} />}
      {t && (
        <dl className="grid grid-cols-2 border-y sm:grid-cols-5">
          {[
            ["Matrículas", t.MATRICULAS],
            ["Estudiantes", t.ESTUDIANTES],
            ["Materias", t.CURSOS],
            ["Profesores", t.PROFESORES],
            ["Departamentos", t.DEPARTAMENTOS],
          ].map(([etiqueta, valor], i) => (
            <div
              key={etiqueta}
              className={cn("py-4 pr-5", i > 0 && "sm:border-l sm:pl-5", i >= 2 && "border-t sm:border-t-0")}
            >
              <dt className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{etiqueta}</dt>
              <dd className="mt-1 font-heading text-4xl font-semibold tabular-nums">{valor}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="grid gap-10 pt-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-labelledby="titulo-accesos" className="grid content-start gap-3">
          <h2 id="titulo-accesos" className="text-xl font-semibold">
            {puedeEscribir ? "Trámites frecuentes" : "Secciones"}
          </h2>
          <ul className="divide-y border-y">
            {ACCESOS.map((a) => (
              <li key={a.ruta}>
                <Link
                  href={a.ruta}
                  className="group flex items-baseline justify-between gap-4 py-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span>
                    <span className="font-medium group-hover:text-primary group-hover:underline group-hover:underline-offset-4">
                      {a.titulo}
                    </span>
                    <span className="block text-sm text-muted-foreground">{a.texto}</span>
                  </span>
                  <span aria-hidden className="text-muted-foreground group-hover:text-primary">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {datos && (
          <section aria-labelledby="titulo-departamentos" className="grid content-start gap-3">
            <h2 id="titulo-departamentos" className="text-xl font-semibold">
              Departamentos con más matrículas
            </h2>
            <TablaDatos
              filas={datos.departamentosTop}
              clave={(f) => f.DEPARTAMENTO}
              columnas={[
                { titulo: "Departamento", celda: (f) => f.DEPARTAMENTO },
                { titulo: "Profesores", celda: (f) => f.PROFESORES, num: true },
                { titulo: "Matrículas", celda: (f) => f.MATRICULAS, num: true },
              ]}
            />
          </section>
        )}
      </div>
    </>
  );
}
