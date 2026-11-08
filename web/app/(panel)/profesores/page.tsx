"use client";

import { useState } from "react";
import { AsignarMaterias, materiasDeProfesor } from "@/components/asignaciones";
import { FormularioCatalogo } from "@/components/formulario-catalogo";
import { Button } from "@/components/ui/button";
import { usePermiso } from "@/components/sesion";
import type { Profesor } from "@/lib/catalogo";

export default function Profesores() {
  const puedeEscribir = usePermiso("escribir");
  const [asignando, setAsignando] = useState<{ profesor: Profesor; recargar: () => void } | null>(null);

  return (
    <>
      <FormularioCatalogo<Profesor>
        titulo="Profesores"
        descripcion="Registra profesores y elige qué materias dicta cada uno. Solo podrán aparecer como profesores de esas materias al matricular."
        singular="profesor"
        tabla="profesores"
        pk="ID_PROFESOR"
        campos={[
          { nombre: "NOMBRE", etiqueta: "Nombre completo", max: 100 },
          {
            nombre: "DEPARTAMENTO",
            etiqueta: "Departamento",
            max: 100,
            opcional: true,
            sugerencias: (c) => c.departamentos,
            ayuda: "Escribe uno nuevo o elige uno de la lista.",
          },
        ]}
        filas={(c) => c.profesores}
        textoBusqueda={(f) => `${f.ID_PROFESOR} ${f.NOMBRE} ${f.DEPARTAMENTO ?? ""}`}
        aviso="Usa «Materias» para elegir lo que dicta cada profesor. Un profesor con matrículas no se puede eliminar."
        columnas={[
          { titulo: "Código", celda: (f) => f.ID_PROFESOR, num: true },
          { titulo: "Profesor", celda: (f) => f.NOMBRE, className: "whitespace-normal" },
          { titulo: "Departamento", celda: (f) => f.DEPARTAMENTO ?? "—" },
          { titulo: "Materias", celda: (f) => f.MATERIAS, num: true },
          { titulo: "Estudiantes", celda: (f) => f.ESTUDIANTES, num: true },
        ]}
        asignacionEnEdicion={materiasDeProfesor}
        accionFila={(f, recargar) => (
          <Button
            variant="outline"
            size="sm"
            aria-label={`${puedeEscribir ? "Elegir" : "Ver"} materias de ${f.NOMBRE}`}
            onClick={() => setAsignando({ profesor: f, recargar })}
          >
            Materias
          </Button>
        )}
      />
      {asignando && (
        <AsignarMaterias
          profesor={asignando.profesor}
          alCerrar={() => setAsignando(null)}
          alGuardar={asignando.recargar}
        />
      )}
    </>
  );
}
