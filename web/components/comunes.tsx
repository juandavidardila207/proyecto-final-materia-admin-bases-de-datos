"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { seccionActual } from "@/components/panel";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { texto, type Resultado } from "@/lib/cliente";

export function Encabezado({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children?: ReactNode }) {
  const grupo = seccionActual(usePathname())?.grupo;
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
      <div className="max-w-2xl">
        {grupo && grupo !== "General" && (
          <p className="mb-1 text-xs font-semibold tracking-[0.12em] text-primary uppercase">{grupo}</p>
        )}
        <h1 className="text-3xl leading-tight font-semibold">{titulo}</h1>
        {descripcion && <p className="mt-1.5 text-muted-foreground">{descripcion}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </header>
  );
}

export function CajaError({ mensaje, titulo = "No se pudo cargar" }: { mensaje: string; titulo?: string }) {
  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle />
      <AlertTitle>{titulo}</AlertTitle>
      <AlertDescription>{mensaje}</AlertDescription>
    </Alert>
  );
}

export function Cargando({ filas = 5 }: { filas?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: filas }, (_, i) => (
        <Skeleton key={i} className="h-9 w-full" />
      ))}
    </div>
  );
}

export function Vacio({ mensaje }: { mensaje: string }) {
  return (
    <p className="border-y border-dashed py-8 text-center text-sm text-muted-foreground">{mensaje}</p>
  );
}

type Tono = "exito" | "aviso" | "error" | "neutro";
const TONOS: Record<Tono, string> = {
  exito: "border-exito/30 bg-exito/10 text-exito",
  aviso: "border-aviso/30 bg-aviso/10 text-aviso",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  neutro: "",
};
export function Estado({ tono, children }: { tono: Tono; children: ReactNode }) {
  return (
    <Badge variant={tono === "neutro" ? "secondary" : "outline"} className={cn(TONOS[tono])}>
      {children}
    </Badge>
  );
}

export type Columna<T> = {
  titulo: ReactNode;
  celda: (fila: T) => ReactNode;
  num?: boolean;
  className?: string;
};

export function TablaDatos<T>({
  columnas,
  filas,
  vacio = "Sin registros.",
  clave,
  alto,
}: {
  columnas: Columna<T>[];
  filas: T[];
  vacio?: string;
  clave: (fila: T, i: number) => string;
  alto?: boolean;
}) {
  if (!filas.length) return <Vacio mensaje={vacio} />;
  return (
    <div className={cn("overflow-auto border-y", alto && "max-h-[60vh]")}>
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]">
          <TableRow className="hover:bg-transparent">
            {columnas.map((c, i) => (
              <TableHead
                key={i}
                className={cn("text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase", c.num && "text-right", c.className)}
              >
                {c.titulo}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((f, i) => (
            <TableRow key={clave(f, i)}>
              {columnas.map((c, j) => (
                <TableCell key={j} className={cn(c.num && "text-right tabular-nums", c.className)}>
                  {c.celda(f)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Tabla para resultados de SQL: columnas y filas en arreglos.
export function TablaResultado({ resultado, vacio = "La consulta no devolvió filas." }: { resultado: Resultado; vacio?: string }) {
  const numerica = resultado.columnas.map((_, i) => typeof resultado.filas[0]?.[i] === "number");
  return (
    <TablaDatos
      alto
      vacio={vacio}
      filas={resultado.filas}
      clave={(_, i) => String(i)}
      columnas={resultado.columnas.map((nombre, i) => ({
        titulo: nombre,
        num: numerica[i],
        celda: (f: unknown[]) => texto(f[i]),
      }))}
    />
  );
}
