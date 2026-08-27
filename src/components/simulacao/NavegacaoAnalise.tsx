"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { CenarioRepasse, ImpactoCaixaAno, ResultadoAno } from "@/lib/motor";
import { FaixaViavelChart } from "@/components/FaixaViavelChart";
import { ImpactoCaixaChart } from "@/components/ImpactoCaixaChart";
import { AnaliseDesconto } from "./AnaliseDesconto";
import { ComparacaoCenarios } from "./ComparacaoCenarios";
import { HeaderAnalise, type SecaoAnalise, type SecaoAnaliseOpcao } from "./HeaderAnalise";
import { LeituraFaixa } from "./LeituraFaixa";
import { PremissasSimulacao } from "./PremissasSimulacao";
import { ResumoResultado } from "./ResumoResultado";
import { SeletorEstrategiaRepasse } from "./SeletorEstrategiaRepasse";
import type { PremissasDados } from "./premissas";

interface NavegacaoAnaliseProps {
  cenarioSelecionado: CenarioRepasse;
  onSelecionarCenario: (cenario: CenarioRepasse) => void;
  /** Modelo markup: preço não reage a cenário de repasse (ver motor.ts) — os controles ficam visíveis, mas desabilitados. */
  cenarioIrrelevante: boolean;
  /** Resultados da estratégia já selecionada, todos os anos disponíveis. */
  resultados: ResultadoAno[];
  /** Os três cenários completos — para "Comparar estratégias" (ver ComparacaoCenarios.tsx), que não depende de `cenarioSelecionado`. */
  cenarios: Record<CenarioRepasse, ResultadoAno[]>;
  anoSelecionado: number;
  onSelecionarAno: (ano: number) => void;
  custoCompra: number;
  descontoPedidoPct: number;
  onDescontoPedidoChange: (valor: number) => void;
  impactoCaixa: ImpactoCaixaAno[] | null;
  /** Dados que GERARAM este resultado (snapshot, nunca `state.form` ao vivo) — ver PremissasSimulacao.tsx. */
  premissas: PremissasDados;
  /** Ações da simulação inteira (Salvar simulação/Editar dados/Nova simulação) — omitido no histórico, ver DetalheSimulacaoSalva.tsx. */
  acoes?: ReactNode;
}

/**
 * Navegação de análise do Resultado — compõe o header sticky de
 * contexto/ações (`HeaderAnalise`: ano, ações globais e abas, SEM nenhuma
 * recomendação global — ver abaixo) com o conteúdo de cada seção (Faixa
 * viável / Negociação / Impacto no caixa / Comparar estratégias),
 * compartilhada entre a simulação ao vivo (ResultadoSimulacao) e o
 * snapshot salvo (DetalheSimulacaoSalva), para as duas telas navegarem
 * exatamente da mesma forma sem duplicar a lógica de teclado/roving
 * tabindex nem a montagem dos painéis. Totalmente controlada por props —
 * não sabe se a estratégia/ano vive no reducer global (tela ao vivo) ou em
 * useState local (histórico); não lê nem recalcula nada, só apresenta o
 * que já recebeu pronto.
 *
 * A estratégia de repasse (Integral/Gradual/Absorção) NÃO é controle global
 * do header: o CONTROLE (`SeletorEstrategiaRepasse`) só existe dentro da
 * aba "Faixa viável", que é onde a estratégia altera visivelmente a
 * análise. Isso não significa que as outras abas ignorem a estratégia —
 * Impacto no caixa e Comparar estratégias genuinamente não dependem dela,
 * mas Negociação depende (o `resultado` que ela recebe já vem filtrado por
 * `cenarioSelecionado`, ver ResultadoSimulacao.tsx) — por isso ela recebe
 * `cenarioSelecionado` só para MOSTRAR (rótulo "Calculado sobre..."), nunca
 * para controlar (auditoria cognitiva: sem esse rótulo, o usuário precisava
 * lembrar de memória qual estratégia tinha deixado selecionada em Faixa
 * viável). O ESTADO (`cenarioSelecionado`/`onSelecionarCenario`) continua
 * vindo de fora, sem duplicação — este componente só decide ONDE mostrar o
 * controle vs. onde só mostrar o rótulo.
 *
 * NÃO existe mais nenhuma "ação recomendada" global no header (removida
 * nesta etapa): aquela frase (`resumoRecomendacao`, extinta) prometia uma
 * leitura completa que na verdade só sabia ler piso/preço/desconto — nunca
 * soube nem dizer "o preço está acima do teto". No lugar, dentro da aba
 * "Faixa viável", logo após o seletor de estratégia e antes de
 * `ResumoResultado`, fica `LeituraFaixa`: uma leitura NEUTRA do status do
 * preço no ano/estratégia selecionados (faixa inviável / abaixo do piso /
 * acima do teto / dentro da faixa com folga / no piso — ver
 * src/lib/frases.ts, `leituraFaixa`), não uma recomendação — ela não
 * conhece prioridade do empresário nem reação de mercado, só interpreta os
 * fatos que `ResultadoAno` já sustenta.
 *
 * Logo abaixo do header sticky (nunca dentro dele — teria que rolar com o
 * conteúdo, não é decisão, é referência) fica `PremissasSimulacao`: os
 * dados que geraram este resultado, para auditar a leitura sem precisar
 * abrir "Editar dados".
 *
 * `role="tablist"` para as seções vive dentro de `HeaderAnalise`; este
 * componente só decide QUAL seção está montada (`secaoAtual`, estado
 * local — nenhum outro componente precisa saber disso).
 */
