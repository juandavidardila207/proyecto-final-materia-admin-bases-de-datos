"use client";

// Tabla ASIGNACIONES en los dos sentidos: qué materias dicta un profesor y qué profesores dictan una materia.
// La lista se usa en un diálogo propio (botones «Materias» / «Profesores») y dentro del diálogo de edición.
import { useEffect, useMemo, useState, type RefObject } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Cargando } from "@/components/comunes";
import { useDatos, usePermiso } from "@/components/sesion";
import { api, mensajeDe } from "@/lib/cliente";
import { cn } from "@/lib/utils";

type Opcion = { id: number; nombre: string; detalle: string; asignada: boolean; matriculas: number };

/** Qué se asigna y cómo se guarda. */
export type ConfigAsignacion = {
  titulo: string;
  ruta: string;
  campoLista: "cursos" | "profesores";
  convertir: (fila: Record<string, unknown>) => Opcion;
  buscarPlaceholder: string;
};

const sinTildes = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

const materiaComoOpcion = (f: Record<string, unknown>): Opcion => ({
  id: Number(f.ID_CURSO),
  nombre: String(f.NOMBRE),
  detalle: `${f.CREDITOS} ${f.CREDITOS === 1 ? "crédito" : "créditos"}`,
  asignada: f.ASIGNADA === 1,
  matriculas: Number(f.MATRICULAS),
});

const profesorComoOpcion = (f: Record<string, unknown>): Opcion => ({
  id: Number(f.ID_PROFESOR),
  nombre: String(f.NOMBRE),
  detalle: f.DEPARTAMENTO ? String(f.DEPARTAMENTO) : "Sin departamento",
  asignada: f.ASIGNADA === 1,
  matriculas: Number(f.MATRICULAS),
});

export const materiasDeProfesor = (p: { ID_PROFESOR: number }): ConfigAsignacion => ({
  titulo: "Materias que dicta",
  ruta: `/asignaciones/${p.ID_PROFESOR}`,
  campoLista: "cursos",
  convertir: materiaComoOpcion,
  buscarPlaceholder: "Buscar materia…",
});

export const profesoresDeMateria = (m: { ID_CURSO: number }): ConfigAsignacion => ({
  titulo: "Profesores que la dictan",
  ruta: `/asignaciones/materia/${m.ID_CURSO}`,
  campoLista: "profesores",
  convertir: profesorComoOpcion,
  buscarPlaceholder: "Buscar profesor…",
});

// Estado de la lista: lo que hay en Oracle, lo marcado ahora y cómo guardarlo.
function useAsignacion(config: ConfigAsignacion) {
  const { datos: crudos, error } = useDatos<Record<string, unknown>[]>(config.ruta);
  const { convertir } = config;
  const opciones = useMemo(() => crudos?.map(convertir), [crudos, convertir]);
  const [elegidas, setElegidas] = useState<Set<number> | null>(null);
  const iniciales = useMemo(() => new Set((opciones ?? []).filter((o) => o.asignada).map((o) => o.id)), [opciones]);
  const seleccion = elegidas ?? iniciales;
  const agregadas = [...seleccion].filter((x) => !iniciales.has(x)).length;
  const quitadas = [...iniciales].filter((x) => !seleccion.has(x)).length;

  function alternar(o: Opcion, marcada: boolean) {
    const nueva = new Set(seleccion);
    if (marcada) nueva.add(o.id);
    else nueva.delete(o.id);
    setElegidas(nueva);
  }

  async function guardar() {
    if (!agregadas && !quitadas) return false;
    await api(config.ruta, { metodo: "PUT", cuerpo: { [config.campoLista]: [...seleccion] } });
    return true;
  }

  return { opciones, error, seleccion, agregadas, quitadas, alternar, guardar };
}

