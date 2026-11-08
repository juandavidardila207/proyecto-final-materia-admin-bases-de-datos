// POST /api/usuarios/:u/rol | password | bloqueo
import { NextResponse } from "next/server";
import { ErrorHttp, ejecutar, exigir, leerJson, ruta, sesionDe } from "@/lib/servidor/oracle";

export const POST = ruta(async (req, ctx: RouteContext<"/api/usuarios/[u]/[accion]">) => {
  const s = sesionDe(req);
  exigir(s, "administrar");
  const { u, accion } = await ctx.params;
  const c = await leerJson(req);

  if (accion === "rol") {
    await ejecutar(s, "BEGIN UNIV_SEC.PKG_USUARIOS.cambiar_rol(:u, :r); END;", { u, r: String(c.rol ?? "") });
  } else if (accion === "password") {
    await ejecutar(s, "BEGIN UNIV_SEC.PKG_USUARIOS.cambiar_password(:u, :p); END;", {
      u,
      p: String(c.password ?? ""),
    });
  } else if (accion === "bloqueo") {
    const proc = c.bloquear ? "bloquear" : "desbloquear";
    await ejecutar(s, `BEGIN UNIV_SEC.PKG_USUARIOS.${proc}(:u); END;`, { u });
  } else {
    throw new ErrorHttp(404, "Ruta no encontrada.");
  }
  return NextResponse.json({ ok: true });
});
