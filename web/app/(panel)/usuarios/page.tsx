"use client";

import { useState } from "react";
import { KeyRound, Lock, LockOpen, MoreHorizontal, Plus, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CajaError, Cargando, Encabezado, Estado, TablaDatos } from "@/components/comunes";
import { DialogoConfirmar, DialogoFormulario } from "@/components/dialogos";
import { RequierePermiso } from "@/components/requiere-permiso";
import { useDatos, useSesion } from "@/components/sesion";
import { api, mensajeDe, nombreRol, ROLES, texto } from "@/lib/cliente";

type Usuario = { USERNAME: string; ACCOUNT_STATUS: string; ROL: string | null; ULTIMO_ACCESO: string | null; CREADO: string };
type Accion = { tipo: "crear" } | { tipo: "rol" | "clave" | "eliminar"; u: Usuario };

const AYUDA_CLAVE = "Mínimo 10 caracteres, con mayúscula, minúscula, número y símbolo. No puede contener el nombre de usuario.";

export default function Pagina() {
  return (
    <RequierePermiso permiso="administrar">
      <Usuarios />
    </RequierePermiso>
  );
}

function SelectorRol({ id, valor, alCambiar }: { id: string; valor: string; alCambiar: (v: string) => void }) {
  return (
    <Select value={valor} onValueChange={alCambiar} required>
      <SelectTrigger id={id} className="w-full">
        <SelectValue placeholder="Selecciona un rol" />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r.valor} value={r.valor}>
            {r.texto} <span className="text-muted-foreground">· {r.ayuda}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function Usuarios() {
  const { yo } = useSesion();
  const { datos, error, cargando, recargar } = useDatos<Usuario[]>("/usuarios");
  const [accion, setAccion] = useState<Accion | null>(null);
  const [form, setForm] = useState({ usuario: "U_", password: "", rol: "" });
  const cerrar = () => setAccion(null);
  const hecho = (msg: string) => {
    toast.success(msg);
    recargar();
  };

  async function alternarBloqueo(u: Usuario) {
    const bloquear = !u.ACCOUNT_STATUS.includes("LOCKED");
    try {
      await api(`/usuarios/${u.USERNAME}/bloqueo`, { metodo: "POST", cuerpo: { bloquear } });
      hecho(bloquear ? `${u.USERNAME} bloqueado.` : `${u.USERNAME} desbloqueado.`);
    } catch (e) {
      toast.error(mensajeDe(e));
    }
  }

  function abrir(a: Accion) {
    setForm({ usuario: "U_", password: "", rol: a.tipo === "rol" ? a.u.ROL ?? "" : "" });
    setAccion(a);
  }

  return (
    <>
      <Encabezado
        titulo="Usuarios"
        descripcion="Cuentas reales de Oracle con prefijo U_. Solo se gestionan a través del paquete UNIV_SEC.PKG_USUARIOS."
      >
        <Button onClick={() => abrir({ tipo: "crear" })}>
          <Plus aria-hidden /> Nuevo usuario
        </Button>
      </Encabezado>

      {error && <CajaError mensaje={error} />}
      {cargando && !datos && <Cargando />}
      {datos && (
        <Card>
          <CardContent>
            <TablaDatos
              filas={datos}
              clave={(u) => u.USERNAME}
              columnas={[
                { titulo: "Usuario", celda: (u) => <span className="font-mono">{u.USERNAME}</span> },
                { titulo: "Rol", celda: (u) => <span className="capitalize">{nombreRol(u.ROL)}</span> },
                {
                  titulo: "Estado",
                  celda: (u) =>
                    u.ACCOUNT_STATUS === "OPEN" ? (
                      <Estado tono="exito">Activo</Estado>
                    ) : u.ACCOUNT_STATUS.includes("LOCKED") ? (
                      <Estado tono="error">Bloqueado</Estado>
                    ) : (
                      <Estado tono="aviso">{u.ACCOUNT_STATUS}</Estado>
                    ),
                },
                { titulo: "Último acceso", celda: (u) => texto(u.ULTIMO_ACCESO) || "Nunca" },
                {
                  titulo: <span className="sr-only">Acciones</span>,
                  className: "w-12",
                  celda: (u) => {
                    const propio = u.USERNAME === yo.usuario;
                    const bloqueado = u.ACCOUNT_STATUS.includes("LOCKED");
                    return (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label={`Acciones para ${u.USERNAME}`}>
                            <MoreHorizontal aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem disabled={propio} onSelect={() => abrir({ tipo: "rol", u })}>
                            <UserCog aria-hidden /> Cambiar rol
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => abrir({ tipo: "clave", u })}>
                            <KeyRound aria-hidden /> Restablecer contraseña
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled={propio && !bloqueado} onSelect={() => alternarBloqueo(u)}>
                            {bloqueado ? <LockOpen aria-hidden /> : <Lock aria-hidden />}
                            {bloqueado ? "Desbloquear" : "Bloquear"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" disabled={propio} onSelect={() => abrir({ tipo: "eliminar", u })}>
                            <Trash2 aria-hidden /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  },
                },
              ]}
            />
          </CardContent>
        </Card>
      )}

      <DialogoFormulario
        abierto={accion?.tipo === "crear"}
        alCambiar={(v) => !v && cerrar()}
        titulo="Nuevo usuario"
        descripcion={AYUDA_CLAVE}
        confirmar="Crear usuario"
        alEnviar={async () => {
          await api("/usuarios", { metodo: "POST", cuerpo: form });
          hecho(`Usuario ${form.usuario.toUpperCase()} creado.`);
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="nuevo-usuario">Usuario</Label>
          <Input
            id="nuevo-usuario"
            required
            autoComplete="off"
            className="font-mono uppercase"
            value={form.usuario}
            onChange={(e) => setForm({ ...form, usuario: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nuevo-clave">Contraseña</Label>
          <Input
            id="nuevo-clave"
            type="password"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="nuevo-rol">Rol</Label>
          <SelectorRol id="nuevo-rol" valor={form.rol} alCambiar={(rol) => setForm({ ...form, rol })} />
        </div>
      </DialogoFormulario>

      {accion?.tipo === "rol" && (
        <DialogoFormulario
          abierto
          alCambiar={(v) => !v && cerrar()}
          titulo={`Cambiar rol de ${accion.u.USERNAME}`}
          descripcion="El nuevo rol aplica en su próximo inicio de sesión."
          alEnviar={async () => {
            await api(`/usuarios/${accion.u.USERNAME}/rol`, { metodo: "POST", cuerpo: { rol: form.rol } });
            hecho("Rol actualizado.");
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="cambiar-rol">Rol</Label>
            <SelectorRol id="cambiar-rol" valor={form.rol} alCambiar={(rol) => setForm({ ...form, rol })} />
          </div>
        </DialogoFormulario>
      )}

      {accion?.tipo === "clave" && (
        <DialogoFormulario
          abierto
          alCambiar={(v) => !v && cerrar()}
          titulo={`Nueva contraseña para ${accion.u.USERNAME}`}
          descripcion={AYUDA_CLAVE}
          alEnviar={async () => {
            await api(`/usuarios/${accion.u.USERNAME}/password`, { metodo: "POST", cuerpo: { password: form.password } });
            hecho("Contraseña actualizada.");
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="cambiar-clave">Nueva contraseña</Label>
            <Input
              id="cambiar-clave"
              type="password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
        </DialogoFormulario>
      )}

      <DialogoConfirmar
        abierto={accion?.tipo === "eliminar"}
        alCambiar={(v) => !v && cerrar()}
        titulo={`¿Eliminar ${accion?.tipo === "eliminar" ? accion.u.USERNAME : ""}?`}
        descripcion="La cuenta se borra de Oracle. Sus registros de auditoría se conservan."
        confirmar="Eliminar"
        alConfirmar={async () => {
          if (accion?.tipo !== "eliminar") return;
          await api(`/usuarios/${accion.u.USERNAME}`, { metodo: "DELETE" });
          hecho("Usuario eliminado.");
        }}
      />
    </>
  );
}
