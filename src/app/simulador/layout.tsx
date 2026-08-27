import type { Metadata } from "next";

// Mesmo motivo de src/app/login/layout.tsx: simulador/page.tsx é "use
// client" (estado do wizard/resultado), só o título da aba muda aqui.
export const metadata: Metadata = { title: "Simulador — Real Tech" };

export default function SimuladorLayout({ children }: LayoutProps<"/simulador">) {
  return children;
}
