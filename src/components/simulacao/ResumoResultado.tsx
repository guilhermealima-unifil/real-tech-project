import type { ResultadoAno } from "@/lib/motor";
import { formatarPct, formatarReais, mensagemStatusPreco } from "@/lib/frases";
import {
  calcularDiferencaPreco,
  calcularPrecoRecomendado,
  classificarStatusPreco,
} from "@/lib/analiseResultado";

interface ResumoResultadoProps {
  resultado: ResultadoAno;
}

const ROTULO_STATUS: Record<
  ReturnType<typeof classificarStatusPreco>,
  { rotulo: string; classe: string }
> = {
  abaixo_piso: {
    rotulo: "Abaixo do piso",
    classe: "bg-red-600/15 text-red-800 dark:text-red-300",
  },
  dentro_da_faixa: {
    rotulo: "Dentro da faixa viável",
    classe: "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300",
  },
  acima_teto: {
    rotulo: "Acima do teto da praça",
    classe: "bg-amber-600/15 text-amber-800 dark:text-amber-300",
  },
};

/**
 * Resumo executivo — topo da área de Resultado. Responde direto "quanto eu
 * deveria cobrar", combinando valores que `simular()` já devolve
 * (preco/piso/teto/descontoMaximoPct) com derivações puramente matemáticas
 * de apresentação (src/lib/analiseResultado.ts). Nenhuma regra tributária
 * nova — ver PENDÊNCIA no relatório da etapa sobre o preço recomendado não
 * fazer cap automático no teto da praça.
 */
export function ResumoResultado({ resultado }: ResumoResultadoProps) {
  const status = classificarStatusPreco(resultado.preco, resultado.piso, resultado.teto);
  const precoRecomendado = calcularPrecoRecomendado(resultado);
  const diferenca =
    precoRecomendado !== null ? calcularDiferencaPreco(precoRecomendado, resultado.preco) : null;
  const valorDescontoMaximoReais = Math.max(resultado.preco - resultado.piso, 0);

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Resumo executivo · {resultado.ano}
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Preço analisado</dt>
          <dd className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            R$ {formatarReais(resultado.preco)}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Status</dt>
          <dd className="mt-1">
            <span
              className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${ROTULO_STATUS[status].classe}`}
            >
              {ROTULO_STATUS[status].rotulo}
            </span>
          </dd>
        </div>

        <div>
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Preço recomendado</dt>
          <dd className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {precoRecomendado !== null ? `R$ ${formatarReais(precoRecomendado)}` : "—"}
          </dd>
        </div>

        <div>
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">Diferença</dt>
          <dd
            className={
              "text-xl font-semibold " +
              (diferenca && diferenca.valor > 0
                ? "text-emerald-700 dark:text-emerald-400"
                : diferenca && diferenca.valor < 0
                  ? "text-red-700 dark:text-red-400"
                  : "text-zinc-900 dark:text-zinc-50")
            }
          >
            {diferenca
              ? `${diferenca.valor >= 0 ? "+" : ""}R$ ${formatarReais(diferenca.valor)}` +
                (diferenca.percentual !== null
                  ? ` (${diferenca.percentual >= 0 ? "+" : ""}${formatarPct(diferenca.percentual)}%)`
                  : "")
              : "—"}
          </dd>
        </div>
      </dl>

      <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
        {mensagemStatusPreco({
          ano: resultado.ano,
          status,
          preco: resultado.preco,
          piso: resultado.piso,
          teto: resultado.teto,
        })}
      </p>

      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
        Desconto ainda disponível:{" "}
        {resultado.descontoMaximoPct !== null ? (
          <>
            <strong>{formatarPct(resultado.descontoMaximoPct)}%</strong> — até R${" "}
            {formatarReais(valorDescontoMaximoReais)}
          </>
        ) : (
          "—"
        )}
      </p>
    </section>
  );
}
