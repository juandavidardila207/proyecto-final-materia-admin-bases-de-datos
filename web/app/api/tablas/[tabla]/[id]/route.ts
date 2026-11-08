import { NextResponse } from "next/server";
import { ErrorHttp, ejecutar, leerJson, ruta, sesionDe } from "@/lib/servidor/oracle";
import { definicion, idNumerico, valoresDelFormulario } from "@/lib/servidor/datos";

type Ctx = RouteContext<"/api/tablas/[tabla]/[id]">;

export const PUT = ruta(async (req, ctx: Ctx) => {
  const s = sesionDe(req);
  const { tabla, id } = await ctx.params;
  const d = definicion(tabla);
  const cols = Object.keys(d.columnas).filter((c) => c !== d.pk);
  const binds = { ...valoresDelFormulario(d, await leerJson(req), cols), ID_FILA: idNumerico(id) };
  const r = await ejecutar(
    s,
    `UPDATE ${d.tabla} SET ${cols.map((c) => `${c} = :${c}`).join(", ")} WHERE ${d.pk} = :ID_FILA`,
    binds,
  );
  if (!r.rowsAffected) throw new ErrorHttp(404, "El registro ya no existe.");
  return NextResponse.json({ ok: true });
});

export const DELETE = ruta(async (req, ctx: Ctx) => {
  const s = sesionDe(req);
  const { tabla, id } = await ctx.params;
  const d = definicion(tabla);
  const r = await ejecutar(s, `DELETE FROM ${d.tabla} WHERE ${d.pk} = :id`, { id: idNumerico(id) });
  if (!r.rowsAffected) throw new ErrorHttp(404, "El registro ya no existe.");
  return NextResponse.json({ ok: true });
});
