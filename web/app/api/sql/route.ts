// Consola SQL: corre con los privilegios reales del usuario conectado.
import { NextResponse } from "next/server";
import { ErrorHttp, aTabla, comoArreglo, ejecutar, leerJson, ruta, sesionDe } from "@/lib/servidor/oracle";

const MAX_FILAS = 500;

export const POST = ruta(async (req) => {
  const s = sesionDe(req);
  let sql = String((await leerJson(req)).sql ?? "").trim();
  if (!sql) throw new ErrorHttp(400, "Escribe una sentencia SQL.");
  if (!/^(BEGIN|DECLARE)\b/i.test(sql)) sql = sql.replace(/;\s*$/, "");
  const inicio = Date.now();
  const r = await ejecutar(s, sql, {}, { ...comoArreglo, maxRows: MAX_FILAS + 1 });
  const salida = aTabla(r);
  const recortado = salida.filas.length > MAX_FILAS;
  if (recortado) salida.filas.length = MAX_FILAS;
  return NextResponse.json({
    ...salida,
    esConsulta: !!r.metaData,
    filasAfectadas: r.rowsAffected ?? null,
    recortado,
    ms: Date.now() - inicio,
  });
});
