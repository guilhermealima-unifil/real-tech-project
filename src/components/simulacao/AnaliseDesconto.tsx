import type { CenarioRepasse, ResultadoAno } from "@/lib/motor";
import { formatarPct, formatarReais, mensagemAnaliseDesconto } from "@/lib/frases";
import { analisarDesconto } from "@/lib/analiseResultado";
import { CENARIOS } from "./SeletorEstrategiaRepasse";

interface AnaliseDescontoProps {
  /** Ano/cenário selecionados. */
  resultado: ResultadoAno;
  /** Todos os anos do cenário atual — para o resumo "cabe até que ano". */
  resultados: ResultadoAno[];
  custoCompra: number;
  descontoPedidoPct: number;
  onDescontoPedidoChange: (valor: number) => void;
  /** Só para o rótulo de contexto abaixo do título (ver `rotuloEstrategia` abaixo) — os números já vêm calculados sobre essa estratégia via `resultado`/`resultados`, nenhuma lógica nova depende disto. */
  cenarioSelecionado: CenarioRepasse;
  /** Percentual "inteiro" (22 = 22%), mesma convenção de PremissasDados — só para mostrar ao lado de "Margem após desconto" (ver auditoria: P1-B). */
  margemMinimaPct: number;
}

/**
 * "Negociação" — a segunda decisão da tela ("até quanto posso negociar").
 * Une o que antes eram dois blocos falando do mesmo assunto: o slider de
 * desconto pedido (antes em PainelRecomendacao, agora só vive aqui) e o
 * detalhamento concreto (preço final, limite seguro, margem após
 * desconto). PainelRecomendacao foi removido — o preço/piso/teto que ele
 * repetia já aparecem no resumo principal (ResumoResultado) e aqui como
 * "limite seguro"; a mensagem de recomendação (`resultado.mensagemRecomendacao`)
 * também já ficava redundante com o status do resumo. Nenhuma regra
 * nova: só reorganiza o que src/lib/analiseResultado.ts já calcula.
 *
 * `cenarioSelecionado`/`margemMinimaPct` (auditoria cognitiva — P1-A/P1-B):
 * os números desta aba já variavam por estratégia antes desta mudança (via
 * `resultado`, que já vem filtrado pela estratégia selecionada em
 * NavegacaoAnalise.tsx), mas nada aqui dizia QUAL estratégia — o seletor
 * só existe na aba "Faixa viável". `rotuloEstrategia` reaproveita `CENARIOS`
 * (mesmo array de SeletorEstrategiaRepasse.tsx/ComparacaoCenarios.tsx, um
 * único lugar de rótulos) só para exibir, sem estado novo. Do mesmo jeito,
 * `margemMinimaPct` não existe em `ResultadoAno` (é input do motor, não
 * output — ver src/lib/motor.ts) — chega aqui como prop, igual já chega em
 * ComparacaoCenarios.tsx via `premissas.margemMinimaPct`.
 */
