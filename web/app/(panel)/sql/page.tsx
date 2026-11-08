"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Play } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CajaError, Encabezado, TablaResultado } from "@/components/comunes";
import { useSesion } from "@/components/sesion";
import { api, mensajeDe, type Resultado } from "@/lib/cliente";

type Respuesta = Resultado & { esConsulta: boolean; filasAfectadas: number | null; recortado: boolean; ms: number };

export default function ConsolaSql() {
  const { yo } = useSesion();
  const [sql, setSql] = useState("SELECT * FROM cursos WHERE creditos >= 4 ORDER BY creditos DESC, nombre");
  const [resp, setResp] = useState<Respuesta>();
  const [error, setError] = useState<string>();
  const [corriendo, setCorriendo] = useState(false);

  async function ejecutar() {
    setCorriendo(true);
    setError(undefined);
    try {
      setResp(await api<Respuesta>("/sql", { metodo: "POST", cuerpo: { sql } }));
    } catch (e) {
      setResp(undefined);
      setError(mensajeDe(e));
    } finally {
      setCorriendo(false);
    }
  }

  return (
    <>
      <Encabezado
        titulo="Consola SQL"
        descripcion={`Ejecuta una sentencia a la vez con los privilegios de ${yo.usuario}. Los cambios se confirman de inmediato.`}
      />
      <Card>
        <CardContent className="grid gap-3">
          <Label htmlFor="sql">Sentencia SQL</Label>
          <Textarea
            id="sql"
            spellCheck={false}
            className="min-h-36 font-mono text-[13px]"
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") void ejecutar();
            }}
          />
          <div className="flex items-center gap-3">
            <Button onClick={ejecutar} disabled={corriendo || !sql.trim()}>
              {corriendo ? <Loader2 className="animate-spin" aria-hidden /> : <Play aria-hidden />}
              Ejecutar
            </Button>
            <span className="text-xs text-muted-foreground">⌘ + Enter</span>
          </div>
        </CardContent>
      </Card>

      <section aria-live="polite" className="grid gap-3">
        {error && <CajaError titulo="Oracle rechazó la sentencia" mensaje={error} />}
        {resp?.esConsulta && (
          <>
            <p className="text-sm text-muted-foreground">
              {resp.filas.length} filas en {resp.ms} ms{resp.recortado && " (se muestran solo las primeras 500)"}
            </p>
            <TablaResultado resultado={resp} />
          </>
        )}
        {resp && !resp.esConsulta && (
          <Alert>
            <CheckCircle2 aria-hidden />
            <AlertDescription>
              {resp.filasAfectadas === null
                ? "Sentencia ejecutada."
                : `Sentencia ejecutada y confirmada: ${resp.filasAfectadas} filas afectadas.`}
            </AlertDescription>
          </Alert>
        )}
      </section>
    </>
  );
}
