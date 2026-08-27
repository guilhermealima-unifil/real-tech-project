"use client";

import { useRef, useState } from "react";
import type { CenarioRepasse, ImpactoCaixaAno, ResultadoAno } from "@/lib/motor";
import { FaixaViavelChart } from "@/components/FaixaViavelChart";
import { ImpactoCaixaChart } from "@/components/ImpactoCaixaChart";
import { ResumoResultado } from "./ResumoResultado";
import { AnaliseDesconto } from "./AnaliseDesconto";

const CENARIOS: { valor: CenarioRepasse; rotulo: string }[] = [
  { valor: "integral", rotulo: "Repasse integral" },
  { valor: "gradual", rotulo: "Repasse gradual" },
  { valor: "absorcao", rotulo: "Absorção" },
];

type SecaoAnalise = "faixa" | "negociacao" | "caixa";

const RADIO_BASE =
  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors";
const RADIO_SELECIONADO = "border-primary/30 bg-primary/10 font-semibold text-primary";
const RADIO_NAO_SELECIONADO =
  "border-border text-text-secondary hover:border-text-secondary hover:text-text-primary";

interface NavegacaoAnaliseProps {
  cenarioSelecionado: CenarioRepasse;
  onSelecionarCenario: (cenario: CenarioRepasse) => void;
  /** Modelo markup: preço não reage a cenário de repasse (ver motor.ts) — os controles ficam visíveis, mas desabilitados. */
  cenarioIrrelevante: boolean;
  /** Resultados do cenário já selecionado, todos os anos disponíveis. */
  resultados: ResultadoAno[];
  anoSelecionado: number;
  onSelecionarAno: (ano: number) => void;
  custoCompra: number;
  descontoPedidoPct: number;
  onDescontoPedidoChange: (valor: number) => void;
  impactoCaixa: ImpactoCaixaAno[] | null;
}

/**
 * Navegação de análise do Resultado — CONTEXTO (cenário + ano) e SEÇÕES
 * (Faixa viável / Negociação / Impacto no caixa), compartilhada entre a
 * simulação ao vivo (ResultadoSimulacao) e o snapshot salvo
 * (DetalheSimulacaoSalva), para as duas telas navegarem exatamente da mesma
 * forma sem duplicar a lógica de teclado/roving tabindex nem a montagem dos
 * painéis. Totalmente controlada por props — não sabe se o cenário/ano
 * vive no reducer global (tela ao vivo) ou em useState local (histórico);
 * não lê nem recalcula nada, só apresenta o que já recebeu pronto.
 *
 * `role="radiogroup"`/`role="radio"` para cenário e ano: escolher um não
 * esconde/mostra painel nenhum, só troca qual fatia dos mesmos dados as
 * seções abaixo exibem. `role="tablist"`/`"tab"`/`"tabpanel"` para as 3
 * seções: aí sim trocar de aba troca qual bloco de conteúdo está visível.
 * Cenário, ano e as abas ficam juntos no mesmo bloco sticky — trocar
 * qualquer um dos três nunca exige rolar de volta ao topo.
 */
