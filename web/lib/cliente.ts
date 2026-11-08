// Utilidades del navegador: llamadas a la API y formato de valores.
"use client";

export type Permisos = { escribir: boolean; auditar: boolean; administrar: boolean };
export type Yo = { usuario: string; rol: string; permisos: Permisos };
export type Fila = Record<string, unknown>;
export type Resultado = { columnas: string[]; filas: unknown[][] };

export class ErrorApi extends Error {
  constructor(mensaje: string, public estado: number) {
    super(mensaje);
  }
}

export const EVENTO_SESION_EXPIRADA = "univ:sesion-expirada";

export async function api<T = unknown>(
  ruta: string,
  { metodo = "GET", cuerpo }: { metodo?: string; cuerpo?: unknown } = {},
): Promise<T> {
  let r: Response;
  try {
    r = await fetch(`/api${ruta}`, {
      method: metodo,
      headers: cuerpo !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ErrorApi("No hay conexión con el servidor de la aplicación.", 0);
  }
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && ruta !== "/login") window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    throw new ErrorApi(datos.error || "No se pudo completar la operación.", r.status);
  }
  return datos as T;
}

export const mensajeDe = (e: unknown) => (e instanceof Error ? e.message : "Ocurrió un error inesperado.");

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;
const formatoFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "short", timeStyle: "medium" });

export function texto(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" && FECHA_ISO.test(v)) return formatoFecha.format(new Date(v));
  return String(v);
}

export const nombreRol = (r?: string | null) => (r ?? "").replace("ROL_UNIV_", "").toLowerCase() || "—";

export const ROLES = [
  { valor: "ROL_UNIV_CONSULTA", texto: "Consulta", ayuda: "solo lectura" },
  { valor: "ROL_UNIV_OPERADOR", texto: "Operador", ayuda: "lectura y cambios" },
  { valor: "ROL_UNIV_AUDITOR", texto: "Auditor", ayuda: "lectura y auditoría" },
  { valor: "ROL_UNIV_ADMIN", texto: "Administrador", ayuda: "todo, más usuarios" },
];

export function descargarCsv(nombre: string, { columnas, filas }: Resultado) {
  const celda = (v: unknown) => `"${texto(v).replaceAll('"', '""')}"`;
  const csv = [columnas.map(celda).join(","), ...filas.map((f) => f.map(celda).join(","))].join("\r\n");
  const url = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}
