import type { CenarioRepasse } from "@/lib/motor";

const DESCRICAO_CENARIO: Record<CenarioRepasse, string> = {
  integral: "Protege a margem, mas exige maior reajuste de preço.",
  gradual: "Distribui o reajuste, pressionando temporariamente a margem.",
  absorcao: "Mantém o preço mais estável, mas pressiona mais a margem.",
};

interface CardCenarioProps {
  cenario: CenarioRepasse;
  rotulo: string;
}

/**
 * Cabeçalho compacto de uma coluna da comparação. O nome histórico do
 * componente é preservado para manter a mudança localizada, mas ele não
 * contém mais um relatório completo por cenário.
 */
export function CardCenario({ cenario, rotulo }: CardCenarioProps) {
  return (
    <article className="rounded-lg border border-border bg-surface p-3 sm:p-4">
      <h3 className="text-sm font-semibold text-text-primary">{rotulo}</h3>
      <p className="mt-1 text-xs leading-relaxed text-text-secondary">
        {DESCRICAO_CENARIO[cenario]}
      </p>
    </article>
  );
}
