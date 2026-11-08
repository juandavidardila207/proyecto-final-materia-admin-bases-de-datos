"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CajaError, Cargando, Encabezado, TablaDatos, type Columna } from "@/components/comunes";
import { DialogoConfirmar, DialogoFormulario } from "@/components/dialogos";
import { useDatos, usePermiso } from "@/components/sesion";
import { api, texto, type Fila } from "@/lib/cliente";

type Campo = {
  nombre: string;
  etiqueta: string;
  tipo?: "number" | "text";
  opciones?: "cursos" | "profesores";
  max?: number;
  placeholder?: string;
};
type Entidad = {
  titulo: string;
  singular: string;
  pk: string;
  columnas: { titulo: string; campo: string; orden: string; num?: boolean }[];
  campos: Campo[];
  resumen: (f: Fila) => string;
};

const ENTIDADES: Record<string, Entidad> = {
  profesores: {
    titulo: "Profesores",
    singular: "profesor",
    pk: "ID_PROFESOR",
    columnas: [
      { titulo: "Código", campo: "ID_PROFESOR", orden: "ID_PROFESOR", num: true },
      { titulo: "Nombre", campo: "NOMBRE", orden: "NOMBRE" },
      { titulo: "Departamento", campo: "DEPARTAMENTO", orden: "DEPARTAMENTO" },
    ],
    campos: [
      { nombre: "NOMBRE", etiqueta: "Nombre", max: 100 },
      { nombre: "DEPARTAMENTO", etiqueta: "Departamento", max: 100 },
    ],
    resumen: (f) => texto(f.NOMBRE),
  },
  cursos: {
    titulo: "Cursos",
    singular: "curso",
    pk: "ID_CURSO",
    columnas: [
      { titulo: "Código", campo: "ID_CURSO", orden: "ID_CURSO", num: true },
      { titulo: "Nombre", campo: "NOMBRE", orden: "NOMBRE" },
      { titulo: "Créditos", campo: "CREDITOS", orden: "CREDITOS", num: true },
    ],
    // Sin min/max a propósito: la restricción CHECK de Oracle es la que valida los créditos.
    campos: [
      { nombre: "NOMBRE", etiqueta: "Nombre", max: 100 },
      { nombre: "CREDITOS", etiqueta: "Créditos (1 a 5)", tipo: "number" },
    ],
    resumen: (f) => texto(f.NOMBRE),
  },
  estudiantes: {
    titulo: "Estudiantes",
    singular: "estudiante",
    pk: "ID_ESTUDIANTE",
    columnas: [
      { titulo: "Código", campo: "ID_ESTUDIANTE", orden: "ID_ESTUDIANTE", num: true },
      { titulo: "Nombre", campo: "NOMBRE", orden: "NOMBRE" },
      { titulo: "Programa", campo: "PROGRAMA", orden: "PROGRAMA" },
      { titulo: "Correo", campo: "CORREO", orden: "CORREO" },
    ],
    campos: [
      { nombre: "NOMBRE", etiqueta: "Nombre", max: 100 },
      { nombre: "PROGRAMA", etiqueta: "Programa", max: 100 },
      { nombre: "CORREO", etiqueta: "Correo", max: 120 },
    ],
    resumen: (f) => texto(f.NOMBRE),
  },
  matriculas: {
    titulo: "Matrículas",
    singular: "matrícula",
    pk: "ID_MATRICULA",
    columnas: [
      { titulo: "Código", campo: "ID_MATRICULA", orden: "ID_MATRICULA", num: true },
      { titulo: "Estudiante", campo: "ESTUDIANTE", orden: "ESTUDIANTE" },
      { titulo: "Curso", campo: "CURSO", orden: "CURSO" },
      { titulo: "Profesor", campo: "PROFESOR", orden: "PROFESOR" },
      { titulo: "Semestre", campo: "SEMESTRE", orden: "SEMESTRE" },
    ],
    campos: [
      { nombre: "ID_CURSO", etiqueta: "Curso", opciones: "cursos" },
      { nombre: "ID_PROFESOR", etiqueta: "Profesor", opciones: "profesores" },
      { nombre: "ID_ESTUDIANTE", etiqueta: "Código del estudiante", tipo: "number" },
      { nombre: "SEMESTRE", etiqueta: "Semestre", max: 10, placeholder: "2026-2" },
    ],
    resumen: (f) => `${texto(f.ESTUDIANTE) || `Estudiante ${texto(f.ID_ESTUDIANTE)}`} en ${texto(f.CURSO)}`,
  },
};

