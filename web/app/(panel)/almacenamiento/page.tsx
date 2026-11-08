"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CajaError, Cargando, Encabezado, Estado, TablaDatos } from "@/components/comunes";
import { RequierePermiso } from "@/components/requiere-permiso";
import { useDatos } from "@/components/sesion";
import { texto } from "@/lib/cliente";
import { cn } from "@/lib/utils";

type Tablespace = {
  TABLESPACE_NAME: string;
  TIPO: string;
  USADO_MB: number;
  ASIGNADO_MB: number;
  MAXIMO_MB: number;
  PCT_USADO: number;
};
type Segmento = { ESQUEMA: string; SEGMENTO: string; TIPO: string; TABLESPACE_NAME: string; TAMANO_KB: number };
type Backup = { FECHA: string; TIPO: string; DETALLE: string; TAMANO_MB: number | null; ESTADO: string };
type Datos = { tablespaces: Tablespace[]; segmentos: Segmento[]; backups: Backup[] };

const propio = (t: { TABLESPACE_NAME: string }) => t.TABLESPACE_NAME.includes("UNIV");

// La barra muestra el uso del espacio asignado; el color de alerta depende del máximo al que puede crecer.
function Uso({ t }: { t: Tablespace }) {
  const delMaximo = (t.USADO_MB / t.MAXIMO_MB) * 100;
  const nivel = delMaximo >= 90 ? "[&>div]:bg-destructive" : delMaximo >= 75 ? "[&>div]:bg-aviso" : "[&>div]:bg-exito";
  return (
    <div className="grid min-w-32 gap-1">
      <span className="text-xs tabular-nums">{t.PCT_USADO}%</span>
      <Progress value={Math.min(t.PCT_USADO, 100)} className={cn("h-1.5", nivel)} aria-label={`${t.TABLESPACE_NAME}: ${t.PCT_USADO}% usado`} />
    </div>
  );
}

export default function Pagina() {
  return (
    <RequierePermiso permiso="administrar">
      <Almacenamiento />
    </RequierePermiso>
  );
}

function Almacenamiento() {
  const { datos, error, cargando } = useDatos<Datos>("/almacenamiento");
  const tablespaces = datos ? [...datos.tablespaces].sort((a, b) => Number(propio(b)) - Number(propio(a))) : [];

  return (
    <>
      <Encabezado
        titulo="Almacenamiento y backups"
        descripcion="Estado físico de la base. Los backups se ejecutan con los scripts de la carpeta backup/."
      />
      {error && <CajaError mensaje={error} />}
      {cargando && !datos && <Cargando filas={8} />}
      {datos && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Tablespaces</CardTitle>
              <CardDescription>
                Los marcados como «Proyecto» los creó este proyecto. La barra muestra el uso del espacio ya asignado;
                se pone amarilla o roja solo cuando se acerca al máximo al que puede crecer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TablaDatos
                filas={tablespaces}
                clave={(t) => t.TABLESPACE_NAME}
                columnas={[
                  {
                    titulo: "Tablespace",
                    celda: (t) => (
                      <span className="flex items-center gap-2 font-mono">
                        {t.TABLESPACE_NAME}
                        {propio(t) && <Estado tono="neutro">Proyecto</Estado>}
                      </span>
                    ),
                  },
                  { titulo: "Tipo", celda: (t) => t.TIPO.toLowerCase() },
                  { titulo: "Usado (MB)", celda: (t) => t.USADO_MB, num: true },
                  { titulo: "Asignado (MB)", celda: (t) => t.ASIGNADO_MB, num: true },
                  { titulo: "Máximo (MB)", celda: (t) => (t.MAXIMO_MB >= 1_000_000 ? "Sin límite" : t.MAXIMO_MB), num: true },
                  { titulo: "Uso del asignado", celda: (t) => <Uso t={t} /> },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tablas e índices del proyecto</CardTitle>
              <CardDescription>Los datos, los índices y la auditoría están en tablespaces separados.</CardDescription>
            </CardHeader>
            <CardContent>
              <TablaDatos
                alto
                filas={datos.segmentos}
                clave={(s) => `${s.ESQUEMA}.${s.SEGMENTO}`}
                columnas={[
                  { titulo: "Esquema", celda: (s) => s.ESQUEMA },
                  { titulo: "Objeto", celda: (s) => <span className="font-mono">{s.SEGMENTO}</span> },
                  { titulo: "Tipo", celda: (s) => s.TIPO.toLowerCase() },
                  { titulo: "Tablespace", celda: (s) => <span className="font-mono">{s.TABLESPACE_NAME}</span> },
                  { titulo: "Tamaño (KB)", celda: (s) => s.TAMANO_KB, num: true },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de backups</CardTitle>
              <CardDescription>Lo registran los scripts de backup y recuperación.</CardDescription>
            </CardHeader>
            <CardContent>
              <TablaDatos
                filas={datos.backups}
                clave={(b, i) => `${b.FECHA}-${i}`}
                vacio="Todavía no se ha hecho ningún backup."
                columnas={[
                  { titulo: "Fecha", celda: (b) => texto(b.FECHA) },
                  { titulo: "Tipo", celda: (b) => b.TIPO },
                  { titulo: "Detalle", celda: (b) => b.DETALLE, className: "max-w-80 whitespace-normal" },
                  { titulo: "MB", celda: (b) => texto(b.TAMANO_MB), num: true },
                  {
                    titulo: "Estado",
                    celda: (b) => <Estado tono={b.ESTADO === "OK" ? "exito" : "error"}>{b.ESTADO}</Estado>,
                  },
                ]}
              />
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
