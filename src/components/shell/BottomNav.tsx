"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/state/AuthProvider";
import {
  hrefEfetivo,
  itemNavegacaoAtivo,
  ITENS_NAVEGACAO_PRINCIPAL,
  type IconeNavegacao,
} from "./navegacaoPrincipal";
import { IconeHistorico, IconeHome, IconeSimulador } from "./icones";

const ICONES: Record<IconeNavegacao, typeof IconeSimulador> = {
  home: IconeHome,
  simulador: IconeSimulador,
  historico: IconeHistorico,
};

/**
 * Navegação inferior fixa — abaixo de `lg:` (ver AppShell.tsx), substitui
 * a Sidebar nessa faixa de largura. Só os destinos principais (ver
 * CLAUDE.md desta etapa, Parte 8: "não use labels muito longos" — por
 * isso `rotuloCurto`); "Sair"/conta NÃO entra aqui (Parte 9), fica na
 * BarraSuperiorMobile via o mesmo MenuUsuario da Sidebar.
 *
 * `pb-[env(safe-area-inset-bottom)]` — respeita a faixa de gestos do
 * iOS/Android sem depender de nenhuma lib; o conteúdo da página ganha
 * `padding-bottom` equivalente em AppShell.tsx para nunca ficar escondido
 * atrás desta barra (Parte 10, obrigatório).
 */
export function BottomNav() {
  const pathname = usePathname();
  const { status } = useAuth();
  const autenticado = status === "autenticado";

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {ITENS_NAVEGACAO_PRINCIPAL.map((item) => {
        const ativo = itemNavegacaoAtivo(pathname, item.href);
        const Icone = ICONES[item.icone];
        return (
          <Link
            key={item.href}
            href={hrefEfetivo(item, autenticado)}
            aria-current={ativo ? "page" : undefined}
            className={
              "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors " +
              (ativo ? "text-primary" : "text-text-secondary hover:text-text-primary")
            }
          >
            <Icone className="h-5 w-5" />
            {item.rotuloCurto ?? item.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
