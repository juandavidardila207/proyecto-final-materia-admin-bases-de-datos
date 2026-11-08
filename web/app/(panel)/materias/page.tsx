"use client";

import { useState } from "react";
import { AsignarProfesores, profesoresDeMateria } from "@/components/asignaciones";
import { FormularioCatalogo } from "@/components/formulario-catalogo";
import { Button } from "@/components/ui/button";
import { usePermiso } from "@/components/sesion";
import type { Curso } from "@/lib/catalogo";

export default function Materias() {
  const puedeEscribir = usePermiso("escribir");
  const [asignando, setAsignando] = useState<{ materia: Curso; recargar: () => void } | null>(null);

  return (
    <>
      <FormularioCatalogo<Curso>
        titulo="Materias"
        descripcion="Agrega materias y elige qué profesores dictan cada una. Solo ellos podrán aparecer al matricular."
        singular="materia"
        tabla="cursos"
        pk="ID_CURSO"
        campos={[
          { nombre: "NOMBRE", etiqueta: "Nombre de la materia", max: 100 },
          {
            nombre: "CREDITOS",
            etiqueta: "Créditos",
            opciones: ["1", "2", "3", "4", "5"],
            ayuda: "La base solo acepta de 1 a 5 créditos (restricción CHECK).",
          },
        ]}
        filas={(c) => c.cursos}
        textoBusqueda={(f) => `${f.ID_CURSO} ${f.NOMBRE}`}
        aviso="Usa «Profesores» para elegir quién dicta cada materia. Una materia con matrículas no se puede eliminar."
        columnas={[
          { titulo: "Código", celda: (f) => f.ID_CURSO, num: true },
          { titulo: "Materia", celda: (f) => f.NOMBRE, className: "whitespace-normal" },
          { titulo: "Créditos", celda: (f) => f.CREDITOS, num: true },
          { titulo: "Estudiantes", celda: (f) => f.ESTUDIANTES, num: true },
          {
            titulo: "Profesores",
            num: true,
            celda: (f) => (f.PROFESORES === 0 ? <span className="text-destructive">Ninguno</span> : f.PROFESORES),
          },
        ]}
        asignacionEnEdicion={profesoresDeMateria}
        accionFila={(f, recargar) => (
          <Button
            variant="outline"
            size="sm"
            aria-label={`${puedeEscribir ? "Elegir" : "Ver"} profesores de ${f.NOMBRE}`}
            onClick={() => setAsignando({ materia: f, recargar })}
          >
            Profesores
          </Button>
        )}
      />
      {asignando && (
        <AsignarProfesores
          materia={asignando.materia}
          alCerrar={() => setAsignando(null)}
          alGuardar={asignando.recargar}
        />
      )}
    </>
  );
}