function ListaAsignacion({
  config,
  estado,
  alto,
}: {
  config: ConfigAsignacion;
  estado: ReturnType<typeof useAsignacion>;
  alto: string;
}) {
  const puedeEscribir = usePermiso("escribir");
  const [busqueda, setBusqueda] = useState("");
  const q = sinTildes(busqueda.trim());
  const visibles = (estado.opciones ?? []).filter((o) => !q || sinTildes(`${o.id} ${o.nombre} ${o.detalle}`).includes(q));

  return (
    <div className="grid min-h-0 gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          className="pl-8"
          placeholder={config.buscarPlaceholder}
          aria-label={config.buscarPlaceholder}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      {estado.error && (
        <Alert variant="destructive" role="alert">
          <AlertCircle aria-hidden />
          <AlertDescription>{estado.error}</AlertDescription>
        </Alert>
      )}
      {!estado.opciones && !estado.error && <Cargando filas={4} />}
      {estado.opciones && (
        <ul className={cn("-mx-1 divide-y overflow-y-auto border-y", alto)} aria-label={config.titulo}>
          {visibles.map((o) => {
            const marcada = estado.seleccion.has(o.id);
            const bloqueada = o.asignada && o.matriculas > 0;
            const id = `asig-${config.campoLista}-${o.id}`;
            return (
              <li key={o.id} className="flex items-start gap-3 px-1 py-2">
                <Checkbox
                  id={id}
                  checked={marcada}
                  disabled={!puedeEscribir || (bloqueada && marcada)}
                  onCheckedChange={(v) => estado.alternar(o, v === true)}
                  className="mt-0.5"
                />
                <label htmlFor={id} className="grid flex-1 cursor-pointer gap-0.5 text-sm">
                  <span>
                    {o.nombre} <span className="text-muted-foreground tabular-nums">· {o.id}</span>
                    <span className="sr-only">, </span>
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {o.detalle}
                    {bloqueada && ` · ${o.matriculas} ${o.matriculas === 1 ? "matrícula" : "matrículas"}, no se puede quitar`}
                  </span>
                </label>
              </li>
            );
          })}
          {!visibles.length && <li className="py-6 text-center text-sm text-muted-foreground">Nada coincide con la búsqueda.</li>}
        </ul>
      )}
      <p className="text-xs text-muted-foreground" aria-live="polite">
        {estado.seleccion.size} seleccionados
        {(estado.agregadas > 0 || estado.quitadas > 0) && ` · +${estado.agregadas} / −${estado.quitadas} sin guardar`}
      </p>
    </div>
  );
}

/**
 * Sección para meter dentro de otro formulario (el diálogo de edición).
 * Registra en `guardarRef` la función que guarda las asignaciones; el formulario la llama al pulsar Guardar.
 */
export function SeccionAsignacion({
  config,
  guardarRef,
}: {
  config: ConfigAsignacion;
  guardarRef: RefObject<(() => Promise<boolean>) | null>;
}) {
  const estado = useAsignacion(config);
  useEffect(() => {
    guardarRef.current = estado.guardar;
  });
  return (
    <div className="grid gap-2">
      <Label>{config.titulo}</Label>
      <ListaAsignacion config={config} estado={estado} alto="max-h-56" />
    </div>
  );
}

// Diálogo independiente (botones «Materias» en Profesores y «Profesores» en Materias).
function DialogoAsignacion({
  config,
  titulo,
  descripcion,
  avisoGuardado,
  alCerrar,
  alGuardar,
}: {
  config: ConfigAsignacion;
  titulo: string;
  descripcion: string;
  avisoGuardado: (total: number) => string;
  alCerrar: () => void;
  alGuardar: () => void;
}) {
  const puedeEscribir = usePermiso("escribir");
  const estado = useAsignacion(config);
  const [error, setError] = useState<string>();
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    setGuardando(true);
    setError(undefined);
    try {
      await estado.guardar();
      toast.success(avisoGuardado(estado.seleccion.size));
      alGuardar();
      alCerrar();
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && alCerrar()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        <ListaAsignacion config={config} estado={estado} alto="max-h-[50vh]" />
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertCircle aria-hidden />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={alCerrar}>
            {puedeEscribir ? "Cancelar" : "Cerrar"}
          </Button>
          {puedeEscribir && (
            <Button onClick={guardar} disabled={guardando || (!estado.agregadas && !estado.quitadas)}>
              {guardando && <Loader2 className="animate-spin" aria-hidden />}
              Guardar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Cierre = { alCerrar: () => void; alGuardar: () => void };

export function AsignarMaterias({ profesor, ...resto }: { profesor: { ID_PROFESOR: number; NOMBRE: string } } & Cierre) {
  return (
    <DialogoAsignacion
      config={materiasDeProfesor(profesor)}
      titulo={`Materias de ${profesor.NOMBRE}`}
      descripcion="Marca las materias que dicta. Al matricular, solo aparecerá como profesor de esas materias."
      avisoGuardado={(n) => `Materias de ${profesor.NOMBRE} actualizadas: ${n} en total.`}
      {...resto}
    />
  );
}

export function AsignarProfesores({ materia, ...resto }: { materia: { ID_CURSO: number; NOMBRE: string } } & Cierre) {
  return (
    <DialogoAsignacion
      config={profesoresDeMateria(materia)}
      titulo={`Profesores de ${materia.NOMBRE}`}
      descripcion="Marca los profesores que dictan esta materia. Al matricular, solo ellos aparecerán como opción."
      avisoGuardado={(n) => `Profesores de ${materia.NOMBRE} actualizados: ${n} en total.`}
      {...resto}
    />
  );
}
