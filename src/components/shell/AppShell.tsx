"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { BarraSuperiorMobile } from "./BarraSuperiorMobile";

// /login e /cadastro são telas de entrada — não mostram sidebar/bottom nav
// (ver CLAUDE.md desta etapa, Parte 13). Lista pequena e fixa: checar aqui
// num shell client-side é mais simples do que reorganizar src/app em
// route groups só para isso (pedido explícito para preferir a solução
// menor quando ela já resolve).
const ROTAS_SEM_SHELL = new Set(["/login", "/cadastro"]);

/**
 * Shell global da aplicação — Sidebar (desktop, `lg:` e acima) + BottomNav
 * (mobile/tablet estreito, abaixo de `lg:`) substituem o antigo Header
 * horizontal (ver src/components/shell/Header.tsx, removido nesta etapa).
 * `usePathname()` decide se a rota atual mostra a navegação completa ou
 * fica de fora dela (login/cadastro).
 *
 * Padding do conteúdo: `lg:pl-60` reserva exatamente a largura da Sidebar
 * (`w-60`, ver Sidebar.tsx — os dois precisam ficar em sincronia);
 * `pb-24 lg:pb-10` garante que o conteúdo nunca fique escondido atrás da
 * BottomNav fixa no mobile (Parte 10, obrigatório) sem desperdiçar esse
 * espaço no desktop, onde a BottomNav nem existe.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (ROTAS_SEM_SHELL.has(pathname)) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[840px] flex-1 flex-col px-6">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-col lg:pl-60">
        <BarraSuperiorMobile />
        <main className="mx-auto flex w-full max-w-[840px] flex-1 flex-col gap-8 px-6 py-10 pb-24 lg:pb-10">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
