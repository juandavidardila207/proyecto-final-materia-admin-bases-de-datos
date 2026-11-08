import { NextResponse } from "next/server";
import { ErrorHttp, ejecutar, exigir, ruta, sesionDe } from "@/lib/servidor/oracle";

const CONSULTAS: Record<string, string> = {
  // Bitácora propia: valores antes/después de cada fila
  cambios: `
    SELECT fecha, usuario_bd, ip_cliente, operacion, tabla, id_registro, antes, despues
    FROM UNIV_SEC.BITACORA ORDER BY id_evento DESC FETCH FIRST 200 ROWS ONLY`,
  // Auditoría unificada de Oracle
  unificada: `
    SELECT event_timestamp AS fecha, dbusername, action_name, object_schema, object_name,
           return_code, unified_audit_policies AS politica
    FROM unified_audit_trail
    WHERE unified_audit_policies LIKE '%POL_UNIV%'
    ORDER BY event_timestamp DESC FETCH FIRST 200 ROWS ONLY`,
};

export const GET = ruta(async (req, ctx: RouteContext<"/api/auditoria/[tipo]">) => {
  const s = sesionDe(req);
  exigir(s, "auditar");
  const { tipo } = await ctx.params;
  const sql = Object.hasOwn(CONSULTAS, tipo) ? CONSULTAS[tipo] : undefined;
  if (!sql) throw new ErrorHttp(404, "Ruta no encontrada.");
  return NextResponse.json((await ejecutar(s, sql)).rows);
});
