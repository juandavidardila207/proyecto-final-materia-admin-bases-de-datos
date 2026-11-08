"use client";

import type { ReactNode } from "react";
import { CajaError } from "@/components/comunes";
import { usePermiso } from "@/components/sesion";
import type { Permisos } from "@/lib/cliente";

// La interfaz solo oculta: quien realmente niega el acceso es Oracle y la API.
export function RequierePermiso({ permiso, children }: { permiso: keyof Permisos; children: ReactNode }) {
  if (!usePermiso(permiso)) {
    return <CajaError titulo="Acceso restringido" mensaje="Tu rol no tiene permiso para esta sección." />;
  }
  return children;
}
