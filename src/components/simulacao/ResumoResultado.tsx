import type { ResultadoAno } from "@/lib/motor";
import {
  formatarPct,
  formatarReais,
  mensagemPrecoRecomendado,
  mensagemStatusPreco,
} from "@/lib/frases";
import {
  calcularDiferencaPreco,
  calcularPrecoRecomendado,
  classificarStatusPreco,
  type StatusPreco,
} from "@/lib/analiseResultado";

interface ResumoResultadoProps {
  resultado: ResultadoAno;
}

const ROTULO_STATUS: Record<StatusPreco, { rotulo: string; classe: string }> = {
  abaixo_piso: { rotulo: "Abaixo do piso", classe: "bg-danger/10 text-danger" },
  dentro_da_faixa: { rotulo: "Dentro da faixa viável", classe: "bg-success/10 text-success" },
  acima_teto: { rotulo: "Acima do teto da praça", classe: "bg-warning/10 text-warning" },
  faixa_inviavel: { rotulo: "Faixa inviável", classe: "bg-danger/10 text-danger" },
};

/**
 * Bloco principal do Resultado — responde "quanto eu devo cobrar" antes de
 * qualquer outra coisa na tela. O preço recomendado é o único elemento em
 * destaque de verdade (tamanho, `surface-elevated`); status, preço
 * analisado, diferença e desconto disponível são deliberadamente
 * secundários — não um grid de 4 números do mesmo peso. Nenhuma regra
 * tributária nova: só combina o que `simular()` e
 * src/lib/analiseResultado.ts já calculam.
 */
export function ResumoResultado({ resultado }: ResumoResultadoProps) {
  const status = classificarStatusPreco(resultado.preco, resultado.piso, resultado.teto);
  const precoRecomendado = calcularPrecoRecomendado(resultado);
  const diferenca =
    precoRecomendado !== null ? calcularDiferencaPreco(precoRecomendado, resultado.preco) : null;
  const valorDescontoMaximoReais = Math.max(resultado.preco - resultado.piso, 0);

  return (
    <section className="shadow-elevated rounded-xl bg-surface-elevated p-6 sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-primary">
          Preço recomendado · {resultado.ano}
        </h2>
        <span
          className={`inline-block shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${ROTULO_STATUS[status].classe}`}
        >
          {ROTULO_STATUS[status].rotulo}
        </span>
      </div>

      <p className="font-figures mt-3 text-5xl font-semibold tracking-tight text-text-primary sm:text-6xl">
        {precoRecomendado !== null ? `R$ ${formatarReais(precoRecomendado)}` : "Sem preço viável"}
      </p>

      <p className="mt-3 max-w-prose text-sm font-medium text-text-primary sm:text-base">
        {mensagemPrecoRecomendado({
          precoAtual: resultado.preco,
          precoRecomendado,
          diferencaValor: diferenca?.valor ?? null,
          diferencaPercentual: diferenca?.percentual ?? null,
        })}
      </p>

      <p className="mt-1.5 max-w-prose text-sm text-text-secondary">
        {mensagemStatusPreco({
          ano: resultado.ano,
          status,
          preco: resultado.preco,
          piso: resultado.piso,
          teto: resultado.teto,
        })}
      </p>

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3 border-t border-border pt-5">
        <div>
          <p className="text-xs text-muted">Preço analisado</p>
          <p className="font-figures mt-0.5 text-sm font-medium text-text-primary">
            R$ {formatarReais(resultado.preco)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Desconto disponível</p>
          <p className="font-figures mt-0.5 text-sm font-medium text-text-primary">
            {resultado.descontoMaximoPct !== null
              ? `${formatarPct(resultado.descontoMaximoPct)}% · até R$ ${formatarReais(valorDescontoMaximoReais)}`
              : "—"}
          </p>
        </div>
      </div>
    </section>
  );
}
