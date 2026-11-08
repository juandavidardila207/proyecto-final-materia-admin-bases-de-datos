"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, BookPlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
    SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { BuscarEstudiante } from "@/components/buscar-estudiante";
import { CajaError, Cargando, Encabezado, TablaDatos, Vacio } from "@/components/comunes";
import { DialogoConfirmar } from "@/components/dialogos";
import { useDatos, usePermiso } from "@/components/sesion";
import { api, mensajeDe } from "@/lib/cliente";
import { semestresDisponibles, type Catalogo } from "@/lib/catalogo";

type Matricula = {
  ID_MATRICULA: number;
  SEMESTRE: string;
  ID_CURSO: number;
  CURSO: string;
  CREDITOS: number;
  ID_PROFESOR: number;
  PROFESOR: string;
  DEPARTAMENTO: string | null;
};
type Fila = { clave: number; curso: string; profesor: string };

let contador = 0;
const filaNueva = (): Fila => ({ clave: ++contador, curso: "", profesor: "" });

// useSearchParams necesita un límite de Suspense en páginas prerenderizadas.
export default function Pagina() {
  return (
    <Suspense fallback={<Cargando filas={4} />}>
      <Matricular />
    </Suspense>
  );
}

function Matricular() {
  const puedeEscribir = usePermiso("escribir");
  const catalogo = useDatos<Catalogo>("/catalogo");
  const parametros = useSearchParams();
  const [consultado, setConsultado] = useState<number | null>(() => {
    const n = Number(parametros.get("estudiante"));
    return Number.isInteger(n) && n > 0 ? n : null;
  });
  const historial = useDatos<{ matriculas: Matricula[] }>(consultado ? `/matricula?estudiante=${consultado}` : null);
  const [semestre, setSemestre] = useState("");
  const [filas, setFilas] = useState<Fila[]>(() => [filaNueva()]);
  const [error, setError] = useState<string>();
  const [enviando, setEnviando] = useState(false);
  const [cancelando, setCancelando] = useState<Matricula | null>(null);

  const cat = catalogo.datos;
  const semestres = useMemo(() => semestresDisponibles(cat?.semestres ?? []), [cat]);
  const semestreActual = semestre || semestres.find((x) => cat?.semestres.includes(x)) || semestres[0] || "";
  const cursoPorId = useMemo(() => new Map(cat?.cursos.map((c) => [String(c.ID_CURSO), c])), [cat]);
  const matriculas = consultado ? historial.datos?.matriculas ?? [] : [];
  const yaInscritas = new Set(matriculas.filter((m) => m.SEMESTRE === semestreActual).map((m) => String(m.ID_CURSO)));
  const creditosActuales = matriculas.filter((m) => m.SEMESTRE === semestreActual).reduce((t, m) => t + m.CREDITOS, 0);
  const creditosNuevos = filas.reduce((t, f) => t + (cursoPorId.get(f.curso)?.CREDITOS ?? 0), 0);
  const filasListas = filas.filter((f) => f.curso && f.profesor);
  const ficha = cat?.estudiantes.find((e) => e.ID_ESTUDIANTE === consultado);

  function elegirEstudiante(n: number) {
    setError(undefined);
    setFilas([filaNueva()]);
    setConsultado(n);
  }

  function cambiarFila(clave: number, cambio: Partial<Fila>) {
    setFilas((fs) => fs.map((f) => (f.clave === clave ? { ...f, ...cambio } : f)));
  }

  async function matricular() {
    if (!consultado) return;
    setEnviando(true);
    setError(undefined);
    try {
      await api("/matricula", {
        metodo: "POST",
        cuerpo: {
          estudiante: consultado,
          semestre: semestreActual,
          materias: filasListas.map((f) => ({ id_curso: Number(f.curso), id_profesor: Number(f.profesor) })),
        },
      });
      toast.success(
        `${ficha?.NOMBRE ?? `Estudiante ${consultado}`}: ${filasListas.length} ${filasListas.length === 1 ? "materia matriculada" : "materias matriculadas"} en ${semestreActual}.`,
      );
      setFilas([filaNueva()]);
      historial.recargar();
      catalogo.recargar();
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setEnviando(false);
    }
  }

  const porSemestre = Object.entries(
    matriculas.reduce<Record<string, Matricula[]>>((g, m) => ((g[m.SEMESTRE] ??= []).push(m), g), {}),
  );

  return (
    <>
      <Encabezado
        titulo="Matricular materias"
        descripcion="Elige al estudiante y el semestre, agrega las materias con su profesor y confirma."
      />
      {catalogo.error && <CajaError mensaje={catalogo.error} />}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Estudiante y semestre</CardTitle>
              <CardDescription>
                Solo aparecen estudiantes registrados.{" "}
                <Link href="/estudiantes" className="font-medium text-primary underline-offset-4 hover:underline">
                  Registrar uno nuevo
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="grid gap-2">
                  <Label htmlFor="buscar-estudiante">Estudiante</Label>
                  {cat ? (
                    <BuscarEstudiante
                      id="buscar-estudiante"
                      estudiantes={cat.estudiantes}
                      valor={consultado}
                      alCambiar={elegirEstudiante}
                    />
                  ) : (
                    <Skeleton className="h-10 w-full" />
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="semestre">Semestre</Label>
                  <Select value={semestreActual} onValueChange={setSemestre}>
                    <SelectTrigger id="semestre" className="h-10 w-full sm:w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {semestres.map((x) => (
                        <SelectItem key={x} value={x}>
                          {x}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {consultado && cat && !ficha && (
                <CajaError titulo="Estudiante no registrado" mensaje={`No hay ningún estudiante con el código ${consultado}.`} />
              )}
              {ficha && (
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 border-l-2 border-primary pl-4 text-sm">
                  <dt className="text-muted-foreground">Código</dt>
                  <dd className="tabular-nums">{ficha.ID_ESTUDIANTE}</dd>
                  <dt className="text-muted-foreground">Programa</dt>
                  <dd>{ficha.PROGRAMA ?? "—"}</dd>
                  <dt className="text-muted-foreground">Correo</dt>
                  <dd className="break-all">{ficha.CORREO}</dd>
                </dl>
              )}
            </CardContent>
          </Card>

          <Card aria-disabled={!ficha}>
            <CardHeader>
              <CardTitle>2. Materias a matricular</CardTitle>
              <CardDescription>
                {ficha
                  ? `Para ${ficha.NOMBRE} en ${semestreActual}. Para cada materia solo aparecen los profesores que la dictan.`
                  : "Elige primero un estudiante."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {!puedeEscribir && (
                <Alert>
                  <AlertCircle aria-hidden />
                  <AlertDescription>Tu rol es de solo lectura: puedes consultar, pero no matricular.</AlertDescription>
                </Alert>
              )}
              {!cat && catalogo.cargando && <Cargando filas={2} />}
              {cat &&
                filas.map((f, i) => {
                  const dictan = new Set(
                    cat.asignaciones.filter((a) => String(a.ID_CURSO) === f.curso).map((a) => a.ID_PROFESOR),
                  );
                  const habilitado = !!ficha && puedeEscribir;
                  return (
                    <fieldset key={f.clave} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                      <legend className="sr-only">Materia {i + 1}</legend>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`curso-${f.clave}`} className="text-xs text-muted-foreground">
                          Materia {i + 1}
                        </Label>
                        <Select
                          value={f.curso}
                          onValueChange={(v) => cambiarFila(f.clave, { curso: v, profesor: "" })}
                          disabled={!habilitado}
                        >
                          <SelectTrigger id={`curso-${f.clave}`} className="w-full">
                            <SelectValue placeholder="Elige la materia" />
                          </SelectTrigger>
                          <SelectContent>
                            {cat.cursos.map((c) => {
                              const id = String(c.ID_CURSO);
                              const enOtraFila = filas.some((o) => o.clave !== f.clave && o.curso === id);
                              const inscrita = yaInscritas.has(id);
                              const sinProfesor = c.PROFESORES === 0;
                              return (
                                <SelectItem key={id} value={id} disabled={enOtraFila || inscrita || sinProfesor}>
                                  {c.NOMBRE}
                                  <span className="text-muted-foreground">
                                    · {c.CREDITOS} {c.CREDITOS === 1 ? "crédito" : "créditos"}
                                    {inscrita && " · ya matriculada"}
                                    {!inscrita && sinProfesor && " · sin profesor asignado"}
                                  </span>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label htmlFor={`profesor-${f.clave}`} className="text-xs text-muted-foreground">
                          Profesor
                        </Label>
                        {f.curso && dictan.size === 0 ? (
                          <p className="flex h-8 items-center text-sm text-muted-foreground">
                            Nadie dicta esta materia.&nbsp;
                            <Link href="/profesores" className="font-medium text-primary underline-offset-4 hover:underline">
                              Asignarla
                            </Link>
                          </p>
                        ) : (
                          <Select
                            value={f.profesor}
                            onValueChange={(v) => cambiarFila(f.clave, { profesor: v })}
                            disabled={!habilitado || !f.curso}
                          >
                            <SelectTrigger id={`profesor-${f.clave}`} className="w-full">
                              <SelectValue placeholder={f.curso ? "Elige el profesor" : "Elige primero la materia"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectLabel>Dictan esta materia</SelectLabel>
                                {cat.profesores
                                  .filter((p) => dictan.has(p.ID_PROFESOR))
                                  .map((p) => (
                                    <SelectItem key={p.ID_PROFESOR} value={String(p.ID_PROFESOR)}>
                                      {p.NOMBRE}
                                      {p.DEPARTAMENTO && <span className="text-muted-foreground">· {p.DEPARTAMENTO}</span>}
                                    </SelectItem>
                                  ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Quitar la materia ${i + 1}`}
                        disabled={filas.length === 1 || !habilitado}
                        onClick={() => setFilas((fs) => fs.filter((o) => o.clave !== f.clave))}
                      >
                        <X aria-hidden />
                      </Button>
                    </fieldset>
                  );
                })}
              <Button
                type="button"
                variant="outline"
                className="justify-self-start"
                disabled={!ficha || !puedeEscribir || filas.length >= 10}
                onClick={() => setFilas((fs) => [...fs, filaNueva()])}
              >
                <Plus aria-hidden /> Agregar otra materia
              </Button>
              {error && (
                <Alert variant="destructive" role="alert">
                  <AlertCircle aria-hidden />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="flex flex-wrap items-center justify-between gap-3 border-t">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {consultado
                  ? `Créditos en ${semestreActual}: ${creditosActuales} actuales + ${creditosNuevos} nuevos = ${creditosActuales + creditosNuevos}`
                  : "Sin estudiante seleccionado"}
              </p>
              <Button onClick={matricular} disabled={!ficha || !puedeEscribir || !filasListas.length || enviando}>
                {enviando ? <Loader2 className="animate-spin" aria-hidden /> : <BookPlus aria-hidden />}
                Matricular {filasListas.length > 1 ? `${filasListas.length} materias` : "materia"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <Card className="lg:sticky lg:top-8">
          <CardHeader>
            <CardTitle>Materias matriculadas</CardTitle>
            <CardDescription>
              {ficha ? `Historial de ${ficha.NOMBRE}.` : "Elige un estudiante para ver sus materias."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            {!consultado && <Vacio mensaje="Todavía no has elegido un estudiante." />}
            {consultado && cat && !ficha && <Vacio mensaje="Elige un estudiante registrado." />}
            {ficha && historial.error && <CajaError mensaje={historial.error} />}
            {consultado && historial.cargando && !historial.datos && <Cargando filas={3} />}
            {consultado && historial.datos && !matriculas.length && (
              <Vacio mensaje={`${ficha?.NOMBRE ?? `El estudiante ${consultado}`} no tiene materias matriculadas todavía.`} />
            )}
            {porSemestre.map(([sem, lista], i) => (
              <section key={sem} className="grid gap-2" aria-label={`Semestre ${sem}`}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between">
                  <h2 className="font-medium">Semestre {sem}</h2>
                  <Badge variant="secondary">{lista.reduce((t, m) => t + m.CREDITOS, 0)} créditos</Badge>
                </div>
                <TablaDatos
                  filas={lista}
                  clave={(m) => String(m.ID_MATRICULA)}
                  columnas={[
                    { titulo: "Materia", celda: (m) => m.CURSO, className: "whitespace-normal" },
                    { titulo: "Créd.", celda: (m) => m.CREDITOS, num: true },
                    { titulo: "Profesor", celda: (m) => m.PROFESOR, className: "whitespace-normal" },
                    ...(puedeEscribir
                      ? [
                          {
                            titulo: <span className="sr-only">Cancelar</span>,
                            className: "w-10",
                            celda: (m: Matricula) => (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Cancelar ${m.CURSO}`}
                                onClick={() => setCancelando(m)}
                              >
                                <Trash2 aria-hidden />
                              </Button>
                            ),
                          },
                        ]
                      : []),
                  ]}
                />
              </section>
            ))}
          </CardContent>
        </Card>
      </div>

      <DialogoConfirmar
        abierto={!!cancelando}
        alCambiar={(v) => !v && setCancelando(null)}
        titulo="¿Cancelar esta matrícula?"
        descripcion={
          cancelando
            ? `${cancelando.CURSO} (${cancelando.SEMESTRE}) de ${ficha?.NOMBRE ?? `el estudiante ${consultado}`}. Queda registrado en la auditoría.`
            : ""
        }
        confirmar="Cancelar matrícula"
        alConfirmar={async () => {
          if (!cancelando) return;
          await api(`/tablas/matriculas/${cancelando.ID_MATRICULA}`, { metodo: "DELETE" });
          toast.success(`Matrícula de ${cancelando.CURSO} cancelada.`);
          historial.recargar();
          catalogo.recargar();
        }}
      />
    </>
  );
}
