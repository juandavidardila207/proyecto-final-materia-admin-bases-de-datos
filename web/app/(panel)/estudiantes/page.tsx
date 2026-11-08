"use client";

import Link from "next/link";
import { FormularioCatalogo } from "@/components/formulario-catalogo";
import type { Estudiante } from "@/lib/catalogo";

export default function Estudiantes() {
  return (
    <FormularioCatalogo<Estudiante>
      titulo="Estudiantes"
      descripcion="Registra estudiantes nuevos. Solo los estudiantes registrados se pueden matricular."
      singular="estudiante"
      tabla="estudiantes"
      pk="ID_ESTUDIANTE"
      campos={[
        { nombre: "NOMBRE", etiqueta: "Nombre completo", max: 100 },
        {
          nombre: "PROGRAMA",
          etiqueta: "Programa académico",
          max: 100,
          opcional: true,
          sugerencias: (c) => c.programas,
          ayuda: "Escribe uno nuevo o elige uno de la lista.",
        },
        {
          nombre: "CORREO",
          etiqueta: "Correo institucional",
          max: 120,
          tipo: "email",
          ayuda: "No puede repetirse entre estudiantes.",
        },
      ]}
      filas={(c) => c.estudiantes}
      textoBusqueda={(f) => `${f.ID_ESTUDIANTE} ${f.NOMBRE} ${f.PROGRAMA ?? ""} ${f.CORREO}`}
      aviso="Un estudiante con matrículas no se puede eliminar: lo impide la llave foránea FK_MAT_ESTUDIANTE."
      columnas={[
        { titulo: "Código", celda: (f) => f.ID_ESTUDIANTE, num: true },
        {
          titulo: "Estudiante",
          className: "whitespace-normal",
          celda: (f) => (
            <div className="grid">
              <span>{f.NOMBRE}</span>
              <span className="text-xs text-muted-foreground">{f.CORREO}</span>
            </div>
          ),
        },
        { titulo: "Programa", celda: (f) => f.PROGRAMA ?? "—", className: "whitespace-normal" },
        { titulo: "Materias", celda: (f) => f.MATERIAS, num: true },
        { titulo: "Créditos", celda: (f) => f.CREDITOS, num: true },
        {
          titulo: <span className="sr-only">Matricular</span>,
          celda: (f) => (
            <Link
              href={`/matricular?estudiante=${f.ID_ESTUDIANTE}`}
              className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              aria-label={`Matricular a ${f.NOMBRE}`}
            >
              Matricular
            </Link>
          ),
        },
      ]}
    />
  );
}
