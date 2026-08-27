"use client";

import { useSimulation } from "@/state/SimulationProvider";
import { SimulacaoWizard } from "@/components/simulacao/SimulacaoWizard";
import { ResultadoSimulacao } from "@/components/simulacao/ResultadoSimulacao";

/**
 * Orquestrador do simulador: só decide entre mostrar o wizard de coleta ou
 * a área de resultado. Fundo, navegação (sidebar/bottom nav) e largura
 * máxima vêm do shell global (src/app/layout.tsx + src/components/shell/AppShell.tsx)
 * — esta página cuida só do próprio conteúdo.
 *
 * Mora em `/simulador`, não em `/` (ver src/app/page.tsx — hoje só um
 * redirect para cá): a navegação global desta etapa precisa de um destino
 * "Simulador" que não seja o mesmo de uma futura Home/Dashboard (ainda não
 * implementada), então o simulador passou a viver na sua própria rota.
 */
export default function SimuladorPage() {
  const { state } = useSimulation();
  const parametrosInfo = state.catalogo.parametros[0] ?? null;
  const emResultado = state.ui.etapaAtual === "resultado" && state.resultado !== null;

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Real Tech — faixa viável de preço na transição IBS/CBS
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Custo, margem mínima e preço da praça: onde seu preço pode viver em
          cada ano, de 2026 a 2033.
        </p>
      </header>

      {emResultado ? <ResultadoSimulacao /> : <SimulacaoWizard />}

      {parametrosInfo && (
        <footer className="text-xs text-muted">
          Parâmetros tributários vigentes desde{" "}
          {new Date(parametrosInfo.vigencia).toLocaleDateString("pt-BR")} —{" "}
          {parametrosInfo.fonte}
        </footer>
      )}
    </>
  );
}