export function AnaliseDesconto({
  resultado,
  resultados,
  custoCompra,
  descontoPedidoPct,
  onDescontoPedidoChange,
  cenarioSelecionado,
  margemMinimaPct,
}: AnaliseDescontoProps) {
  const analise = analisarDesconto(resultado, custoCompra, descontoPedidoPct);
  const descontoPedidoFracao = descontoPedidoPct / 100;
  const anosOrdenados = [...resultados].sort((a, b) => a.ano - b.ano);
  const primeiroAnoQueNaoCabe = anosOrdenados.find(
    (r) => r.descontoMaximoPct === null || descontoPedidoFracao > r.descontoMaximoPct,
  );
  const rotuloEstrategia =
    CENARIOS.find((c) => c.valor === cenarioSelecionado)?.rotulo ?? cenarioSelecionado;

  return (
    <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
      <h2 className="text-lg font-semibold text-text-primary">Negociação</h2>
      <p className="mt-1 text-xs text-muted">
        Calculado sobre {rotuloEstrategia} · {resultado.ano}
      </p>
      <p className="mt-1 text-sm text-text-secondary">
        Até quanto você pode ceder em {resultado.ano} sem furar sua margem mínima.
      </p>

      <div className="mt-5">
        <span id="rotulo-desconto-pedido" className="text-sm font-medium text-text-primary">
          Desconto a simular (%)
        </span>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            step="0.5"
            aria-labelledby="rotulo-desconto-pedido"
            value={descontoPedidoPct}
            onChange={(e) => onDescontoPedidoChange(Number(e.target.value))}
            className="w-full accent-[var(--primary)]"
          />
          <label className="flex items-center gap-1">
            <span className="sr-only">Desconto a simular, em percentual</span>
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={descontoPedidoPct}
              onChange={(e) =>
                onDescontoPedidoChange(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
              }
              className="font-figures w-20 rounded-lg border border-border bg-surface px-2 py-1.5 text-right text-sm text-text-primary focus-visible:border-primary"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">
          O limite seguro é o maior desconto que preserva sua margem mínima. Você pode simular
          valores maiores para ver o impacto.
        </p>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-border pt-5 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted">Desconto simulado</dt>
          <dd className="font-figures mt-0.5 font-medium text-text-primary">
            {formatarPct(analise.descontoPedidoFracao)}% = R$ {formatarReais(analise.valorDescontoPedidoReais)}
          </dd>
        </div>

        <div>
          <dt className="text-muted">Preço final</dt>
          <dd className="font-figures mt-0.5 font-medium text-text-primary">
            R$ {formatarReais(analise.precoFinal)}
          </dd>
        </div>

        <div>
          <dt className="text-muted">Limite seguro</dt>
          <dd className="font-figures mt-0.5 font-medium text-text-primary">
            {analise.descontoMaximoPct !== null ? `${formatarPct(analise.descontoMaximoPct)}%` : "—"} = R${" "}
            {formatarReais(Math.max(analise.valorDescontoMaximoReais, 0))}
          </dd>
        </div>

        <div>
          <dt className="text-muted">Margem após desconto</dt>
          <dd className="font-figures mt-0.5 font-medium text-text-primary">
            {analise.margemAposDesconto !== null ? `${formatarPct(analise.margemAposDesconto)}%` : "—"}
          </dd>
          <p className="font-figures mt-0.5 text-xs text-muted">
            mínimo {formatarPct(margemMinimaPct / 100)}%
          </p>
        </div>
      </dl>

      <p
        className={
          "mt-4 rounded-lg p-3 text-sm font-medium " +
          (analise.dentroDoLimite ? "bg-success/10 text-success" : "bg-danger/10 text-danger")
        }
      >
        {mensagemAnaliseDesconto({ excedenteReais: analise.excedenteReais })}
      </p>

      <div className="mt-6 border-t border-border pt-5">
        <p className="text-sm font-medium text-text-primary">
          {!primeiroAnoQueNaoCabe
            ? `Esse desconto cabe em todos os anos, de ${anosOrdenados[0].ano} a ${anosOrdenados[anosOrdenados.length - 1].ano}.`
            : primeiroAnoQueNaoCabe.ano === anosOrdenados[0].ano
              ? `Esse desconto já não cabe nem em ${primeiroAnoQueNaoCabe.ano}.`
              : `Esse desconto cabe até ${primeiroAnoQueNaoCabe.ano - 1} — a partir de ${primeiroAnoQueNaoCabe.ano}, fura a margem mínima.`}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {anosOrdenados.map((r) => {
            const cabe = r.descontoMaximoPct !== null && descontoPedidoFracao <= r.descontoMaximoPct;
            return (
              <span
                key={r.ano}
                className={
                  "font-figures flex flex-col items-center rounded-lg px-2 py-1 text-xs font-medium leading-tight " +
                  (cabe ? "bg-success/10 text-success" : "bg-danger/10 text-danger")
                }
              >
                <span>{r.ano}</span>
                <span className="text-[10px] opacity-80">
                  {r.descontoMaximoPct !== null ? `${formatarPct(r.descontoMaximoPct)}%` : "—"}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
