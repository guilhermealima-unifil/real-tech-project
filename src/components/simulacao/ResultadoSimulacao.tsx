"use client";

import { useRef } from "react";
import { useSimulation } from "@/state/SimulationProvider";
import type { CenarioRepasse, ResultadoAno } from "@/lib/motor";
import { FaixaViavelChart } from "@/components/FaixaViavelChart";
import { ImpactoCaixaChart } from "@/components/ImpactoCaixaChart";
import { PainelRecomendacao } from "@/components/PainelRecomendacao";
import { ResumoResultado } from "./ResumoResultado";
import { AnaliseDesconto } from "./AnaliseDesconto";

const CENARIOS: { valor: CenarioRepasse; rotulo: string }[] = [
  { valor: "integral", rotulo: "Repasse integral" },
  { valor: "gradual", rotulo: "Repasse gradual" },
  { valor: "absorcao", rotulo: "Absorção" },
];

/**
 * Área de resultado — destino da simulação, não uma quarta etapa de
 * formulário (ver CLAUDE.md). Reaproveita FaixaViavelChart, PainelRecomendacao
 * e ImpactoCaixaChart sem alteração; só quem monta os dados mudou de lugar.
 */
export function ResultadoSimulacao() {
  const {
    state,
    selecionarCenario,
    selecionarAno,
    alterarDescontoPedido,
    irParaEtapa,
    novaSimulacao,
  } = useSimulation();
  const { resultado, ui } = state;

  const tabsCenarioRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Salvaguarda: SimuladorPage só monta este componente quando `resultado`
  // existe (ver page.tsx). Sem isso o TS não estreita `resultado` abaixo.
  if (!resultado) return null;

  const resultados = resultado.cenarios[ui.cenarioSelecionado];
  const cenarioIrrelevante = resultado.formulaTipo === "markup";
  const resultadoSelecionado: ResultadoAno | null =
    resultados.find((r) => r.ano === ui.anoSelecionado) ?? null;
  const impactoCaixaSelecionado =
    resultado.impactoCaixa?.find((r) => r.ano === ui.anoSelecionado) ?? null;

  function onCenarioTabKeyDown(
    evento: React.KeyboardEvent<HTMLButtonElement>,
    indice: number,
  ) {
    if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
    evento.preventDefault();
    const delta = evento.key === "ArrowRight" ? 1 : -1;
    const proximoIndice = (indice + delta + CENARIOS.length) % CENARIOS.length;
    selecionarCenario(CENARIOS[proximoIndice].valor);
    tabsCenarioRef.current[proximoIndice]?.focus();
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Resultado da simulação
          {resultado.ramo ? ` — ${resultado.ramo.rotulo}` : ""}.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => irParaEtapa("operacao")}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Editar dados
          </button>
          <button
            type="button"
            onClick={novaSimulacao}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            Nova simulação
          </button>
        </div>
      </div>

      {resultadoSelecionado && <ResumoResultado resultado={resultadoSelecionado} />}

      <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Faixa viável — 2026 a 2033
          </h2>
        </div>

        <div
          className="mb-2 flex gap-2"
          role="tablist"
          aria-label="Cenário de repasse"
        >
          {CENARIOS.map((cenario, indice) => (
            <button
              key={cenario.valor}
              ref={(el) => {
                tabsCenarioRef.current[indice] = el;
              }}
              id={`tab-cenario-${cenario.valor}`}
              type="button"
              role="tab"
              aria-selected={ui.cenarioSelecionado === cenario.valor}
              aria-controls="painel-cenario"
              aria-disabled={cenarioIrrelevante}
              tabIndex={ui.cenarioSelecionado === cenario.valor ? 0 : -1}
              disabled={cenarioIrrelevante}
              onClick={() => selecionarCenario(cenario.valor)}
              onKeyDown={(e) => onCenarioTabKeyDown(e, indice)}
              className={
                cenarioIrrelevante
                  ? "cursor-not-allowed rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-400 dark:border-zinc-800 dark:text-zinc-600"
                  : ui.cenarioSelecionado === cenario.valor
                    ? "rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                    : "rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              }
            >
              {cenario.rotulo}
            </button>
          ))}
        </div>
        {cenarioIrrelevante && (
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
            Cenário de repasse não se aplica ao modelo de markup — nesse modelo
            o preço já é fixo por definição (custo × (1 + markup)); quem varia
            é o lucro líquido, não o preço.
          </p>
        )}

        <div
          id="painel-cenario"
          role="tabpanel"
          aria-labelledby={`tab-cenario-${ui.cenarioSelecionado}`}
        >
          <FaixaViavelChart
            resultados={resultados}
            anoSelecionado={ui.anoSelecionado}
            onSelecionarAno={selecionarAno}
          />
        </div>
      </section>

      <PainelRecomendacao
        resultado={resultadoSelecionado}
        resultados={resultados}
        descontoPedidoPct={ui.descontoPedidoPct}
        onDescontoPedidoChange={alterarDescontoPedido}
      />

      {resultadoSelecionado && (
        <AnaliseDesconto
          resultado={resultadoSelecionado}
          custoCompra={resultado.custoCompra}
          descontoPedidoPct={ui.descontoPedidoPct}
        />
      )}

      {resultado.impactoCaixa && resultado.impactoCaixa.length > 0 && (
        <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Impacto no caixa — crédito da compra, ano a ano
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Não é só quanto se paga de imposto, é quando esse crédito fica
            disponível. Verde: já protegido pelo split payment. Âmbar: ainda
            depende do fornecedor recolher.
          </p>

          <div className="mt-4">
            <ImpactoCaixaChart
              resultados={resultado.impactoCaixa}
              anoSelecionado={ui.anoSelecionado}
              onSelecionarAno={selecionarAno}
            />
          </div>

          {impactoCaixaSelecionado && (
            <p className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {impactoCaixaSelecionado.mensagemRecomendacao}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
