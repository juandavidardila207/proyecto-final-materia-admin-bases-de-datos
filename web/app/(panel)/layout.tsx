"use client";

import { Loader2 } from "lucide-react";
import { Panel } from "@/components/panel";
import { SesionProvider } from "@/components/sesion";

export default function LayoutPanel({ children }: { children: React.ReactNode }) {
  return (
    <SesionProvider
      cargando={
        <div className="flex min-h-svh items-center justify-center text-muted-foreground" aria-busy="true">
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> Cargando…
        </div>
      }
    >
      <Panel>{children}</Panel>
    </SesionProvider>
  );
}
