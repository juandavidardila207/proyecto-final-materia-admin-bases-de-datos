"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { LogOut, Menu, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSesion } from "@/components/sesion";
import { nombreRol, type Permisos } from "@/lib/cliente";
import { cn } from "@/lib/utils";

type Seccion = { ruta: string; titulo: string; grupo: string; permiso?: keyof Permisos };

export const SECCIONES: Seccion[] = [
  { ruta: "/", titulo: "Resumen", grupo: "General" },
  { ruta: "/matricular", titulo: "Matricular materias", grupo: "Registro" },
  { ruta: "/estudiantes", titulo: "Estudiantes", grupo: "Registro" },
  { ruta: "/materias", titulo: "Materias", grupo: "Registro" },
  { ruta: "/profesores", titulo: "Profesores", grupo: "Registro" },
  { ruta: "/reportes", titulo: "Reportes del taller", grupo: "Consultas" },
  { ruta: "/datos", titulo: "Tablas", grupo: "Consultas" },
  { ruta: "/sql", titulo: "Consola SQL", grupo: "Consultas" },
  { ruta: "/usuarios", titulo: "Usuarios", grupo: "Administración", permiso: "administrar" },
  { ruta: "/almacenamiento", titulo: "Almacenamiento", grupo: "Administración", permiso: "administrar" },
  { ruta: "/auditoria", titulo: "Auditoría", grupo: "Administración", permiso: "auditar" },
];

export function seccionActual(ruta: string) {
  return SECCIONES.find((s) => (s.ruta === "/" ? ruta === "/" : ruta.startsWith(s.ruta)));
}

function Navegacion({ alNavegar }: { alNavegar?: () => void }) {
  const { yo } = useSesion();
  const ruta = usePathname();
  const visibles = SECCIONES.filter((s) => !s.permiso || yo.permisos[s.permiso]);
  const grupos = [...new Set(visibles.map((s) => s.grupo))];
  const actual = seccionActual(ruta);

  return (
    <nav aria-label="Secciones" className="grid gap-5">
      {grupos.map((g) => {
        const idGrupo = `grupo-${g.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}`;
        return (
          <div key={g} role="group" aria-labelledby={idGrupo} className="grid">
            <p
              id={idGrupo}
              className={cn("mb-1 px-3 text-[11px] font-semibold tracking-[0.12em] text-sidebar-foreground/75 uppercase", g === "General" && "sr-only")}
            >
              {g}
            </p>
            {visibles
              .filter((s) => s.grupo === g)
              .map((s) => {
                const activa = actual?.ruta === s.ruta;
                return (
                  <Link
                    key={s.ruta}
                    href={s.ruta}
                    onClick={alNavegar}
                    aria-current={activa ? "page" : undefined}
                    className={cn(
                      "border-l-2 border-transparent px-3 py-1.5 text-sm text-sidebar-foreground/90 outline-none transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                      activa && "border-sidebar-ring bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                    )}
                  >
                    {s.titulo}
                  </Link>
                );
              })}
          </div>
        );
      })}
    </nav>
  );
}

function Marca() {
  return (
    <div className="px-3">
      <p className="font-heading text-xl leading-tight font-semibold text-sidebar-foreground">Registro Académico</p>
      <p className="mt-0.5 text-xs text-sidebar-foreground/75">Cursos, profesores y matrículas</p>
    </div>
  );
}

function BotonTema() {
  const { resolvedTheme, setTheme } = useTheme();
  const oscuro = resolvedTheme === "dark";
  const etiqueta = oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={etiqueta}
          onClick={() => setTheme(oscuro ? "light" : "dark")}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {oscuro ? <Sun aria-hidden /> : <Moon aria-hidden />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{etiqueta}</TooltipContent>
    </Tooltip>
  );
}

function Usuario() {
  const { yo, salir } = useSesion();
  return (
    <div className="flex items-center justify-between gap-2 border-t border-sidebar-border px-3 pt-4">
      <div className="min-w-0">
        <p className="truncate font-mono text-sm text-sidebar-foreground">{yo.usuario}</p>
        <p className="text-xs text-sidebar-foreground/75 capitalize">{nombreRol(yo.rol)}</p>
      </div>
      <div className="flex">
        <BotonTema />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Cerrar sesión"
              onClick={salir}
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cerrar sesión</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

export function Panel({ children }: { children: ReactNode }) {
  const ruta = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const actual = seccionActual(ruta);

  useEffect(() => {
    document.title = `${actual?.titulo ?? "Resumen"} · Registro Académico`;
  }, [actual]);

  return (
    <div className="min-h-svh md:grid md:grid-cols-[232px_minmax(0,1fr)]">
      <a
        href="#contenido"
        className="sr-only z-50 bg-primary px-3 py-2 text-sm text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Saltar al contenido
      </a>
      <aside className="hidden flex-col gap-8 bg-sidebar py-6 md:sticky md:top-0 md:flex md:h-svh">
        <Marca />
        <div className="flex-1 overflow-y-auto">
          <Navegacion />
        </div>
        <Usuario />
      </aside>

      <header className="sticky top-0 z-20 flex items-center gap-2 bg-sidebar px-3 py-2 text-sidebar-foreground md:hidden">
        <Sheet open={menuAbierto} onOpenChange={setMenuAbierto}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir menú"
              className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <Menu aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex w-72 flex-col gap-8 border-0 bg-sidebar py-6">
            <SheetHeader className="p-0">
              <SheetTitle asChild>
                <div>
                  <Marca />
                </div>
              </SheetTitle>
              <SheetDescription className="sr-only">Secciones de la aplicación</SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto">
              <Navegacion alNavegar={() => setMenuAbierto(false)} />
            </div>
            <Usuario />
          </SheetContent>
        </Sheet>
        <span className="font-heading font-semibold">Registro Académico</span>
      </header>

      <main id="contenido" tabIndex={-1} className="mx-auto grid w-full max-w-6xl content-start gap-6 px-4 py-6 outline-none md:px-10 md:py-10">
        {children}
      </main>
    </div>
  );
}
