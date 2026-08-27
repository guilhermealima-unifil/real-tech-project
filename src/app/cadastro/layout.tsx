import type { Metadata } from "next";

// Mesmo motivo de src/app/login/layout.tsx: cadastro/page.tsx é "use
// client", só o título da aba muda aqui.
export const metadata: Metadata = { title: "Criar conta — Real Tech" };

export default function CadastroLayout({ children }: LayoutProps<"/cadastro">) {
  return children;
}
