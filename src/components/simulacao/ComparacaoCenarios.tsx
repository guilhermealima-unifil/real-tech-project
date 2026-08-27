import type { ReactNode } from "react";
import { classificarStatusPreco, type StatusPreco } from "@/lib/analiseResultado";
import { construirEvidenciasComparacao } from "@/lib/evidenciasComparacao";
import { formatarPct, formatarReais } from "@/lib/frases";
import type { CenarioRepasse, ResultadoAno } from "@/lib/motor";
import { resumirCenario, type ResumoCenario } from "@/lib/resumoCenario";
import { CardCenario } from "./CardCenario";
import { LeituraComparacao } from "./LeituraComparacao";
import { CENARIOS } from "./SeletorEstrategiaRepasse";

interface ComparacaoCenariosProps {
  /** Três trajetórias já calculadas ou persistidas no snapshot; nunca são recalculadas aqui. */
  cenarios: Record<CenarioRepasse, ResultadoAno[]>;
  /** Mesmo ano controlado pelo header, sem seletor ou estado paralelo nesta aba. */
  anoSelecionado: number;
  /** No markup, as três trajetórias são iguais por definição atual do motor. */
  cenarioIrrelevante: boolean;
  /** Fração decimal (0.30 = 30%), convertida do snapshot por quem chama. */
  margemMinimaFracao: number;
}

interface ComparacaoItem {
  cenario: CenarioRepasse;
  rotulo: string;
  resultadoAno: ResultadoAno;
  resumo: ResumoCenario;
}

interface ValorComparavel {
  cenario: CenarioRepasse;
  rotulo: string;
  conteudo: ReactNode;
}

const ROTULO_STATUS: Record<StatusPreco, { rotulo: string; classe: string }> = {
  abaixo_piso: { rotulo: "Abaixo do piso", classe: "bg-danger/10 text-danger" },
  dentro_da_faixa: { rotulo: "Dentro da faixa", classe: "bg-success/10 text-success" },
  acima_teto: { rotulo: "Acima do teto", classe: "bg-warning/10 text-warning" },
  faixa_inviavel: { rotulo: "Faixa inviável", classe: "bg-danger/10 text-danger" },
};

const COLUNAS_COMPARACAO =
  "sm:grid-cols-[minmax(8.5rem,0.8fr)_repeat(3,minmax(0,1fr))]";

function formatarValorComSinal(valor: number, prefixo: string): string {
  const sinal = valor > 0 ? "+" : valor < 0 ? "−" : "";
  return `${sinal}${prefixo}${formatarReais(Math.abs(valor))}`;
}

function formatarPercentualComSinal(percentual: number | null): string {
  if (percentual === null) return "—";
  const sinal = percentual > 0 ? "+" : percentual < 0 ? "−" : "";
  return `${sinal}${formatarPct(Math.abs(percentual) / 100)}%`;
}

function formatarFolgaMargem(fracao: number): string {
  const sinal = fracao > 0 ? "+" : fracao < 0 ? "−" : "";
  return `${sinal}${formatarPct(Math.abs(fracao))} p.p.`;
}