type Pagina = { total: number; pagina: number; tam: number; filas: Fila[] };
type Opciones = Record<"cursos" | "profesores", { ID: number; NOMBRE: string }[]>;

export default function Datos() {
  const [tabla, setTabla] = useState("profesores");
  return (
    <>
      <Encabezado titulo="Datos" descripcion="Consulta, agrega, modifica y elimina registros de las tablas del taller." />
      <Tabs value={tabla} onValueChange={setTabla}>
        <TabsList>
          {Object.entries(ENTIDADES).map(([k, e]) => (
            <TabsTrigger key={k} value={k}>
              {e.titulo}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <TablaEntidad key={tabla} clave={tabla} />
    </>
  );
}

function TablaEntidad({ clave }: { clave: string }) {
  const ent = ENTIDADES[clave];
  const puedeEscribir = usePermiso("escribir");
  const [busqueda, setBusqueda] = useState("");
  const [q, setQ] = useState("");
  const [pagina, setPagina] = useState(1);
  const [orden, setOrden] = useState<{ campo: string; dir: "asc" | "desc" } | null>(null);
  const [editando, setEditando] = useState<Fila | "nuevo" | null>(null);
  const [eliminando, setEliminando] = useState<Fila | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setQ(busqueda.trim());
      setPagina(1);
    }, 250);
    return () => clearTimeout(t);
  }, [busqueda]);

  const params = new URLSearchParams({ q, pagina: String(pagina), tam: "15", dir: orden?.dir ?? "asc" });
  if (orden) params.set("orden", orden.campo);
  const { datos, error, cargando, recargar } = useDatos<Pagina>(`/tablas/${clave}?${params}`);
  const paginas = datos ? Math.max(Math.ceil(datos.total / datos.tam), 1) : 1;

  const ordenarPor = (campo: string) =>
    setOrden((o) => (o?.campo === campo ? { campo, dir: o.dir === "asc" ? "desc" : "asc" } : { campo, dir: "asc" }));

  const columnas: Columna<Fila>[] = ent.columnas.map((c) => ({
    num: c.num,
    titulo: (
      <Button variant="ghost" size="sm" className="-mx-2.5 font-medium" onClick={() => ordenarPor(c.orden)}>
        {c.titulo}
        {orden?.campo === c.orden &&
          (orden.dir === "asc" ? <ArrowUp aria-label="ascendente" /> : <ArrowDown aria-label="descendente" />)}
      </Button>
    ),
    celda: (f) => texto(f[c.campo]),
  }));
  if (puedeEscribir) {
    columnas.push({
      titulo: <span className="sr-only">Acciones</span>,
      className: "w-12",
      celda: (f) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${ent.singular} ${texto(f[ent.pk])}`}>
              <MoreHorizontal aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditando(f)}>
              <Pencil aria-hidden /> Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={() => setEliminando(f)}>
              <Trash2 aria-hidden /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });
  }

  return (
    <Card>
      <CardContent className="grid gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              type="search"
              className="pl-8"
              aria-label={`Buscar en ${ent.titulo.toLowerCase()}`}
              placeholder={`Buscar en ${ent.titulo.toLowerCase()}…`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          {puedeEscribir ? (
            <Button onClick={() => setEditando("nuevo")}>
              <Plus aria-hidden /> Nuevo {ent.singular}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Tu rol es de solo lectura.</p>
          )}
        </div>

        {error && <CajaError mensaje={error} />}
        {!datos && cargando && <Cargando filas={8} />}
        {datos && (
          <div className={cargando ? "opacity-60 transition-opacity" : undefined}>
            <TablaDatos
              columnas={columnas}
              filas={datos.filas}
              clave={(f) => texto(f[ent.pk])}
              vacio={q ? "Ningún registro coincide con la búsqueda." : "Sin registros."}
            />
          </div>
        )}

        {datos && (
          <div className="flex flex-wrap items-center justify-end gap-2 text-sm">
            <span className="text-muted-foreground" aria-live="polite">
              {datos.total} registros · página {datos.pagina} de {paginas}
            </span>
            <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
              <ChevronLeft aria-hidden /> Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={pagina >= paginas} onClick={() => setPagina((p) => p + 1)}>
              Siguiente <ChevronRight aria-hidden />
            </Button>
          </div>
        )}
      </CardContent>

      {editando && (
        <FormularioRegistro
          clave={clave}
          fila={editando === "nuevo" ? null : editando}
          alCerrar={() => setEditando(null)}
          alGuardar={() => {
            toast.success("Cambios guardados.");
            recargar();
          }}
        />
      )}
      <DialogoConfirmar
        abierto={!!eliminando}
        alCambiar={(v) => !v && setEliminando(null)}
        titulo={`¿Eliminar ${ent.singular} ${texto(eliminando?.[ent.pk])}?`}
        descripcion={eliminando ? `${ent.resumen(eliminando)}. Esta acción no se puede deshacer.` : ""}
        confirmar="Eliminar"
        alConfirmar={async () => {
          await api(`/tablas/${clave}/${texto(eliminando?.[ent.pk])}`, { metodo: "DELETE" });
          toast.success("Registro eliminado.");
          recargar();
        }}
      />
    </Card>
  );
}

function FormularioRegistro({
  clave,
  fila,
  alCerrar,
  alGuardar,
}: {
  clave: string;
  fila: Fila | null;
  alCerrar: () => void;
  alGuardar: () => void;
}) {
  const ent = ENTIDADES[clave];
  const nuevo = !fila;
  const [valores, setValores] = useState<Record<string, string>>(() =>
    Object.fromEntries(ent.campos.map((c) => [c.nombre, texto(fila?.[c.nombre])])),
  );
  const { datos: siguiente } = useDatos<{ id: number }>(nuevo ? `/tablas/${clave}/siguiente-id` : null);
  const { datos: opciones } = useDatos<Opciones>(ent.campos.some((c) => c.opciones) ? "/opciones" : null);
  const [codigo, setCodigo] = useState<string>();
  const codigoMostrado = codigo ?? (siguiente ? String(siguiente.id) : "");
  const poner = (k: string, v: string) => setValores((x) => ({ ...x, [k]: v }));

  return (
    <DialogoFormulario
      abierto
      alCambiar={(v) => !v && alCerrar()}
      titulo={nuevo ? `Nuevo ${ent.singular}` : `Editar ${ent.singular} ${texto(fila[ent.pk])}`}
      alEnviar={async () => {
        if (nuevo) {
          await api(`/tablas/${clave}`, { metodo: "POST", cuerpo: { ...valores, [ent.pk]: codigoMostrado } });
        } else {
          await api(`/tablas/${clave}/${texto(fila[ent.pk])}`, { metodo: "PUT", cuerpo: valores });
        }
        alGuardar();
      }}
    >
      {nuevo && (
        <div className="grid gap-2">
          <Label htmlFor="campo-codigo">Código</Label>
          <Input id="campo-codigo" type="number" required value={codigoMostrado} onChange={(e) => setCodigo(e.target.value)} />
        </div>
      )}
      {ent.campos.map((c) => {
        const id = `campo-${c.nombre}`;
        if (c.opciones) {
          return (
            <div key={c.nombre} className="grid gap-2">
              <Label htmlFor={id}>{c.etiqueta}</Label>
              <Select value={valores[c.nombre]} onValueChange={(v) => poner(c.nombre, v)} required>
                <SelectTrigger id={id} className="w-full">
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  {(opciones?.[c.opciones] ?? []).map((o) => (
                    <SelectItem key={o.ID} value={String(o.ID)}>
                      {o.NOMBRE}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }
        return (
          <div key={c.nombre} className="grid gap-2">
            <Label htmlFor={id}>{c.etiqueta}</Label>
            <Input
              id={id}
              type={c.tipo === "number" ? "number" : "text"}
              maxLength={c.max}
              placeholder={c.placeholder}
              required={c.nombre !== "DEPARTAMENTO" && c.nombre !== "PROGRAMA"}
              value={valores[c.nombre]}
              onChange={(e) => poner(c.nombre, e.target.value)}
            />
          </div>
        );
      })}
    </DialogoFormulario>
  );
}
