import type { EtapaWizard } from "@/state/simulacaoReducer";

const ETAPAS: { valor: EtapaWizard; numero: number; rotulo: string }[] = [
  { valor: "operacao", numero: 1, rotulo: "Operação" },
  { valor: "margens", numero: 2, rotulo: "Margens e custos" },
  { valor: "mercado", numero: 3, rotulo: "Mercado" },
];

/**
 * Indicador de progresso do wizard — stepper, não abas (ver
 * docs/06-design-system.md): etapas têm ordem obrigatória e avanço é
 * bloqueado por validação (SimulacaoWizard), então continua um `<nav>`/`<ol>`
 * não-interativo com `aria-current="step"`, nunca clicável. Migrado do
 * zinc/emerald cru para os tokens `primary` (etapa atual) e `success`
 * (concluída).
 */
export function IndicadorEtapas({ etapaAtual }: { etapaAtual: EtapaWizard }) {
  const indiceAtual = ETAPAS.findIndex((etapa) => etapa.valor === etapaAtual);

  return (
    <nav aria-label="Progresso da simulação">
      <ol className="flex items-center">
        {ETAPAS.map((etapa, indice) => {
          const concluida = indice < indiceAtual;
          const atual = indice === indiceAtual;
          const ultima = indice === ETAPAS.length - 1;

          return (
            <li
              key={etapa.valor}
              className={"flex items-center" + (ultima ? "" : " flex-1")}
              aria-current={atual ? "step" : undefined}
            >
              <span className="flex shrink-0 items-center gap-2">
                <span
                  className={
                    "font-figures flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold " +
                    (concluida
                      ? "bg-success text-white"
                      : atual
                        ? "bg-primary text-white"
                        : "border border-border text-muted")
                  }
                >
                  {concluida ? "✓" : etapa.numero}
                </span>
                <span
                  className={
                    "hidden text-xs sm:inline " +
                    (atual
                      ? "font-semibold text-text-primary"
                      : concluida
                        ? "text-text-secondary"
                        : "text-muted")
                  }
                >
                  {etapa.rotulo}
                </span>
              </span>
              {!ultima && (
                <span
                  aria-hidden="true"
                  className={"mx-3 h-px flex-1 " + (concluida ? "bg-success" : "bg-border")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
