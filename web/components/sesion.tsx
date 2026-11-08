"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, EVENTO_SESION_EXPIRADA, type Permisos, type Yo } from "@/lib/cliente";

const Contexto = createContext<{ yo: Yo; salir: () => Promise<void> } | null>(null);

export function SesionProvider({ children, cargando }: { children: ReactNode; cargando: ReactNode }) {
  const router = useRouter();
  const [yo, setYo] = useState<Yo | null>(null);

  useEffect(() => {
    let vivo = true;
    api<Yo>("/me")
      .then((d) => vivo && setYo(d))
      .catch(() => vivo && router.replace("/login"));
    const expirada = () => router.replace("/login");
    window.addEventListener(EVENTO_SESION_EXPIRADA, expirada);
    return () => {
      vivo = false;
      window.removeEventListener(EVENTO_SESION_EXPIRADA, expirada);
    };
  }, [router]);

  const salir = useCallback(async () => {
    await api("/logout", { metodo: "POST" }).catch(() => {});
    router.replace("/login");
  }, [router]);

  if (!yo) return cargando;
  return <Contexto.Provider value={{ yo, salir }}>{children}</Contexto.Provider>;
}

export function useSesion() {
  const c = useContext(Contexto);
  if (!c) throw new Error("useSesion fuera de SesionProvider");
  return c;
}

export function usePermiso(p: keyof Permisos) {
  return useSesion().yo.permisos[p];
}

// Carga datos de la API y expone estado de carga, error y recarga.
// Mientras llega una respuesta nueva se conservan los datos anteriores (para atenuarlos, no borrarlos).
export function useDatos<T>(ruta: string | null) {
  const [version, setVersion] = useState(0);
  const pedido = ruta ? `${ruta}#${version}` : null;
  const [estado, setEstado] = useState<{ pedido?: string; datos?: T; error?: string }>({});

  useEffect(() => {
    if (!ruta || !pedido) return;
    let vivo = true;
    api<T>(ruta)
      .then((datos) => vivo && setEstado({ pedido, datos }))
      .catch((e: Error) => vivo && setEstado((x) => ({ pedido, datos: x.datos, error: e.message })));
    return () => {
      vivo = false;
    };
  }, [ruta, pedido]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);
  const cargando = !!pedido && estado.pedido !== pedido;
  return { datos: estado.datos, error: cargando ? undefined : estado.error, cargando, recargar };
}
