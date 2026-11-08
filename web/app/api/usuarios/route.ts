// Gestión de usuarios: todo pasa por el paquete UNIV_SEC.PKG_USUARIOS.
import { NextResponse } from "next/server";
import { ejecutar, exigir, leerJson, ruta, sesionDe } from "@/lib/servidor/oracle";

export const GET = ruta(async (req) => {
  const s = sesionDe(req);
  exigir(s, "administrar");
  const r = await ejecutar(s, "SELECT * FROM UNIV_SEC.V_USUARIOS ORDER BY username");
  return NextResponse.json(r.rows);
});

export const POST = ruta(async (req) => {
  const s = sesionDe(req);
  exigir(s, "administrar");
  const c = await leerJson(req);
  await ejecutar(s, "BEGIN UNIV_SEC.PKG_USUARIOS.crear(:u, :p, :r); END;", {
    u: String(c.usuario ?? ""),
    p: String(c.password ?? ""),
    r: String(c.rol ?? ""),
  });
  return NextResponse.json({ ok: true }, { status: 201 });
});
