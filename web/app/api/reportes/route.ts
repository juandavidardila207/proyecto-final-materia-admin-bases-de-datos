import { NextResponse } from "next/server";
import { ruta, sesionDe } from "@/lib/servidor/oracle";
import { reportes } from "@/lib/servidor/datos";

export const GET = ruta(async (req) => {
  sesionDe(req);
  return NextResponse.json(reportes());
});
