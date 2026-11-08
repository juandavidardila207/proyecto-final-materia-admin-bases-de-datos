import { NextResponse } from "next/server";
import { ejecutar, exigir, ruta, sesionDe } from "@/lib/servidor/oracle";

export const DELETE = ruta(async (req, ctx: RouteContext<"/api/usuarios/[u]">) => {
  const s = sesionDe(req);
  exigir(s, "administrar");
  const { u } = await ctx.params;
  await ejecutar(s, "BEGIN UNIV_SEC.PKG_USUARIOS.eliminar(:u); END;", { u });
  return NextResponse.json({ ok: true });
});
