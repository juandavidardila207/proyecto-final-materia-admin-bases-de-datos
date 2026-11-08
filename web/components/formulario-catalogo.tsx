"use client";

// Pantalla de formulario + lista para una tabla del catálogo (materias o profesores).
import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CajaError, Cargando, Encabezado, TablaDatos, type Columna } from "@/components/comunes";
import { DialogoConfirmar, DialogoFormulario } from "@/components/dialogos";
import { SeccionAsignacion, type ConfigAsignacion } from "@/components/asignaciones";
import { useDatos, usePermiso } from "@/components/sesion";
import { api, mensajeDe } from "@/lib/cliente";
import type { Catalogo } from "@/lib/catalogo";

export type CampoCatalogo = {
  nombre: string;
  etiqueta: string;
  ayuda?: string;
  opciones?: string[];
  sugerencias?: (c: Catalogo) => string[];
  opcional?: boolean;
  max?: number;
  tipo?: "text" | "email";
};

type Fila = Record<string, unknown>;

export function FormularioCatalogo<T extends Fila>({
  titulo,
  descripcion,
  singular,
  tabla,
  pk,
  campos,
  filas,
  columnas,
  textoBusqueda,
  aviso,
  accionFila,
  asignacionEnEdicion,
}: {
  titulo: string;
  descripcion: string;
  singular: string;
  tabla: "cursos" | "profesores" | "estudiantes";
  pk: string;
  campos: CampoCatalogo[];
  filas: (c: Catalogo) => T[];
  columnas: Columna<T>[];
  textoBusqueda: (f: T) => string;
  aviso?: ReactNode;
  /** Botón extra por fila (p. ej. «Materias» en profesores); recibe la fila y una función para recargar la lista. */
  accionFila?: (fila: T, recargar: () => void) => ReactNode;
  /** Lista de asignaciones (profesores de la materia, materias del profesor) dentro del diálogo de edición. */
  asignacionEnEdicion?: (fila: T) => ConfigAsignacion;
}) {
  const puedeEscribir = usePermiso("escribir");
  const catalogo = useDatos<Catalogo>("/catalogo");
  const siguiente = useDatos<{ id: number }>(`/tablas/${tabla}/siguiente-id`);
  const vacio = () => Object.fromEntries(campos.map((c) => [c.nombre, ""]));
  const [valores, setValores] = useState<Record<string, string>>(vacio);
  const [codigo, setCodigo] = useState<string>();
  const [error, setError] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState<T | null>(null);
  const [edicion, setEdicion] = useState<Record<string, string>>({});
  const [eliminando, setEliminando] = useState<T | null>(null);
  const guardarAsignacion = useRef<(() => Promise<boolean>) | null>(null);

  const codigoMostrado = codigo ?? (siguiente.datos ? String(siguiente.datos.id) : "");
  const todo = catalogo.datos ? filas(catalogo.datos) : [];
  const q = busqueda.trim().toLowerCase();
  const visibles = q ? todo.filter((f) => textoBusqueda(f).toLowerCase().includes(q)) : todo;

  function recargar() {
    catalogo.recargar();
    siguiente.recargar();
  }

  async function crear(ev: FormEvent) {
    ev.preventDefault();
    setEnviando(true);
    setError(undefined);
    try {
      await api(`/tablas/${tabla}`, { metodo: "POST", cuerpo: { ...valores, [pk]: codigoMostrado } });
      toast.success(`«${valores.NOMBRE}» quedó registrado con el código ${codigoMostrado}.`);
      setValores(vacio());
      setCodigo(undefined);
      recargar();
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setEnviando(false);
    }
  }

  function control(c: CampoCatalogo, id: string, valor: string, cambiar: (v: string) => void) {
    if (c.opciones) {
      return (
        <Select value={valor} onValueChange={cambiar} required disabled={!puedeEscribir}>
          <SelectTrigger id={id} className="w-full">
            <SelectValue placeholder="Elige…" />
          </SelectTrigger>
          <SelectContent>
            {c.opciones.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    const lista = c.sugerencias && catalogo.datos ? c.sugerencias(catalogo.datos) : null;
    return (
      <>
        <Input
          id={id}
          type={c.tipo ?? "text"}
          value={valor}
          onChange={(e) => cambiar(e.target.value)}
          required={!c.opcional}
          maxLength={c.max}
          list={lista ? `${id}-lista` : undefined}
          autoComplete="off"
          disabled={!puedeEscribir}
          aria-describedby={c.ayuda ? `${id}-ayuda` : undefined}
        />
        {lista && (
          <datalist id={`${id}-lista`}>
            {lista.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </>
    );
  }

  const columnasConAcciones: Columna<T>[] = puedeEscribir
    ? [
        ...columnas,
        {
          titulo: <span className="sr-only">Acciones</span>,
          className: "text-right",
          celda: (f) => (
            <div className="flex items-center justify-end gap-1">
              {accionFila?.(f, recargar)}
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Editar ${String(f.NOMBRE)}`}
                onClick={() => {
                  setEdicion(Object.fromEntries(campos.map((c) => [c.nombre, String(f[c.nombre] ?? "")])));
                  setEditando(f);
                }}
              >
                <Pencil aria-hidden />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label={`Eliminar ${String(f.NOMBRE)}`} onClick={() => setEliminando(f)}>
                <Trash2 aria-hidden />
              </Button>
            </div>
          ),
        },
      ]
    : accionFila
      ? [...columnas, { titulo: <span className="sr-only">Acciones</span>, className: "text-right", celda: (f) => accionFila(f, recargar) }]
      : columnas;

  return (
    <>
      <Encabezado titulo={titulo} descripcion={descripcion} />
      {catalogo.error && <CajaError mensaje={catalogo.error} />}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
        <Card className="lg:sticky lg:top-8">
          <CardHeader>
            <CardTitle>Nuevo {singular}</CardTitle>
            <CardDescription>El código se propone solo; puedes cambiarlo.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={crear} className="grid gap-4">
              {!puedeEscribir && (
                <Alert>
                  <AlertCircle aria-hidden />
                  <AlertDescription>Tu rol es de solo lectura.</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-2">
                <Label htmlFor={`${tabla}-codigo`}>Código</Label>
                <Input
                  id={`${tabla}-codigo`}
                  type="number"
                  required
                  value={codigoMostrado}
                  onChange={(e) => setCodigo(e.target.value)}
                  disabled={!puedeEscribir}
                />
              </div>
              {campos.map((c) => {
                const id = `${tabla}-${c.nombre}`;
                return (
                  <div key={c.nombre} className="grid gap-2">
                    <Label htmlFor={id}>
                      {c.etiqueta}
                      {c.opcional && <span className="font-normal text-muted-foreground">(opcional)</span>}
                    </Label>
                    {control(c, id, valores[c.nombre], (v) => setValores((x) => ({ ...x, [c.nombre]: v })))}
                    {c.ayuda && (
                      <p id={`${id}-ayuda`} className="text-xs text-muted-foreground">
                        {c.ayuda}
                      </p>
                    )}
                  </div>
                );
              })}
              {error && (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={!puedeEscribir || enviando}>
                {enviando ? <Loader2 className="animate-spin" aria-hidden /> : <Plus aria-hidden />}
                Crear {singular}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Listado de {titulo.toLowerCase()}{" "}
              {catalogo.datos && <span className="font-normal text-muted-foreground">({todo.length})</span>}
            </CardTitle>
            {aviso && <CardDescription>{aviso}</CardDescription>}
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type="search"
                className="pl-8"
                aria-label={`Buscar ${titulo.toLowerCase()}`}
                placeholder={`Buscar ${titulo.toLowerCase()}…`}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            {!catalogo.datos && catalogo.cargando && <Cargando filas={8} />}
            {catalogo.datos && (
              <TablaDatos
                alto
                filas={visibles}
                clave={(f) => String(f[pk])}
                columnas={columnasConAcciones}
                vacio={q ? "Nada coincide con la búsqueda." : "Sin registros."}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {editando && (
        <DialogoFormulario
          abierto
          alCambiar={(v) => !v && setEditando(null)}
          titulo={`Editar ${singular} ${String(editando[pk])}`}
          alEnviar={async () => {
            await api(`/tablas/${tabla}/${String(editando[pk])}`, { metodo: "PUT", cuerpo: edicion });
            try {
              await guardarAsignacion.current?.();
            } catch (e) {
              recargar();
              throw new Error(`Se guardaron los datos, pero no las asignaciones: ${mensajeDe(e)}`);
            }
            toast.success("Cambios guardados.");
            recargar();
          }}
        >
          {campos.map((c) => {
            const id = `editar-${tabla}-${c.nombre}`;
            return (
              <div key={c.nombre} className="grid gap-2">
                <Label htmlFor={id}>{c.etiqueta}</Label>
                {control(c, id, edicion[c.nombre] ?? "", (v) => setEdicion((x) => ({ ...x, [c.nombre]: v })))}
              </div>
            );
          })}
          {asignacionEnEdicion && (
            <SeccionAsignacion config={asignacionEnEdicion(editando)} guardarRef={guardarAsignacion} />
          )}
        </DialogoFormulario>
      )}

      <DialogoConfirmar
        abierto={!!eliminando}
        alCambiar={(v) => !v && setEliminando(null)}
        titulo={`¿Eliminar ${singular} ${String(eliminando?.[pk] ?? "")}?`}
        descripcion={`«${String(eliminando?.NOMBRE ?? "")}». Si tiene matrículas, Oracle no lo permitirá.`}
        confirmar="Eliminar"
        alConfirmar={async () => {
          await api(`/tablas/${tabla}/${String(eliminando?.[pk])}`, { metodo: "DELETE" });
          toast.success("Registro eliminado.");
          recargar();
        }}
      />
    </>
  );
}