export function NavegacaoAnalise({
  cenarioSelecionado,
  onSelecionarCenario,
  cenarioIrrelevante,
  resultados,
  anoSelecionado,
  onSelecionarAno,
  custoCompra,
  descontoPedidoPct,
  onDescontoPedidoChange,
  impactoCaixa,
}: NavegacaoAnaliseProps) {
  const radiosCenarioRef = useRef<(HTMLButtonElement | null)[]>([]);
  const radiosAnoRef = useRef<(HTMLButtonElement | null)[]>([]);
  const tabsSecaoRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Qual das 3 seções está visível — estado puramente de apresentação desta
  // navegação, nenhum outro componente precisa saber disso (diferente de
  // cenário/ano, que os gráficos e a análise de desconto também consomem).
  const [secaoAtual, setSecaoAtual] = useState<SecaoAnalise>("faixa");

  const anos = [...resultados].sort((a, b) => a.ano - b.ano).map((r) => r.ano);
  const resultadoSelecionado: ResultadoAno | null =
    resultados.find((r) => r.ano === anoSelecionado) ?? null;
  const impactoCaixaSelecionado = impactoCaixa?.find((r) => r.ano === anoSelecionado) ?? null;
  const temImpactoCaixa = !!impactoCaixa && impactoCaixa.length > 0;

  const SECOES: { valor: SecaoAnalise; rotulo: string }[] = [
    { valor: "faixa", rotulo: "Faixa viável" },
    { valor: "negociacao", rotulo: "Negociação" },
    ...(temImpactoCaixa ? [{ valor: "caixa" as const, rotulo: "Impacto no caixa" }] : []),
  ];

  function onCenarioKeyDown(evento: React.KeyboardEvent<HTMLButtonElement>, indice: number) {
    if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
    evento.preventDefault();
    const delta = evento.key === "ArrowRight" ? 1 : -1;
    const proximoIndice = (indice + delta + CENARIOS.length) % CENARIOS.length;
    onSelecionarCenario(CENARIOS[proximoIndice].valor);
    radiosCenarioRef.current[proximoIndice]?.focus();
  }

  function onAnoKeyDown(evento: React.KeyboardEvent<HTMLButtonElement>, indice: number) {
    if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
    evento.preventDefault();
    const delta = evento.key === "ArrowRight" ? 1 : -1;
    const proximoIndice = (indice + delta + anos.length) % anos.length;
    onSelecionarAno(anos[proximoIndice]);
    radiosAnoRef.current[proximoIndice]?.focus();
  }

  function onSecaoKeyDown(evento: React.KeyboardEvent<HTMLButtonElement>, indice: number) {
    if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
    evento.preventDefault();
    const delta = evento.key === "ArrowRight" ? 1 : -1;
    const proximoIndice = (indice + delta + SECOES.length) % SECOES.length;
    setSecaoAtual(SECOES[proximoIndice].valor);
    tabsSecaoRef.current[proximoIndice]?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Contexto (cenário + ano) + seções — sticky em bloco único: ao
          rolar o conteúdo de uma seção o usuário nunca perde de vista "que
          cenário/ano estou vendo" nem "qual aspecto estou vendo". Nunca
          compete com o shell global (src/components/shell/AppShell.tsx):
          no desktop a Sidebar é uma coluna lateral fixa, não uma barra no
          topo; no mobile a BarraSuperiorMobile não é sticky/fixed, então
          rola para fora de tela normalmente antes deste bloco assumir o
          topo (`top-0`) — mesma decisão de quando o shell ainda era um
          Header horizontal, só documentada para a estrutura nova. */}
      <div className="sticky top-0 z-10 -mx-6 border-b border-border bg-background px-6 pt-3 sm:mx-0 sm:px-0">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Cenário</span>
          <div
            role="radiogroup"
            aria-label="Cenário de repasse"
            aria-orientation="horizontal"
            className="flex flex-wrap gap-1.5"
          >
            {CENARIOS.map((cenario, indice) => (
              <button
                key={cenario.valor}
                ref={(el) => {
                  radiosCenarioRef.current[indice] = el;
                }}
                type="button"
                role="radio"
                aria-checked={cenarioSelecionado === cenario.valor}
                aria-disabled={cenarioIrrelevante}
                tabIndex={cenarioSelecionado === cenario.valor ? 0 : -1}
                disabled={cenarioIrrelevante}
                onClick={() => onSelecionarCenario(cenario.valor)}
                onKeyDown={(e) => onCenarioKeyDown(e, indice)}
                className={
                  RADIO_BASE +
                  " " +
                  (cenarioIrrelevante
                    ? "cursor-not-allowed border-border text-muted"
                    : cenarioSelecionado === cenario.valor
                      ? RADIO_SELECIONADO
                      : RADIO_NAO_SELECIONADO)
                }
              >
                {cenario.rotulo}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">
            Ano analisado
          </span>
          <div
            role="radiogroup"
            aria-label="Ano analisado"
            aria-orientation="horizontal"
            className="flex gap-1.5 overflow-x-auto pb-1"
          >
            {anos.map((ano, indice) => (
              <button
                key={ano}
                ref={(el) => {
                  radiosAnoRef.current[indice] = el;
                }}
                type="button"
                role="radio"
                aria-checked={anoSelecionado === ano}
                tabIndex={anoSelecionado === ano ? 0 : -1}
                onClick={() => onSelecionarAno(ano)}
                onKeyDown={(e) => onAnoKeyDown(e, indice)}
                className={
                  "font-figures min-w-[52px] text-center " +
                  RADIO_BASE +
                  " " +
                  (anoSelecionado === ano ? RADIO_SELECIONADO : RADIO_NAO_SELECIONADO)
                }
              >
                {ano}
              </button>
            ))}
          </div>
        </div>

        {cenarioIrrelevante && (
          <p className="mt-3 text-xs text-text-secondary">
            Cenário de repasse não se aplica ao modelo de markup — o preço já é fixo por definição
            (custo × (1 + markup)); quem varia é o lucro líquido, não o preço.
          </p>
        )}

        <div
          role="tablist"
          aria-label="Seção de análise"
          className="mt-3 flex gap-x-5 overflow-x-auto sm:gap-x-7"
        >
          {SECOES.map((secao, indice) => (
            <button
              key={secao.valor}
              ref={(el) => {
                tabsSecaoRef.current[indice] = el;
              }}
              id={`tab-secao-${secao.valor}`}
              type="button"
              role="tab"
              aria-selected={secaoAtual === secao.valor}
              aria-controls={`painel-secao-${secao.valor}`}
              tabIndex={secaoAtual === secao.valor ? 0 : -1}
              onClick={() => setSecaoAtual(secao.valor)}
              onKeyDown={(e) => onSecaoKeyDown(e, indice)}
              className={
                "shrink-0 whitespace-nowrap border-b-2 pb-2.5 text-sm transition-colors " +
                (secaoAtual === secao.valor
                  ? "border-primary font-semibold text-primary"
                  : "border-transparent font-medium text-text-secondary hover:text-text-primary")
              }
            >
              {secao.rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* Faixa viável — decisão principal: quanto cobrar. */}
      {secaoAtual === "faixa" && (
        <section
          id="painel-secao-faixa"
          role="tabpanel"
          aria-labelledby="tab-secao-faixa"
          className="flex flex-col gap-6"
        >
          {resultadoSelecionado && <ResumoResultado resultado={resultadoSelecionado} />}

          <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-base font-semibold text-text-primary">
              Faixa viável — 2026 a 2033
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Piso, teto e preço ano a ano, no cenário selecionado acima.
            </p>
            <div className="mt-4">
              <FaixaViavelChart
                resultados={resultados}
                anoSelecionado={anoSelecionado}
                onSelecionarAno={onSelecionarAno}
              />
            </div>
          </div>
        </section>
      )}

      {/* Negociação — segunda decisão: até quanto ceder. */}
      {secaoAtual === "negociacao" && (
        <section id="painel-secao-negociacao" role="tabpanel" aria-labelledby="tab-secao-negociacao">
          {resultadoSelecionado && (
            <AnaliseDesconto
              resultado={resultadoSelecionado}
              resultados={resultados}
              custoCompra={custoCompra}
              descontoPedidoPct={descontoPedidoPct}
              onDescontoPedidoChange={onDescontoPedidoChange}
            />
          )}
        </section>
      )}

      {/* Impacto no caixa — análise secundária: informa, não decide o
          preço. Aba só existe quando `temImpactoCaixa` (ver SECOES acima). */}
      {secaoAtual === "caixa" && impactoCaixa && impactoCaixa.length > 0 && (
        <section id="painel-secao-caixa" role="tabpanel" aria-labelledby="tab-secao-caixa">
          <h2 className="text-base font-semibold text-text-primary">
            Impacto no caixa — crédito da compra, ano a ano
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Não é só quanto se paga de imposto, é quando esse crédito fica disponível. Verde: já
            protegido pelo split payment. Âmbar: ainda depende do fornecedor recolher.
          </p>

          <div className="mt-4">
            <ImpactoCaixaChart
              resultados={impactoCaixa}
              anoSelecionado={anoSelecionado}
              onSelecionarAno={onSelecionarAno}
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
