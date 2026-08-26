"use client";

import Link from "next/link";
import { useSimulation } from "@/state/SimulationProvider";

/**
 * Header global do shell (Real Tech Identity — ver docs/06-design-system.md).
 * "Histórico" e "Como funciona" ainda não existem: aparecem como texto
 * simples com selo "em breve", nunca como link/botão — não há rota para
 * apontar, e um controle desabilitado fingindo ser navegação é pior do que
 * nenhum controle. "Simulador" é o único item real, apontando para "/".
 */
export function Header() {
  const { state, novaSimulacao } = useSimulation();
  const emResultado = state.ui.etapaAtual === "resultado" && state.resultado !== null;

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-[840px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4">
        <Link href="/" className="shrink-0 text-base font-semibold tracking-tight text-text-primary">
          <span className="text-primary">Real</span> Tech
        </Link>

        <nav aria-label="Principal" className="flex flex-1 flex-wrap items-center gap-1 text-sm">
          <Link
            href="/"
            aria-current="page"
            className="rounded-md bg-primary/10 px-3 py-1.5 font-medium text-primary"
          >
            Simulador
          </Link>
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-muted">
            Histórico
            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
              em breve
            </span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-muted">
            Como funciona
            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
              em breve
            </span>
          </span>
        </nav>

        {/* Só aparece com um resultado fechado na tela — durante o wizard,
            "nova simulação" já é o estado atual (ambíguo, potencialmente
            destrutivo de dados que o usuário acabou de digitar). Reaproveita
            novaSimulacao() do SimulationProvider, mesma ação do botão que já
            existe em ResultadoSimulacao — nenhuma lógica de reset nova. */}
        {emResultado && (
          <button
            type="button"
            onClick={novaSimulacao}
            className="shrink-0 rounded-md bg-text-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90"
          >
            + Nova simulação
          </button>
        )}
      </div>
    </header>
  );
}
