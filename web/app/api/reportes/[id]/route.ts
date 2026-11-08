import { NextResponse } from "next/server";
import { ErrorHttp, aTabla, comoArreglo, ejecutar, ruta, sesionDe } from "@/lib/servidor/oracle";
import { reportes } from "@/lib/servidor/datos";

export const GET = ruta(async (req, ctx: RouteContext<"/api/reportes/[id]">) => {
  const s = sesionDe(req);
  const { id } = await ctx.params;
  const rep = reportes().find((x) => x.id === id);
  if (!rep) throw new ErrorHttp(404, "Reporte no encontrado.");
  return NextResponse.json({ ...rep, ...aTabla(await ejecutar(s, rep.sql, {}, comoArreglo)) });
});
