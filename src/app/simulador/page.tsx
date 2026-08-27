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
 *
 * Cabeçalho institucional ("Real Tech — faixa viável de preço na transição
 * IBS/CBS" + subtítulo) saiu daqui — pertence à Home (src/app/page.tsx,
 * onde continua intocado), não a uma página de trabalho. No lugar, um
 * título funcional ("Simulador") com o ramo da simulação atual como
 * contexto secundário logo abaixo — antes esse mesmo texto de ramo vivia
 * solto dentro de `ResultadoSimulacao`, sem associação visual com título
 * nenhum. Antes do resultado (ainda no wizard), o ramo já selecionado no
 * formulário serve de fallback, para o contexto não desaparecer e reaparecer
 * conforme o usuário avança — nenhum dado novo, só leitura do que
 * `state.form`/`state.catalogo` já guardam.
 */
export default function SimuladorPage() {
  const { state } = useSimulation();
  const parametrosInfo = state.catalogo.parametros[0] ?? null;
  const emResultado = state.ui.etapaAtual === "resultado" && state.resultado !== null;
  const ramoAtual = emResultado
    ? (state.resultado?.ramo?.rotulo ?? null)
    : (state.catalogo.ramos.find((r) => r.id === state.form.ramoId)?.rotulo ?? null);

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Simulador</h1>
        {ramoAtual && <p className="mt-1 text-sm text-text-secondary">{ramoAtual}</p>}
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
