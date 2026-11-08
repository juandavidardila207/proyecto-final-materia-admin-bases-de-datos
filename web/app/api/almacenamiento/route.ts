import { NextResponse } from "next/server";
import { ejecutar, exigir, ruta, sesionDe } from "@/lib/servidor/oracle";

export const GET = ruta(async (req) => {
  const s = sesionDe(req);
  exigir(s, "administrar");
  const [t, seg, b] = await Promise.all([
    ejecutar(s, "SELECT * FROM UNIV_SEC.V_TABLESPACES ORDER BY tablespace_name"),
    ejecutar(s, "SELECT * FROM UNIV_SEC.V_SEGMENTOS ORDER BY tablespace_name, segmento"),
    ejecutar(
      s,
      "SELECT fecha, tipo, detalle, tamano_mb, estado FROM UNIV_SEC.HISTORIAL_BACKUPS ORDER BY id_backup DESC FETCH FIRST 30 ROWS ONLY",
    ),
  ]);
  return NextResponse.json({ tablespaces: t.rows, segmentos: seg.rows, backups: b.rows });
});