export function NavegacaoAnalise({
  cenarioSelecionado,
  onSelecionarCenario,
  cenarioIrrelevante,
  resultados,
  cenarios,
  anoSelecionado,
  onSelecionarAno,
  custoCompra,
  descontoPedidoPct,
  onDescontoPedidoChange,
  impactoCaixa,
  premissas,
  acoes,
}: NavegacaoAnaliseProps) {
  const [secaoAtual, setSecaoAtual] = useState<SecaoAnalise>("faixa");

  const anos = [...resultados].sort((a, b) => a.ano - b.ano).map((r) => r.ano);
  const resultadoSelecionado: ResultadoAno | null =
    resultados.find((r) => r.ano === anoSelecionado) ?? null;
  const impactoCaixaSelecionado = impactoCaixa?.find((r) => r.ano === anoSelecionado) ?? null;
  const temImpactoCaixa = !!impactoCaixa && impactoCaixa.length > 0;

  const SECOES: SecaoAnaliseOpcao[] = [
    { valor: "faixa", rotulo: "Faixa viável" },
    { valor: "negociacao", rotulo: "Negociação" },
    ...(temImpactoCaixa ? [{ valor: "caixa" as const, rotulo: "Impacto no caixa" }] : []),
    { valor: "comparar", rotulo: "Comparar estratégias" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <HeaderAnalise
        anos={anos}
        anoSelecionado={anoSelecionado}
        onSelecionarAno={onSelecionarAno}
        secoes={SECOES}
        secaoAtual={secaoAtual}
        onSelecionarSecao={setSecaoAtual}
        acoes={acoes}
      />

      <PremissasSimulacao dados={premissas} />

      {/* Faixa viável — preço, piso, teto e gráfico, com a leitura do status logo abaixo do seletor. */}
      {secaoAtual === "faixa" && (
        <section
          id="painel-secao-faixa"
          role="tabpanel"
          aria-labelledby="tab-secao-faixa"
          className="flex flex-col gap-6"
        >
          <SeletorEstrategiaRepasse
            estrategiaSelecionada={cenarioSelecionado}
            onSelecionarEstrategia={onSelecionarCenario}
            estrategiaIrrelevante={cenarioIrrelevante}
          />

          {resultadoSelecionado && <LeituraFaixa resultado={resultadoSelecionado} />}

          {resultadoSelecionado && <ResumoResultado resultado={resultadoSelecionado} />}

          <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
            <h2 className="text-base font-semibold text-text-primary">
              Faixa viável — 2026 a 2033
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              Piso, teto e preço ano a ano, na estratégia de repasse selecionada acima.
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
              cenarioSelecionado={cenarioSelecionado}
              margemMinimaPct={premissas.margemMinimaPct}
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

      {secaoAtual === "comparar" && (
        <section
          id="painel-secao-comparar"
          role="tabpanel"
          aria-labelledby="tab-secao-comparar"
        >
          <ComparacaoCenarios
            cenarios={cenarios}
            anoSelecionado={anoSelecionado}
            cenarioIrrelevante={cenarioIrrelevante}
            margemMinimaFracao={premissas.margemMinimaPct / 100}
          />
        </section>
      )}
    </div>
  );
}
