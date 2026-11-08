import { NextResponse } from "next/server";
import { ErrorHttp, iniciarSesion, leerJson, ruta } from "@/lib/servidor/oracle";

export const POST = ruta(async (req) => {
  const cuerpo = await leerJson(req);
  const usuario = String(cuerpo.usuario ?? "").trim();
  const password = String(cuerpo.password ?? "");
  if (!usuario || !password) throw new ErrorHttp(400, "Escribe tu usuario y contraseña.");

  const { sid, sesion } = await iniciarSesion(usuario, password);
  const res = NextResponse.json({ usuario: sesion.usuario, rol: sesion.rol, permisos: sesion.permisos });
  res.cookies.set("sid", sid, { httpOnly: true, sameSite: "strict", path: "/", maxAge: 8 * 60 * 60 });
  return res;
});
