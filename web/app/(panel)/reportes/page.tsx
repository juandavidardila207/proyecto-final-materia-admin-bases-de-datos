"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CajaError, Cargando, Encabezado, TablaResultado } from "@/components/comunes";
import { useDatos } from "@/components/sesion";
import { descargarCsv, type Resultado } from "@/lib/cliente";

type Reporte = { id: string; enunciado: string; sql: string };

export default function Reportes() {
  const lista = useDatos<Reporte[]>("/reportes");
  const [actual, setActual] = useState("1");
  const rep = useDatos<Reporte & Resultado>(`/reportes/${actual}`);

  return (
    <>
      <Encabezado
        titulo="Reportes"
        descripcion="Las cuatro consultas obligatorias del taller: enunciado, planteamiento y resultado."
      />
      {lista.error && <CajaError mensaje={lista.error} />}
      {lista.datos && (
        <Tabs value={actual} onValueChange={setActual}>
          <TabsList>
            {lista.datos.map((r) => (
              <TabsTrigger key={r.id} value={r.id}>
                Consulta {r.id}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      {rep.error && <CajaError mensaje={rep.error} />}
      {rep.cargando && !rep.datos && <Cargando filas={6} />}
      {rep.datos && (
        <Card className={rep.cargando ? "opacity-60" : undefined}>
          <CardHeader>
            <CardTitle className="text-lg">{rep.datos.enunciado}</CardTitle>
            <CardDescription>{rep.datos.filas.length} filas</CardDescription>
            <CardAction>
              <Button variant="outline" size="sm" onClick={() => descargarCsv(`reporte_${actual}.csv`, rep.datos!)}>
                <Download aria-hidden /> Descargar CSV
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="grid gap-4">
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 font-mono text-[13px] leading-relaxed">
              <code>{rep.datos.sql}</code>
            </pre>
            <TablaResultado resultado={rep.datos} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
