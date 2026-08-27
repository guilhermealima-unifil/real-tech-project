import type { ResultadoAno } from "@/lib/motor";
import { classificarStatusPreco, type StatusPreco } from "@/lib/analiseResultado";
import { leituraFaixa } from "@/lib/frases";

interface LeituraFaixaProps {
  resultado: ResultadoAno;
}

/** Cor por status — mesma paleta semântica já usada em ResumoResultado/ComparacaoCenarios (sucesso/aviso/perigo), não a cor de destaque ("primary") que antes marcava "isto é a decisão". */
const BORDA_STATUS: Record<StatusPreco, string> = {
  dentro_da_faixa: "border-success/50",
  acima_teto: "border-warning/50",
  abaixo_piso: "border-danger/50",
  faixa_inviavel: "border-danger/50",
};

/**
 * "Leitura da faixa" — ANÁLISE neutra do status do preço no ano/estratégia
 * selecionados (ver frases.ts, `leituraFaixa`), não uma RECOMENDAÇÃO: só
 * interpreta piso/teto/preço/desconto disponível, que `ResultadoAno` já
 * carrega — não conhece prioridade do empresário, elasticidade nem reação de
 * mercado. Substitui a antiga "Ação recomendada" do header (removida): esta
 * leitura mora dentro da aba "Faixa viável", logo abaixo do seletor de
 * estratégia (ver NavegacaoAnalise.tsx) e antes do preço da estratégia
 * (`ResumoResultado`) — a mesma seção cujos dados ela interpreta.
 *
 * Deliberadamente sem o número de desconto disponível no título: quando há
 * folga, `ResumoResultado` já mostra o percentual exato logo abaixo
 * ("Limite seguro") — repetir o mesmo número aqui não adiciona clareza, só
 * duplica.
 */
export function LeituraFaixa({ resultado }: LeituraFaixaProps) {
  const status = classificarStatusPreco(resultado.preco, resultado.piso, resultado.teto);
  const leitura = leituraFaixa({
    status,
    preco: resultado.preco,
    piso: resultado.piso,
    teto: resultado.teto,
    descontoMaximoPct: resultado.descontoMaximoPct,
  });

  return (
    <div className={`border-l-2 pl-2.5 ${BORDA_STATUS[status]}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        Leitura da faixa
      </p>
      <p className="mt-0.5 text-sm font-medium text-text-primary">{leitura.titulo}</p>
      {leitura.complemento && (
        <p className="mt-0.5 text-xs text-text-secondary">{leitura.complemento}</p>
      )}
    </div>
  );
}
