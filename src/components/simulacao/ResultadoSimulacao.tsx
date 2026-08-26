"use client";

import { useRef } from "react";
import { useSimulation } from "@/state/SimulationProvider";
import type { CenarioRepasse, ResultadoAno } from "@/lib/motor";
import { FaixaViavelChart } from "@/components/FaixaViavelChart";
import { ImpactoCaixaChart } from "@/components/ImpactoCaixaChart";
import { ResumoResultado } from "./ResumoResultado";
import { AnaliseDesconto } from "./AnaliseDesconto";

const CENARIOS: { valor: CenarioRepasse; rotulo: string }[] = [
  { valor: "integral", rotulo: "Repasse integral" },
  { valor: "gradual", rotulo: "Repasse gradual" },
  { valor: "absorcao", rotulo: "Absorção" },
];

/**
 * Área de resultado — destino da simulação, não uma quarta etapa de
 * formulário (ver CLAUDE.md). Hierarquia: decisão de preço (ResumoResultado,
 * protagonista) → contexto de cenário/ano (visível antes dos números) →
 * gráfico como evidência → negociação → impacto no caixa (rebaixado, por
 * último). PainelRecomendacao foi retirado — sua função (preço/piso/teto,
 * mensagem de recomendação) já está coberta por ResumoResultado; o slider
 * e a grade por ano viraram parte de AnaliseDesconto ("Negociação").
 * FaixaViavelChart/ImpactoCaixaChart continuam intocados, só o wrapper
 * visual ao redor mudou.
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
      {/* Barra utilitária — nome/ramo + ações, deliberadamente discretas: a
          decisão de preço abaixo é que deve chamar atenção, não isto. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <p className="text-text-secondary">
          {resultado.ramo ? resultado.ramo.rotulo : "Resultado da simulação"}
        </p>
        <div className="flex items-center gap-4 text-xs font-medium text-text-secondary">
          <button
            type="button"
            onClick={() => irParaEtapa("operacao")}
            className="underline-offset-2 hover:text-text-primary hover:underline"
          >
            Editar dados
          </button>
          <button
            type="button"
            onClick={novaSimulacao}
            className="underline-offset-2 hover:text-text-primary hover:underline"
          >
            Nova simulação
          </button>
        </div>
      </div>

      {/* Contexto — "estou olhando {ano} no cenário {X}", visível antes de
          qualquer número. Mesma lógica/estado de sempre (selecionarCenario,
          seleção de ano continua vindo do gráfico), só reposicionada. */}
      <div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Cenário</span>
          <div role="tablist" aria-label="Cenário de repasse" className="flex gap-1.5">
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
                    ? "cursor-not-allowed rounded-full border border-border px-3 py-1 text-xs font-medium text-muted"
                    : ui.cenarioSelecionado === cenario.valor
                      ? "rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      : "rounded-full border border-border px-3 py-1 text-xs font-medium text-text-secondary hover:border-text-secondary"
                }
              >
                {cenario.rotulo}
              </button>
            ))}
          </div>
          <span aria-hidden="true" className="text-muted">
            ·
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Ano {ui.anoSelecionado}
          </span>
        </div>
        {cenarioIrrelevante && (
          <p className="mt-2 text-xs text-text-secondary">
            Cenário de repasse não se aplica ao modelo de markup — o preço já é fixo por definição
            (custo × (1 + markup)); quem varia é o lucro líquido, não o preço.
          </p>
        )}
      </div>

      {/* Decisão — quanto cobrar. */}
      {resultadoSelecionado && <ResumoResultado resultado={resultadoSelecionado} />}

      {/* Evidência — o gráfico confirma visualmente o que o resumo já
          disse em texto, não é a primeira coisa que o usuário interpreta. */}
      <section
        id="painel-cenario"
        role="tabpanel"
        aria-labelledby={`tab-cenario-${ui.cenarioSelecionado}`}
        className="rounded-xl border border-border bg-surface p-6 sm:p-8"
      >
        <h2 className="text-base font-semibold text-text-primary">Faixa viável — 2026 a 2033</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Piso, teto e preço ano a ano, no cenário selecionado acima.
        </p>
        <div className="mt-4">
          <FaixaViavelChart
            resultados={resultados}
            anoSelecionado={ui.anoSelecionado}
            onSelecionarAno={selecionarAno}
          />
        </div>
      </section>

      {/* Segunda decisão — até quanto negociar. */}
      {resultadoSelecionado && (
        <AnaliseDesconto
          resultado={resultadoSelecionado}
          resultados={resultados}
          custoCompra={resultado.custoCompra}
          descontoPedidoPct={ui.descontoPedidoPct}
          onDescontoPedidoChange={alterarDescontoPedido}
        />
      )}

      {/* Análise secundária — informa, não decide o preço; por isso vem
          por último e sem a mesma superfície de card das seções acima. */}
      {resultado.impactoCaixa && resultado.impactoCaixa.length > 0 && (
        <section className="border-t border-border pt-8">
          <h2 className="text-base font-semibold text-text-primary">
            Impacto no caixa — crédito da compra, ano a ano
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Não é só quanto se paga de imposto, é quando esse crédito fica disponível. Verde: já
            protegido pelo split payment. Âmbar: ainda depende do fornecedor recolher.
          </p>

          <div className="mt-4">
            <ImpactoCaixaChart
              resultados={resultado.impactoCaixa}
              anoSelecionado={ui.anoSelecionado}
              onSelecionarAno={selecionarAno}
            />
          </div>

          {impactoCaixaSelecionado && (
            <p className="mt-4 rounded-lg bg-background p-3 text-sm text-text-secondary">
              {impactoCaixaSelecionado.mensagemRecomendacao}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
