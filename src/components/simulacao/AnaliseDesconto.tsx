import type { ResultadoAno } from "@/lib/motor";
import { formatarPct, formatarReais, mensagemAnaliseDesconto } from "@/lib/frases";
import { analisarDesconto } from "@/lib/analiseResultado";

interface AnaliseDescontoProps {
  resultado: ResultadoAno;
  custoCompra: number;
  /** Mesmo valor (0–100) do slider em PainelRecomendacao — não duplica o controle, só reage a ele. */
  descontoPedidoPct: number;
}

/**
 * Torna concreto o desconto pedido: reais, preço final, limite seguro em
 * reais, e o que sobra/falta em relação ao limite. Não introduz um
 * segundo controle de desconto — lê o mesmo `descontoPedidoPct` que já
 * controla o slider existente em PainelRecomendacao.
 */
export function AnaliseDesconto({ resultado, custoCompra, descontoPedidoPct }: AnaliseDescontoProps) {
  const analise = analisarDesconto(resultado, custoCompra, descontoPedidoPct);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Desconto pedido — o que muda
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Reage ao desconto ajustado acima, em {resultado.ano}.
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Desconto pedido</dt>
          <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
            {formatarPct(analise.descontoPedidoFracao)}% = R${" "}
            {formatarReais(analise.valorDescontoPedidoReais)}
          </dd>
        </div>

        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Preço final</dt>
          <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
            R$ {formatarReais(analise.precoFinal)}
          </dd>
        </div>

        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Limite seguro</dt>
          <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
            {analise.descontoMaximoPct !== null
              ? `${formatarPct(analise.descontoMaximoPct)}%`
              : "—"}{" "}
            = R$ {formatarReais(Math.max(analise.valorDescontoMaximoReais, 0))}
          </dd>
        </div>

        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Margem após desconto</dt>
          <dd className="font-semibold text-zinc-900 dark:text-zinc-50">
            {analise.margemAposDesconto !== null
              ? `${formatarPct(analise.margemAposDesconto)}%`
              : "—"}
          </dd>
        </div>
      </dl>

      <p
        className={
          "mt-4 rounded border p-3 text-sm font-medium " +
          (analise.dentroDoLimite
            ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
            : "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300")
        }
      >
        {mensagemAnaliseDesconto({ excedenteReais: analise.excedenteReais })}
      </p>
    </section>
  );
}