function quantidadeAnos(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? "ano" : "anos"}`;
}

function LinhaComparacao({
  titulo,
  valores,
}: {
  titulo: string;
  valores: ValorComparavel[];
}) {
  return (
    <div className={`grid grid-cols-1 border-b border-border last:border-b-0 ${COLUNAS_COMPARACAO}`}>
      <div className="bg-background px-3 py-2.5 sm:flex sm:items-center sm:px-4">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted">{titulo}</h3>
      </div>
      {valores.map(({ cenario, rotulo, conteudo }) => (
        <div
          key={cenario}
          className="flex min-w-0 items-start justify-between gap-4 border-t border-border px-3 py-3 sm:block sm:border-l sm:border-t-0 sm:px-4"
        >
          <span className="shrink-0 text-xs font-medium text-text-secondary sm:sr-only">
            {rotulo}
          </span>
          <div className="min-w-0 text-right sm:text-left">{conteudo}</div>
        </div>
      ))}
    </div>
  );
}

function valoresDosItens(
  itens: ComparacaoItem[],
  renderizar: (item: ComparacaoItem) => ReactNode,
): ValorComparavel[] {
  return itens.map((item) => ({
    cenario: item.cenario,
    rotulo: item.rotulo,
    conteudo: renderizar(item),
  }));
}

export function ComparacaoCenarios({
  cenarios,
  anoSelecionado,
  cenarioIrrelevante,
  margemMinimaFracao,
}: ComparacaoCenariosProps) {
  if (cenarioIrrelevante) {
    const evidencias = construirEvidenciasComparacao(cenarios, anoSelecionado, margemMinimaFracao);
    return (
      <div className="w-full space-y-5">
        <div className="rounded-xl border border-border bg-surface p-6 text-sm sm:p-8">
          <p className="font-medium text-text-primary">
            Neste modelo, as estratégias de repasse não alteram o preço calculado.
          </p>
          <p className="mt-2 text-text-secondary">
            Integral, Gradual e Absorção produzem a mesma trajetória no markup atual, pois o preço é
            definido pelo markup aplicado ao custo.
          </p>
        </div>
        <LeituraComparacao evidencias={evidencias} />
      </div>
    );
  }

  const itens: ComparacaoItem[] = CENARIOS.flatMap(({ valor, rotulo }) => {
    const resultados = cenarios[valor];
    const resultadoAno = resultados.find((resultado) => resultado.ano === anoSelecionado);
    if (!resultadoAno) return [];
    return [
      {
        cenario: valor,
        rotulo,
        resultadoAno,
        resumo: resumirCenario(resultados, margemMinimaFracao),
      },
    ];
  });
  const todosSemTeto = itens.every((item) => item.resumo.menorDistanciaTeto === null);

  return (
    <div className="w-full space-y-5">
      <section aria-labelledby="comparacao-cenarios-titulo">
        <h2 id="comparacao-cenarios-titulo" className="text-base font-semibold text-text-primary">
          Estratégias de repasse
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Compare o efeito de cada estratégia sobre preço e margem durante a transição.
        </p>
        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted">
          Visão do período completo · 2026–2033
        </p>

        <div className={`mt-3 grid grid-cols-1 gap-2 ${COLUNAS_COMPARACAO}`}>
          <div aria-hidden="true" className="hidden sm:block" />
          {itens.map((item) => (
            <CardCenario key={item.cenario} cenario={item.cenario} rotulo={item.rotulo} />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="comparacao-principal-titulo"
        className="overflow-hidden rounded-xl border border-border bg-surface"
      >
        <h2 id="comparacao-principal-titulo" className="sr-only">
          Comparação principal
        </h2>

        <LinhaComparacao
          titulo="Trajetória do preço"
          valores={valoresDosItens(itens, ({ resumo }) => (
            <>
              <p className="font-figures text-sm font-semibold text-text-primary">
                R$ {formatarReais(resumo.precoInicial)}
                <span aria-hidden="true" className="mx-1 text-muted">→</span>
                <span className="sr-only">para</span>
                R$ {formatarReais(resumo.precoFinal)}
              </p>
              <p className="font-figures mt-0.5 text-xs text-text-secondary">
                {formatarValorComSinal(resumo.variacaoPrecoAbsoluta, "R$ ")}
                <span aria-hidden="true"> · </span>
                <span className="sr-only">, </span>
                {formatarPercentualComSinal(resumo.variacaoPrecoPct)}
              </p>
            </>
          ))}
        />

        <LinhaComparacao
          titulo="Maior reajuste anual"
          valores={valoresDosItens(itens, ({ resumo }) =>
            resumo.anoMaiorReajuste !== null ? (
              <>
                <p className="font-figures text-sm font-semibold text-text-primary">
                  {formatarValorComSinal(resumo.maiorReajusteAnual, "R$ ")}
                </p>
                <p className="mt-0.5 text-xs text-text-secondary">
                  em {resumo.anoMaiorReajuste}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-text-primary">Sem aumento anual</p>
            ),
          )}
        />

        <LinhaComparacao
          titulo="Menor margem"
          valores={valoresDosItens(itens, ({ resumo }) => (
            <p className="font-figures text-base font-semibold text-text-primary">
              {formatarPct(resumo.menorMargemPct)}%
            </p>
          ))}
        />

        <LinhaComparacao
          titulo="Folga mínima da margem"
          valores={valoresDosItens(itens, ({ resumo }) => (
            <>
              <p
                className={
                  "font-figures text-base font-semibold " +
                  (resumo.menorFolgaMargemPct < 0 ? "text-danger" : "text-text-primary")
                }
              >
                {formatarFolgaMargem(resumo.menorFolgaMargemPct)}
              </p>
              {resumo.anoMenorFolgaMargem !== null && (
                <p className="mt-0.5 text-xs text-text-secondary">
                  em {resumo.anoMenorFolgaMargem}
                </p>
              )}
            </>
          ))}
        />
      </section>

      <LeituraComparacao
        evidencias={construirEvidenciasComparacao(cenarios, anoSelecionado, margemMinimaFracao)}
      />

      <section aria-labelledby="riscos-cenarios-titulo">
        <h2 id="riscos-cenarios-titulo" className="text-sm font-semibold text-text-primary">
          Riscos e limitações
        </h2>

        {todosSemTeto ? (
          <div className="mt-2 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
            <p className="text-sm font-medium text-text-primary">Teto da praça não informado</p>
            <p className="mt-1 text-xs text-text-secondary">
              Sem esse dado, não é possível avaliar a distância do preço para o teto.
            </p>
          </div>
        ) : (
          <div className="mt-2 overflow-hidden rounded-lg border border-border bg-surface">
            <LinhaComparacao
              titulo="Distância mínima para o teto"
              valores={valoresDosItens(itens, ({ resumo }) =>
                resumo.menorDistanciaTeto !== null ? (
                  <>
                    <p
                      className={
                        "font-figures text-sm font-medium " +
                        (resumo.menorDistanciaTeto < 0 ? "text-warning" : "text-text-primary")
                      }
                    >
                      {formatarValorComSinal(resumo.menorDistanciaTeto, "R$ ")}
                    </p>
                    {resumo.anoMenorDistanciaTeto !== null && (
                      <p className="mt-0.5 text-xs text-text-secondary">
                        em {resumo.anoMenorDistanciaTeto}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-text-secondary">Teto não informado</p>
                ),
              )}
            />
          </div>
        )}

        <div className="mt-2 overflow-hidden rounded-lg border border-border bg-surface">
          <LinhaComparacao
            titulo="Ocorrências críticas"
            valores={valoresDosItens(itens, ({ resumo }) => (
              <dl className="space-y-1 text-xs">
                <div className="flex flex-wrap justify-between gap-x-3 sm:block">
                  <dt className="text-text-secondary">Margem abaixo</dt>
                  <dd className={resumo.anosAbaixoMargemMinima > 0 ? "font-medium text-danger" : "text-text-primary"}>
                    {quantidadeAnos(resumo.anosAbaixoMargemMinima)}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-x-3 sm:block">
                  <dt className="text-text-secondary">Acima do teto</dt>
                  <dd className={resumo.anosAcimaTeto > 0 ? "font-medium text-warning" : "text-text-primary"}>
                    {quantidadeAnos(resumo.anosAcimaTeto)}
                  </dd>
                </div>
                <div className="flex flex-wrap justify-between gap-x-3 sm:block">
                  <dt className="text-text-secondary">Faixa inviável</dt>
                  <dd className={resumo.anosFaixaInviavel > 0 ? "font-medium text-danger" : "text-text-primary"}>
                    {quantidadeAnos(resumo.anosFaixaInviavel)}
                  </dd>
                </div>
              </dl>
            ))}
          />

          <LinhaComparacao
            titulo="Primeiro ano crítico"
            valores={valoresDosItens(itens, ({ resumo }) => (
              <p
                className={
                  "text-sm font-medium " +
                  (resumo.primeiroAnoCritico !== null ? "text-warning" : "text-success")
                }
              >
                {resumo.primeiroAnoCritico ?? "Nenhum"}
              </p>
            ))}
          />
        </div>
      </section>

      <section aria-labelledby="ano-selecionado-cenarios-titulo">
        <h2 id="ano-selecionado-cenarios-titulo" className="text-sm font-semibold text-text-primary">
          Situação em {anoSelecionado}
        </h2>
        <div className="mt-2 overflow-hidden rounded-lg border border-border bg-surface">
          <LinhaComparacao
            titulo="Preço, margem e status"
            valores={valoresDosItens(itens, ({ resultadoAno }) => {
              const status = classificarStatusPreco(
                resultadoAno.preco,
                resultadoAno.piso,
                resultadoAno.teto,
              );
              return (
                <>
                  <p className="font-figures text-sm font-medium text-text-primary">
                    R$ {formatarReais(resultadoAno.preco)}
                  </p>
                  <p className="font-figures mt-0.5 text-xs text-text-secondary">
                    Margem {formatarPct(resultadoAno.margemResultante)}%
                  </p>
                  <span
                    className={`mt-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ROTULO_STATUS[status].classe}`}
                  >
                    {ROTULO_STATUS[status].rotulo}
                  </span>
                </>
              );
            })}
          />
        </div>
      </section>
    </div>
  );
}
