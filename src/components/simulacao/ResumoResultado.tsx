import type { ResultadoAno } from "@/lib/motor";
import { formatarPct, formatarReais, mensagemPrecoEstrategia, mensagemReajusteNecessario } from "@/lib/frases";
import { calcularDiferencaPreco, classificarStatusPreco, type StatusPreco } from "@/lib/analiseResultado";

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
 * Card de evidência do preço, dentro da aba "Faixa viável" (ver
 * NavegacaoAnalise.tsx) — responde "que preço a estratégia produz e ele
 * preserva a margem mínima?" com o número e o que o sustenta (status,
 * diferença quando existe, desconto disponível). O header sticky
 * (HeaderAnalise.tsx) é só contexto/ações globais, sem nenhuma leitura de
 * status — essa leitura mora nesta aba, via `LeituraFaixa` (neutra, logo
 * acima, baseada em `classificarStatusPreco`).
 *
 * O número principal é sempre `resultado.preco` — o preço que a fórmula/
 * estratégia produz, nunca uma correção automática (auditoria:
 * `calcularPrecoRecomendado`, src/lib/analiseResultado.ts, mostrou que "Preço
 * recomendado" não era uma recomendação comercial independente; na maioria
 * dos estados ele só repetia `preco`, e em `acima_teto` chamá-lo de
 * "recomendado" era enganoso, pois o teto nunca era usado para limitar o
 * valor). Não existe mais um segundo card "Preço analisado" repetindo o
 * mesmo número.
 *
 * Só em `abaixo_piso` existe informação nova a mostrar: o preço necessário
 * para restaurar a margem mínima é literalmente `resultado.piso` (a mesma
 * leitura que `calcularPrecoRecomendado` já fazia nesse branch) — mostrado
 * como bloco à parte, nunca como se fosse uma recomendação comercial mais
 * ampla.
 *
 * NÃO renderiza `resultado.mensagemRecomendacao` (auditoria: copy derivável
 * dos mesmos dados, com um gap semântico em `acima_teto` que podia
 * contradizer `LeituraFaixa` — ver Caso C). O campo continua calculado por
 * `recomendacaoParaAno` dentro de `simular()` e persistido normalmente —
 * só deixou de ter consumidor visual.
 */
export function ResumoResultado({ resultado }: ResumoResultadoProps) {
  const status = classificarStatusPreco(resultado.preco, resultado.piso, resultado.teto);
  const abaixoDoPiso = status === "abaixo_piso";
  const diferencaParaPiso = abaixoDoPiso
    ? calcularDiferencaPreco(resultado.piso, resultado.preco)
    : null;
  const valorDescontoMaximoReais = Math.max(resultado.preco - resultado.piso, 0);

  return (
    <section className="shadow-elevated rounded-xl bg-surface-elevated p-6 sm:p-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xs font-medium uppercase tracking-wide text-primary">
          Preço da estratégia · {resultado.ano}
        </h2>
        <span
          className={`inline-block shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${ROTULO_STATUS[status].classe}`}
        >
          {ROTULO_STATUS[status].rotulo}
        </span>
      </div>

      <p className="font-figures mt-3 text-5xl font-semibold tracking-tight text-text-primary sm:text-6xl">
        R$ {formatarReais(resultado.preco)}
      </p>

      {!abaixoDoPiso && (
        <p className="mt-3 max-w-prose text-sm font-medium text-text-primary sm:text-base">
          {mensagemPrecoEstrategia({ precoEstrategia: resultado.preco, status })}
        </p>
      )}

      {abaixoDoPiso && diferencaParaPiso && (
        <div className="mt-4 rounded-lg bg-danger/10 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-danger">
            Para preservar sua margem mínima
          </p>
          <p className="font-figures mt-1 text-2xl font-semibold text-text-primary">
            R$ {formatarReais(resultado.piso)}
          </p>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-danger">Reajuste necessário</p>
          <p className="font-figures mt-0.5 text-lg font-semibold text-danger">
            +R$ {formatarReais(diferencaParaPiso.valor)}
          </p>
          <p className="mt-2 text-sm text-text-primary">
            {mensagemReajusteNecessario({
              diferencaValor: diferencaParaPiso.valor,
              diferencaPercentual: diferencaParaPiso.percentual,
            })}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3 border-t border-border pt-5">
        <div>
          <p className="text-xs text-muted">Limite seguro</p>
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
