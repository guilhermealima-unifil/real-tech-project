"use client";

import { useSimulation } from "@/state/SimulationProvider";
import { CampoNumerico } from "./CampoNumerico";

/**
 * Etapa 2 do wizard — despesa/markup (conforme a fórmula escolhida na
 * Etapa 1), margem-alvo e margem mínima agrupadas sob "Composição do
 * preço"; prazo de pagamento relacionado, mas separado por um divisor sob
 * "Fluxo de caixa" — agrupamento por rótulo, não por card dentro de card.
 * Mesmas condições/campos do formulário original.
 */
export function EtapaMargens() {
  const { state, atualizarCampoForm } = useSimulation();
  const { form } = state;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
          Margens e custos
        </h2>
        <p className="mt-1.5 text-sm text-text-secondary">
          O piso que protege sua operação e o prazo que você já pratica com o
          fornecedor.
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Composição do preço
        </p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {form.formulaTipo === "multiplicador" ? (
            <CampoNumerico
              label="Despesa fixa"
              sufixo="%"
              required
              max="100"
              step="0.1"
              value={form.despesaFixaPct}
              onChange={(valor) => atualizarCampoForm("despesaFixaPct", valor)}
            />
          ) : (
            <CampoNumerico
              label="Markup"
              sufixo="%"
              required
              step="0.1"
              value={form.markupPct}
              onChange={(valor) => atualizarCampoForm("markupPct", valor)}
            />
          )}

          {form.formulaTipo === "multiplicador" && (
            <CampoNumerico
              label="Margem-alvo"
              sufixo="%"
              required
              max="100"
              step="0.1"
              value={form.margemAlvoPct}
              onChange={(valor) => atualizarCampoForm("margemAlvoPct", valor)}
            />
          )}

          <CampoNumerico
            label="Margem mínima — o piso"
            sufixo="%"
            required
            max="100"
            step="0.1"
            value={form.margemMinimaPct}
            onChange={(valor) => atualizarCampoForm("margemMinimaPct", valor)}
          />
        </div>
      </div>

      <div className="border-t border-border pt-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Fluxo de caixa
        </p>
        <div className="sm:max-w-xs">
          <CampoNumerico
            label="Prazo de pagamento ao fornecedor"
            sufixo="dias"
            required
            min="0"
            step="1"
            value={form.prazoPagamentoFornecedorDias}
            onChange={(valor) =>
              atualizarCampoForm("prazoPagamentoFornecedorDias", valor)
            }
            helper="Usado só no impacto no caixa, dentro do resultado."
          />
        </div>
      </div>
    </div>
  );
}
