import { NextResponse } from "next/server";
import { ejecutar, ruta, sesionDe } from "@/lib/servidor/oracle";
import { definicion } from "@/lib/servidor/datos";

export const GET = ruta(async (req, ctx: RouteContext<"/api/tablas/[tabla]/siguiente-id">) => {
  const s = sesionDe(req);
  const d = definicion((await ctx.params).tabla);
  const r = await ejecutar<{ N: number }>(s, `SELECT NVL(MAX(${d.pk}), 0) + 1 AS n FROM ${d.tabla}`);
  return NextResponse.json({ id: r.rows?.[0].N });
});
