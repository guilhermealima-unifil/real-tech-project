"use client";

import { useSimulation } from "@/state/SimulationProvider";
import { CampoNumerico } from "./CampoNumerico";
import { ROTULO_CAMPO, CAMPO_SELECT, AJUDA_CAMPO } from "./estiloCampo";

/** Etapa 1 do wizard — custo, ramo e a pergunta que decide a fórmula (multiplicador vs. markup). Mesmos campos e semântica do formulário original. */
export function EtapaOperacao() {
  const { state, atualizarCampoForm } = useSimulation();
  const { form, catalogo } = state;

  const ramoSelecionado = catalogo.ramos.find((r) => r.id === form.ramoId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
          Vamos começar entendendo sua operação
        </h2>
        <p className="mt-1.5 text-sm text-text-secondary">
          Custo de compra, ramo e como você já pensa sua margem hoje.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <CampoNumerico
          label="Custo de compra"
          prefixo="R$"
          required
          value={form.custoCompra}
          onChange={(valor) => atualizarCampoForm("custoCompra", valor)}
        />

        <label className="flex flex-col gap-1.5 text-sm">
          <span className={ROTULO_CAMPO}>Ramo</span>
          <select
            required
            value={form.ramoId}
            onChange={(e) => atualizarCampoForm("ramoId", e.target.value)}
            className={CAMPO_SELECT}
          >
            <option value="" disabled>
              Selecione…
            </option>
            {catalogo.ramos.map((ramo) => (
              <option key={ramo.id} value={ramo.id}>
                {ramo.rotulo}
              </option>
            ))}
          </select>
          {ramoSelecionado && (
            <span className={AJUDA_CAMPO}>
              Alíquota sugerida:{" "}
              <span className="font-figures">{ramoSelecionado.aliquotaSugerida}%</span> —
              estimativa por ramo. A precisão do centavo é trabalho do contador.
            </span>
          )}
        </label>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className={`mb-1 ${ROTULO_CAMPO}`}>
          Sua margem já inclui impostos e despesas?
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label
            className={
              "flex cursor-pointer flex-col gap-1 rounded-lg border px-4 py-3 text-sm transition-colors " +
              (form.formulaTipo === "markup"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-text-secondary")
            }
          >
            <span className="flex items-center gap-2 font-medium text-text-primary">
              <input
                type="radio"
                name="formulaTipo"
                className="accent-[var(--primary)]"
                checked={form.formulaTipo === "markup"}
                onChange={() => atualizarCampoForm("formulaTipo", "markup")}
              />
              Sim — uso um markup único
            </span>
            <span className="pl-6 text-xs text-text-secondary">Ex.: Grupo In-Pacto</span>
          </label>

          <label
            className={
              "flex cursor-pointer flex-col gap-1 rounded-lg border px-4 py-3 text-sm transition-colors " +
              (form.formulaTipo === "multiplicador"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-text-secondary")
            }
          >
            <span className="flex items-center gap-2 font-medium text-text-primary">
              <input
                type="radio"
                name="formulaTipo"
                className="accent-[var(--primary)]"
                checked={form.formulaTipo === "multiplicador"}
                onChange={() => atualizarCampoForm("formulaTipo", "multiplicador")}
              />
              Não — calculo despesas e margem separadas
            </span>
            <span className="pl-6 text-xs text-text-secondary">Ex.: EletroLondrina</span>
          </label>
        </div>
      </fieldset>
    </div>
  );
}
