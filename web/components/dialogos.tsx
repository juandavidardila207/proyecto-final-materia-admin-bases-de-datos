"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mensajeDe } from "@/lib/cliente";

// Formulario en un diálogo. El error de Oracle se muestra dentro, sin cerrar el diálogo.
export function DialogoFormulario({
  abierto,
  alCambiar,
  titulo,
  descripcion,
  confirmar = "Guardar",
  alEnviar,
  children,
}: {
  abierto: boolean;
  alCambiar: (abierto: boolean) => void;
  titulo: string;
  descripcion?: string;
  confirmar?: string;
  alEnviar: () => Promise<void>;
  children: ReactNode;
}) {
  const [error, setError] = useState<string>();
  const [enviando, setEnviando] = useState(false);

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    setEnviando(true);
    setError(undefined);
    try {
      await alEnviar();
      alCambiar(false);
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(v) => {
        if (!v) setError(undefined);
        alCambiar(v);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <form onSubmit={enviar} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            {descripcion && <DialogDescription>{descripcion}</DialogDescription>}
          </DialogHeader>
          <div className="grid gap-4">{children}</div>
          {error && (
            <Alert variant="destructive" role="alert">
              <AlertCircle />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => alCambiar(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando}>
              {enviando && <Loader2 className="animate-spin" aria-hidden />}
              {confirmar}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Confirmación de acciones destructivas.
export function DialogoConfirmar({
  abierto,
  alCambiar,
  titulo,
  descripcion,
  confirmar,
  alConfirmar,
}: {
  abierto: boolean;
  alCambiar: (abierto: boolean) => void;
  titulo: string;
  descripcion: string;
  confirmar: string;
  alConfirmar: () => Promise<void>;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string>();

  return (
    <AlertDialog
      open={abierto}
      onOpenChange={(v) => {
        if (!v) setError(undefined);
        alCambiar(v);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <Alert variant="destructive" role="alert">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={enviando}
            onClick={async (ev) => {
              ev.preventDefault();
              setEnviando(true);
              setError(undefined);
              try {
                await alConfirmar();
                alCambiar(false);
              } catch (e) {
                setError(mensajeDe(e));
              } finally {
                setEnviando(false);
              }
            }}
          >
            {enviando && <Loader2 className="animate-spin" aria-hidden />}
            {confirmar}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
