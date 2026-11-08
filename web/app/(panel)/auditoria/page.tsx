"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CajaError, Cargando, Encabezado, Estado, TablaDatos, type Columna } from "@/components/comunes";
import { RequierePermiso } from "@/components/requiere-permiso";
import { useDatos } from "@/components/sesion";
import { texto, type Fila } from "@/lib/cliente";

const TONO_OPERACION: Record<string, "exito" | "aviso" | "error"> = { INSERT: "exito", UPDATE: "aviso", DELETE: "error" };

const VISTAS: Record<string, { nombre: string; ayuda: string; columnas: Columna<Fila>[] }> = {
  cambios: {
    nombre: "Cambios en los datos",
    ayuda: "Bitácora propia: qué cambió en cada fila, quién lo hizo y los valores antes y después.",
    columnas: [
      { titulo: "Fecha", celda: (f) => <span className="whitespace-nowrap">{texto(f.FECHA)}</span> },
      { titulo: "Usuario", celda: (f) => <span className="font-mono">{texto(f.USUARIO_BD)}</span> },
      {
        titulo: "Operación",
        celda: (f) => <Estado tono={TONO_OPERACION[texto(f.OPERACION)] ?? "neutro"}>{texto(f.OPERACION)}</Estado>,
      },
      { titulo: "Tabla", celda: (f) => texto(f.TABLA) },
      { titulo: "Registro", celda: (f) => texto(f.ID_REGISTRO), num: true },
      { titulo: "Antes", celda: (f) => texto(f.ANTES), className: "max-w-64 font-mono text-xs whitespace-normal break-all" },
      { titulo: "Después", celda: (f) => texto(f.DESPUES), className: "max-w-64 font-mono text-xs whitespace-normal break-all" },
    ],
  },
  unificada: {
    nombre: "Auditoría de Oracle",
    ayuda: "UNIFIED_AUDIT_TRAIL: accesos, intentos fallidos, administración de cuentas y cambios de datos.",
    columnas: [
      { titulo: "Fecha", celda: (f) => <span className="whitespace-nowrap">{texto(f.FECHA)}</span> },
      { titulo: "Usuario", celda: (f) => <span className="font-mono">{texto(f.DBUSERNAME)}</span> },
      { titulo: "Acción", celda: (f) => texto(f.ACTION_NAME) },
      { titulo: "Objeto", celda: (f) => [f.OBJECT_SCHEMA, f.OBJECT_NAME].filter(Boolean).join(".") },
      {
        titulo: "Resultado",
        celda: (f) =>
          f.RETURN_CODE === 0 ? (
            <Estado tono="exito">Exitoso</Estado>
          ) : (
            <Estado tono="error">ORA-{String(f.RETURN_CODE).padStart(5, "0")}</Estado>
          ),
      },
      { titulo: "Política", celda: (f) => texto(f.POLITICA), className: "text-xs" },
    ],
  },
};

export default function Pagina() {
  return (
    <RequierePermiso permiso="auditar">
      <Auditoria />
    </RequierePermiso>
  );
}

function Auditoria() {
  const [vista, setVista] = useState("cambios");
  const { datos, error, cargando } = useDatos<Fila[]>(`/auditoria/${vista}`);
  const v = VISTAS[vista];

  return (
    <>
      <Encabezado titulo="Auditoría" descripcion="Quién hizo qué y cuándo." />
      <Tabs value={vista} onValueChange={setVista}>
        <TabsList>
          {Object.entries(VISTAS).map(([k, x]) => (
            <TabsTrigger key={k} value={k}>
              {x.nombre}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Card>
        <CardHeader>
          <CardTitle>{v.nombre}</CardTitle>
          <CardDescription>{v.ayuda} Últimos 200 eventos.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && <CajaError mensaje={error} />}
          {cargando && !datos && <Cargando filas={8} />}
          {datos && (
            <div className={cargando ? "opacity-60" : undefined}>
              <TablaDatos alto filas={datos} clave={(_, i) => String(i)} columnas={v.columnas} vacio="Sin eventos registrados." />
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
