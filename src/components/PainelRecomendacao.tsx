import type { ResultadoAno } from "@/lib/motor";
import { formatarPct, formatarReais } from "@/lib/frases";

interface PainelRecomendacaoProps {
  resultado: ResultadoAno | null;
  resultados: ResultadoAno[];
  descontoPedidoPct: number;
  onDescontoPedidoChange: (valor: number) => void;
}

/**
 * Sempre visível — nunca uma tela de "resultado numérico solto" (docs/02,
 * seção 3, item 5). Acompanha a tela de entrada e a faixa viável.
 */
export function PainelRecomendacao({
  resultado,
  resultados,
  descontoPedidoPct,
  onDescontoPedidoChange,
}: PainelRecomendacaoProps) {
  if (!resultado || resultados.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 p-5 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        Preencha os dados e simule para ver a recomendação de preço ano a ano.
      </div>
    );
  }

  const descontoPedidoFracao = descontoPedidoPct / 100;
  const anosOrdenados = [...resultados].sort((a, b) => a.ano - b.ano);
  const primeiroAnoQueNaoCabe = anosOrdenados.find(
    (r) => r.descontoMaximoPct === null || descontoPedidoFracao > r.descontoMaximoPct,
  );

  return (
    <div
      className={`rounded-lg border p-5 ${
        resultado.alertaDisparado
          ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
          : "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Recomendação · {resultado.ano}
      </p>
      <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-50">
        {resultado.mensagemRecomendacao}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Preço</dt>
          <dd className="font-semibold">R$ {formatarReais(resultado.preco)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Piso</dt>
          <dd className="font-semibold">R$ {formatarReais(resultado.piso)}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Teto da praça</dt>
          <dd className="font-semibold">{resultado.teto !== null ? `R$ ${formatarReais(resultado.teto)}` : "—"}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 dark:text-zinc-400">Desconto máximo</dt>
          <dd className="font-semibold">
            {resultado.descontoMaximoPct !== null ? `${formatarPct(resultado.descontoMaximoPct)}%` : "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-current/10 pt-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            Desconto pedido pelo cliente (%)
          </span>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="0.5"
              value={descontoPedidoPct}
              onChange={(e) => onDescontoPedidoChange(Number(e.target.value))}
              className="w-full"
            />
            <input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={descontoPedidoPct}
              onChange={(e) => onDescontoPedidoChange(Number(e.target.value) || 0)}
              className="w-20 rounded border border-zinc-300 px-2 py-1 text-right dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </label>

        <p className="mt-3 text-sm font-medium text-zinc-900 dark:text-zinc-50">
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
                title={
                  r.descontoMaximoPct !== null
                    ? `${r.ano}: desconto máximo ${formatarPct(r.descontoMaximoPct)}%`
                    : `${r.ano}: sem desconto máximo calculável`
                }
                className={`rounded px-2 py-1 text-xs font-medium ${
                  cabe
                    ? "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300"
                    : "bg-red-600/15 text-red-800 dark:text-red-300"
                }`}
              >
                {r.ano}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}
