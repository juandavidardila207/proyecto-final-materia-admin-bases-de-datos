import type { Metadata } from "next";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LayoutLogin({ children }: LayoutProps<"/login">) {
  return children;
}
