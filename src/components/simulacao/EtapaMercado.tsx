"use client";

import { useSimulation } from "@/state/SimulationProvider";
import { CampoNumerico } from "./CampoNumerico";

/**
 * Etapa 3 do wizard — preço da praça (opcional) e um resumo compacto do
 * que já foi preenchido, para pegar erro óbvio antes de simular. Não é uma
 * tela de revisão: usa `surface-elevated`/`shadow-elevated` (reservados na
 * fundação de tokens para exatamente este tipo de momento — "antes de
 * confirmar") em vez de mais um card com borda, para não empilhar card
 * dentro de card sobre a superfície do wizard.
 */
export function EtapaMercado() {
  const { state, atualizarCampoForm } = useSimulation();
  const { form, catalogo } = state;

  const ramoSelecionado = catalogo.ramos.find((r) => r.id === form.ramoId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
          Mercado
        </h2>
        <p className="mt-1.5 text-sm text-text-secondary">
          O que a concorrência pratica — opcional, normalmente chega no
          momento da venda.
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Preço da praça (opcional)
        </p>
        <div className="grid grid-cols-2 gap-4 sm:max-w-sm">
          <CampoNumerico
            label="Preço da praça — mínimo"
            srOnlyLabel
            prefixo="R$"
            placeholder="mínimo"
            value={form.tetoPracaMin}
            onChange={(valor) => atualizarCampoForm("tetoPracaMin", valor)}
          />
          <CampoNumerico
            label="Preço da praça — máximo"
            srOnlyLabel
            prefixo="R$"
            placeholder="máximo"
            value={form.tetoPracaMax}
            onChange={(valor) => atualizarCampoForm("tetoPracaMax", valor)}
          />
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          Não precisa ter em mãos agora — dá para simular sem isso.
        </p>
      </div>

      <div className="shadow-elevated rounded-lg bg-surface-elevated p-5">
        <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
          Confira antes de simular
        </p>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-text-secondary">Custo de compra</dt>
            <dd className="font-figures font-medium text-text-primary">
              {form.custoCompra ? `R$ ${form.custoCompra}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">Ramo</dt>
            <dd className="font-medium text-text-primary">
              {ramoSelecionado?.rotulo ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">
              {form.formulaTipo === "markup" ? "Markup" : "Despesa fixa"}
            </dt>
            <dd className="font-figures font-medium text-text-primary">
              {form.formulaTipo === "markup"
                ? form.markupPct
                  ? `${form.markupPct}%`
                  : "—"
                : form.despesaFixaPct
                  ? `${form.despesaFixaPct}%`
                  : "—"}
            </dd>
          </div>
          {form.formulaTipo === "multiplicador" && (
            <div>
              <dt className="text-xs text-text-secondary">Margem-alvo</dt>
              <dd className="font-figures font-medium text-text-primary">
                {form.margemAlvoPct ? `${form.margemAlvoPct}%` : "—"}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-text-secondary">Margem mínima</dt>
            <dd className="font-figures font-medium text-text-primary">
              {form.margemMinimaPct ? `${form.margemMinimaPct}%` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-secondary">Pagamento ao fornecedor</dt>
            <dd className="font-figures font-medium text-text-primary">
              {form.prazoPagamentoFornecedorDias
                ? `${form.prazoPagamentoFornecedorDias} dias`
                : "—"}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
