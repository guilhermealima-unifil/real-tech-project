import type { Metadata } from "next";

// login/page.tsx é "use client" (formulário interativo) — Client
// Components não podem exportar `metadata`. Este layout existe só para o
// título da aba; não adiciona markup nenhum além de `children`.
export const metadata: Metadata = { title: "Entrar — Real Tech" };

export default function LoginLayout({ children }: LayoutProps<"/login">) {
  return children;
}
