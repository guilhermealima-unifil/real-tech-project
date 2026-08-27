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
import { MenuUsuario } from "./MenuUsuario";

const ICONES: Record<IconeNavegacao, typeof IconeSimulador> = {
  home: IconeHome,
  simulador: IconeSimulador,
  historico: IconeHistorico,
};

const ITEM_BASE =
  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
const ITEM_ATIVO = "bg-primary/10 text-primary";
const ITEM_INATIVO = "text-text-secondary hover:bg-background hover:text-text-primary";

/**
 * Sidebar desktop (`lg:` e acima — ver AppShell.tsx) — navegação principal
 * do shell, substitui o antigo Header horizontal (ver CLAUDE.md desta
 * etapa, Parte 11: "não deixe Header + Sidebar ao mesmo tempo").
 *
 * `fixed` de propósito (altura total da viewport, independente do scroll
 * do conteúdo) — o wrapper de conteúdo em AppShell.tsx reserva o mesmo
 * `w-60` como `padding-left`, então os dois nunca podem divergir de
 * largura sem os dois arquivos serem editados juntos (documentado nos
 * dois lados).
 */
export function Sidebar() {
  const pathname = usePathname();
  const { status } = useAuth();
  const autenticado = status === "autenticado";

  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-60 flex-col border-r border-border bg-surface lg:flex">
      <div className="px-5 py-5">
        <Link href="/" className="text-base font-semibold tracking-tight text-text-primary">
          <span className="text-primary">Real</span> Tech
        </Link>
      </div>

      <nav aria-label="Navegação principal" className="flex flex-1 flex-col gap-1 px-3">
        {ITENS_NAVEGACAO_PRINCIPAL.map((item) => {
          const ativo = itemNavegacaoAtivo(pathname, item.href);
          const Icone = ICONES[item.icone];
          return (
            <Link
              key={item.href}
              href={hrefEfetivo(item, autenticado)}
              aria-current={ativo ? "page" : undefined}
              className={ITEM_BASE + " " + (ativo ? ITEM_ATIVO : ITEM_INATIVO)}
            >
              <Icone className="h-4 w-4 shrink-0" />
              {item.rotulo}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <MenuUsuario variante="sidebar" />
      </div>
    </aside>
  );
}
