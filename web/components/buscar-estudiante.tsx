"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Estudiante } from "@/lib/catalogo";
import { cn } from "@/lib/utils";

// Selector con búsqueda: filtra por nombre, código o programa.
export function BuscarEstudiante({
  id,
  estudiantes,
  valor,
  alCambiar,
}: {
  id: string;
  estudiantes: Estudiante[];
  valor: number | null;
  alCambiar: (codigo: number) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const elegido = estudiantes.find((e) => e.ID_ESTUDIANTE === valor);

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={abierto}
          className="h-10 w-full justify-between font-normal"
        >
          {elegido ? (
            <span className="truncate">
              {elegido.NOMBRE} <span className="text-muted-foreground tabular-nums">· {elegido.ID_ESTUDIANTE}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Busca por nombre o código…</span>
          )}
          <ChevronsUpDown className="opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Nombre, código o programa" />
          <CommandList>
            <CommandEmpty>
              <p>Ningún estudiante coincide.</p>
              <Link href="/estudiantes" className="mt-1 inline-block font-medium text-primary underline-offset-4 hover:underline">
                Registrar un estudiante
              </Link>
            </CommandEmpty>
            <CommandGroup>
              {estudiantes.map((e) => (
                <CommandItem
                  key={e.ID_ESTUDIANTE}
                  value={`${e.ID_ESTUDIANTE} ${e.NOMBRE} ${e.PROGRAMA ?? ""}`}
                  onSelect={() => {
                    alCambiar(e.ID_ESTUDIANTE);
                    setAbierto(false);
                  }}
                >
                  <Check className={cn(valor === e.ID_ESTUDIANTE ? "opacity-100" : "opacity-0")} aria-hidden />
                  <span className="grid min-w-0">
                    <span className="truncate">{e.NOMBRE}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {e.ID_ESTUDIANTE} · {e.PROGRAMA ?? "Sin programa"}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
