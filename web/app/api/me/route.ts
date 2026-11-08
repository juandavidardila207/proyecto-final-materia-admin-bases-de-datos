import { NextResponse } from "next/server";
import { ruta, sesionDe } from "@/lib/servidor/oracle";

export const GET = ruta(async (req) => {
  const { usuario, rol, permisos } = sesionDe(req);
  return NextResponse.json({ usuario, rol, permisos });
});
