"use client";

/**
 * Apresentação read-only de uma simulação salva (/historico/[id]) — reusa
 * os componentes de apresentação já existentes de ResultadoSimulacao
 * (ResumoResultado, FaixaViavelChart, AnaliseDesconto, ImpactoCaixaChart),
 * que já são props-driven e não sabem de onde o dado veio. NÃO reusa
 * <ResultadoSimulacao> em si — aquele componente está acoplado a
 * useSimulation() (estado global do simulador ao vivo); forçá-lo a aceitar
 * um estado falso seria o "acoplamento artificial" que o CLAUDE.md desta
 * etapa pede para evitar. Este componente é o pequeno wrapper separado que
 * ele sugere no lugar.
 *
 * Nenhum recálculo: `simulacao.cenarios`/`impactoCaixa` já vêm prontos do
 * snapshot gravado — este componente só decide qual ano/cenário mostrar.
 *
 * Ramo e data de salvamento já aparecem no <header> de
 * src/app/historico/[id]/page.tsx — não repetidos aqui.
 */

import { useRef, useState } from "react";
import type { CenarioRepasse, ResultadoAno } from "@/lib/motor";
import type { SimulacaoDetalhe } from "@/lib/historico";
import { FaixaViavelChart } from "@/components/FaixaViavelChart";
import { ImpactoCaixaChart } from "@/components/ImpactoCaixaChart";
import { ResumoResultado } from "@/components/simulacao/ResumoResultado";
import { AnaliseDesconto } from "@/components/simulacao/AnaliseDesconto";

interface DetalheSimulacaoSalvaProps {
  simulacao: SimulacaoDetalhe;
}

const CENARIOS: { valor: CenarioRepasse; rotulo: string }[] = [
  { valor: "integral", rotulo: "Repasse integral" },
  { valor: "gradual", rotulo: "Repasse gradual" },
  { valor: "absorcao", rotulo: "Absorção" },
];

export function DetalheSimulacaoSalva({ simulacao }: DetalheSimulacaoSalvaProps) {
  const [cenarioSelecionado, setCenarioSelecionado] = useState<CenarioRepasse>("integral");
  const resultadosDoCenario = simulacao.cenarios[cenarioSelecionado];
  const [anoSelecionado, setAnoSelecionado] = useState<number>(
    resultadosDoCenario[0]?.ano ?? new Date().getFullYear(),
  );
  const [descontoPedidoPct, setDescontoPedidoPct] = useState(0);

  const tabsCenarioRef = useRef<(HTMLButtonElement | null)[]>([]);

  const cenarioIrrelevante = simulacao.formulaTipo === "markup";
  const resultadoSelecionado: ResultadoAno | null =
    resultadosDoCenario.find((r) => r.ano === anoSelecionado) ?? null;
  const impactoCaixaSelecionado =
    simulacao.impactoCaixa?.find((r) => r.ano === anoSelecionado) ?? null;

  // Mesmo padrão de navegação por seta de ResultadoSimulacao.tsx — os tabs
  // aqui têm o mesmo papel (role="tab"/"tablist"), então precisam do mesmo
  // comportamento de teclado (WAI-ARIA Authoring Practices para tabs).
  function onCenarioTabKeyDown(evento: React.KeyboardEvent<HTMLButtonElement>, indice: number) {
    if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
    evento.preventDefault();
    const delta = evento.key === "ArrowRight" ? 1 : -1;
    const proximoIndice = (indice + delta + CENARIOS.length) % CENARIOS.length;
    setCenarioSelecionado(CENARIOS[proximoIndice].valor);
    tabsCenarioRef.current[proximoIndice]?.focus();
  }

  return (
    <div className="flex flex-col gap-8">
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
                id={`tab-cenario-historico-${cenario.valor}`}
                type="button"
                role="tab"
                aria-selected={cenarioSelecionado === cenario.valor}
                aria-controls="painel-cenario-historico"
                aria-disabled={cenarioIrrelevante}
                tabIndex={cenarioSelecionado === cenario.valor ? 0 : -1}
                disabled={cenarioIrrelevante}
                onClick={() => setCenarioSelecionado(cenario.valor)}
                onKeyDown={(e) => onCenarioTabKeyDown(e, indice)}
                className={
                  cenarioIrrelevante
                    ? "cursor-not-allowed rounded-full border border-border px-3 py-1 text-xs font-medium text-muted"
                    : cenarioSelecionado === cenario.valor
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
            Ano {anoSelecionado}
          </span>
        </div>
        {cenarioIrrelevante && (
          <p className="mt-2 text-xs text-text-secondary">
            Cenário de repasse não se aplica ao modelo de markup — o preço já é fixo por definição
            (custo × (1 + markup)); quem varia é o lucro líquido, não o preço.
          </p>
        )}
      </div>

      {resultadoSelecionado && <ResumoResultado resultado={resultadoSelecionado} />}

      <section
        id="painel-cenario-historico"
        role="tabpanel"
        aria-labelledby={`tab-cenario-historico-${cenarioSelecionado}`}
        className="rounded-xl border border-border bg-surface p-6 sm:p-8"
      >
        <h2 className="text-base font-semibold text-text-primary">Faixa viável — 2026 a 2033</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Piso, teto e preço ano a ano, no cenário selecionado acima.
        </p>
        <div className="mt-4">
          <FaixaViavelChart
            resultados={resultadosDoCenario}
            anoSelecionado={anoSelecionado}
            onSelecionarAno={setAnoSelecionado}
          />
        </div>
      </section>

      {resultadoSelecionado && (
        <AnaliseDesconto
          resultado={resultadoSelecionado}
          resultados={resultadosDoCenario}
          custoCompra={simulacao.custoCompra}
          descontoPedidoPct={descontoPedidoPct}
          onDescontoPedidoChange={setDescontoPedidoPct}
        />
      )}

      {simulacao.impactoCaixa && simulacao.impactoCaixa.length > 0 && (
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
              resultados={simulacao.impactoCaixa}
              anoSelecionado={anoSelecionado}
              onSelecionarAno={setAnoSelecionado}
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
