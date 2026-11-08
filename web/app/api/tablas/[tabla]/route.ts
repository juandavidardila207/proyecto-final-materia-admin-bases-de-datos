import { NextResponse } from "next/server";
import { ejecutar, leerJson, ruta, sesionDe } from "@/lib/servidor/oracle";
import { definicion, valoresDelFormulario } from "@/lib/servidor/datos";

type Ctx = RouteContext<"/api/tablas/[tabla]">;

export const GET = ruta(async (req, ctx: Ctx) => {
  const s = sesionDe(req);
  const d = definicion((await ctx.params).tabla);
  const p = req.nextUrl.searchParams;
  const tam = Math.min(Math.max(Number(p.get("tam")) || 15, 1), 100);
  const pagina = Math.max(Number(p.get("pagina")) || 1, 1);
  const q = (p.get("q") ?? "").trim().toUpperCase();
  const dir = p.get("dir") === "desc" ? "DESC" : "ASC";
  const pedido = p.get("orden") ?? "";
  const orden = (Object.hasOwn(d.orden, pedido) && d.orden[pedido]) || d.orden[d.pk];
  const where = q ? ` WHERE ${d.filtro} LIKE :q` : "";
  const binds = q ? { q: `%${q}%` } : {};

  const total = await ejecutar<{ N: number }>(s, `SELECT COUNT(*) AS n FROM (${d.select}${where})`, binds);
  const datos = await ejecutar(
    s,
    `${d.select}${where} ORDER BY ${orden} ${dir}, t.${d.pk} OFFSET :salto ROWS FETCH NEXT :tam ROWS ONLY`,
    { ...binds, salto: (pagina - 1) * tam, tam },
  );
  return NextResponse.json({ total: total.rows?.[0].N ?? 0, pagina, tam, filas: datos.rows });
});

export const POST = ruta(async (req, ctx: Ctx) => {
  const s = sesionDe(req);
  const d = definicion((await ctx.params).tabla);
  const cols = Object.keys(d.columnas);
  const binds = valoresDelFormulario(d, await leerJson(req), cols);
  await ejecutar(
    s,
    `INSERT INTO ${d.tabla} (${cols.join(",")}) VALUES (${cols.map((c) => `:${c}`).join(",")})`,
    binds,
  );
  return NextResponse.json({ ok: true }, { status: 201 });
});
