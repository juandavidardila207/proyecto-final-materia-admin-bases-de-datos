"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, mensajeDe } from "@/lib/cliente";

export default function PaginaLogin() {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  async function entrar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const datos = Object.fromEntries(new FormData(ev.currentTarget));
    setEnviando(true);
    setError(undefined);
    try {
      await api("/login", { metodo: "POST", cuerpo: datos });
      router.replace("/");
    } catch (e) {
      setError(mensajeDe(e));
      setEnviando(false);
    }
  }

  return (
    <main className="grid min-h-svh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section className="flex flex-col justify-between gap-10 bg-sidebar px-8 py-10 text-sidebar-foreground lg:px-14 lg:py-14">
        <p className="text-xs font-semibold tracking-[0.14em] text-sidebar-foreground/75 uppercase">Proyecto de Bases de Datos · Caso 4</p>
        <div className="max-w-md">
          <h1 className="font-heading text-4xl leading-tight font-semibold lg:text-5xl">Registro Académico</h1>
          <p className="mt-4 text-lg text-sidebar-foreground/85">
            Matrícula de estudiantes, materias y profesores sobre Oracle Database.
          </p>
        </div>
        <p className="hidden max-w-sm text-sm text-sidebar-foreground/75 lg:block">
          Cada persona entra con su propio usuario de Oracle: los permisos y la auditoría los aplica la base de datos.
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-12">
        <form onSubmit={entrar} className="grid w-full max-w-sm gap-5">
          <div className="flex items-end justify-between gap-4 border-b pb-5">
            <Image
              src="/oracle-logo.png"
              alt="Oracle"
              width={146}
              height={21}
              preload
              unoptimized
              className="h-auto w-[146px]"
            />
            <span className="text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
              Database 26ai Free
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-semibold">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-muted-foreground">Usa tu usuario de la base de datos, por ejemplo U_OPERADOR.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="usuario">Usuario</Label>
            <Input id="usuario" name="usuario" className="h-10 font-mono uppercase" autoComplete="username" autoCapitalize="characters" required autoFocus />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" name="password" type="password" className="h-10" autoComplete="current-password" required />
          </div>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" disabled={enviando} className="h-10">
            {enviando && <Loader2 className="animate-spin" aria-hidden />}
            Entrar
          </Button>
        </form>
      </section>
    </main>
  );
}
