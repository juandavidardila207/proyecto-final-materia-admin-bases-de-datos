import { NextResponse } from "next/server";
import { cerrarSesion, ruta } from "@/lib/servidor/oracle";

export const POST = ruta(async (req) => {
  await cerrarSesion(req.cookies.get("sid")?.value);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("sid", "", { httpOnly: true, sameSite: "strict", path: "/", maxAge: 0 });
  return res;
});
