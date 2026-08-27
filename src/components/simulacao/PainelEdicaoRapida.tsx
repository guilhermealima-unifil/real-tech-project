"use client";

import { useEffect, useRef, useState } from "react";
import { useSimulation } from "@/state/SimulationProvider";
import type { SimulationFormState, SimulationResult } from "@/state/simulacaoReducer";
import { montarDraftDeResultado, validarDraftEdicaoRapida } from "@/state/edicaoRapida";
import { CampoNumerico } from "./CampoNumerico";
import { ROTULO_CAMPO, CAMPO_SELECT } from "./estiloCampo";

interface PainelEdicaoRapidaProps {
  resultado: SimulationResult;
  onFechar: () => void;
}

const LEGENDA_GRUPO = "text-xs font-medium uppercase tracking-wide text-muted";

/**
 * Edição rápida do Resultado — "Editar dados" deixou de mandar de volta
 * para a Etapa Operação do wizard (ver ResultadoSimulacao.tsx) e agora
 * abre este painel por cima da tela, para responder "e se…" sem perder o
 * resultado, o cenário, o ano ou a aba que o usuário estava vendo.
 *
 * DRAFT LOCAL (Parte 4 desta etapa): `draft` só existe enquanto este
 * componente está montado. `ResultadoSimulacao` só monta este componente
 * quando o painel está aberto (`{editando && <PainelEdicaoRapida .../>}`)
 * — Cancelar/fechar desmonta, e o draft desaparece sozinho, sem precisar
 * de nenhuma lógica de "desfazer". Nada aqui escreve em `state.form`
 * enquanto o usuário digita; só ao clicar "Recalcular" (ver aoRecalcular).
 *
 * Valores iniciais vêm de `resultado` (o snapshot que gerou a tela atual),
 * não de `state.form` ao vivo — ver montarDraftDeResultado.
 */
export function PainelEdicaoRapida({ resultado, onFechar }: PainelEdicaoRapidaProps) {
  const { state, executarSimulacao } = useSimulation();
  const { catalogo, ui } = state;

  const [draft, setDraft] = useState<SimulationFormState>(() => montarDraftDeResultado(resultado));
  const [erros, setErros] = useState<string[]>([]);

  const fecharRef = useRef<HTMLButtonElement | null>(null);

  // Foco inicial no botão de fechar — primeiro elemento interativo do
  // painel, alcançável de imediato por teclado assim que ele abre.
  useEffect(() => {
    fecharRef.current?.focus();
  }, []);

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") onFechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  function atualizarDraft<K extends keyof SimulationFormState>(
    campo: K,
    valor: SimulationFormState[K],
  ) {
    setDraft((atual) => ({ ...atual, [campo]: valor }));
  }

  async function aoRecalcular() {
    const errosDoDraft = validarDraftEdicaoRapida(draft);
    if (errosDoDraft.length > 0) {
      setErros(errosDoDraft);
      return;
    }
    setErros([]);
    // Mesma executarSimulacao() do wizard — só passa o draft diretamente
    // em vez de depender de state.form já refletir a edição (ver
    // SimulationProvider.tsx). O retorno diz, sem reler `state` (que
    // ficaria desatualizado dentro deste closure assíncrono), se deve
    // fechar o painel ou mostrar os erros que o motor/validação reportou.
    const resultadoExecucao = await executarSimulacao(draft);
    if (resultadoExecucao.ok) {
      onFechar();
    } else {
      setErros(
        resultadoExecucao.erros.length > 0
          ? resultadoExecucao.erros
          : ["Não foi possível recalcular. Tente novamente."],
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:flex-row sm:justify-end">
      <div className="fixed inset-0 bg-text-primary/40" aria-hidden="true" onClick={onFechar} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-edicao-rapida"
        className="shadow-elevated relative flex max-h-[85vh] w-full flex-col rounded-t-xl border-t border-border bg-surface-elevated sm:h-full sm:max-h-none sm:w-[420px] sm:max-w-[90vw] sm:rounded-t-none sm:rounded-l-xl sm:border-l sm:border-t-0"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id="titulo-edicao-rapida" className="text-base font-semibold text-text-primary">
            Editar simulação
          </h2>
          <button
            ref={fecharRef}
            type="button"
            onClick={onFechar}
            className="rounded-md px-2 py-1 text-sm font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
          >
            Fechar
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
          {erros.length > 0 && (
            <ul className="list-inside list-disc rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
              {erros.map((erro) => (
                <li key={erro}>{erro}</li>
              ))}
            </ul>
          )}

          <fieldset className="flex flex-col gap-4">
            <legend className={LEGENDA_GRUPO}>Operação</legend>

            <CampoNumerico
              label="Custo de compra"
              prefixo="R$"
              required
              value={draft.custoCompra}
              onChange={(valor) => atualizarDraft("custoCompra", valor)}
            />

            <label className="flex flex-col gap-1.5 text-sm">
              <span className={ROTULO_CAMPO}>Ramo</span>
              <select
                required
                value={draft.ramoId}
                onChange={(e) => atualizarDraft("ramoId", e.target.value)}
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
            </label>

            <fieldset className="flex flex-col gap-1.5">
              <legend className={`mb-1 ${ROTULO_CAMPO}`}>
                Sua margem já inclui impostos e despesas?
              </legend>
              <div className="flex flex-col gap-1.5 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="edicao-rapida-formula"
                    className="accent-[var(--primary)]"
                    checked={draft.formulaTipo === "markup"}
                    onChange={() => atualizarDraft("formulaTipo", "markup")}
                  />
                  Sim — uso um markup único
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="edicao-rapida-formula"
                    className="accent-[var(--primary)]"
                    checked={draft.formulaTipo === "multiplicador"}
                    onChange={() => atualizarDraft("formulaTipo", "multiplicador")}
                  />
                  Não — calculo despesas e margem separadas
                </label>
              </div>
            </fieldset>
          </fieldset>

          <fieldset className="flex flex-col gap-4 border-t border-border pt-5">
            <legend className={LEGENDA_GRUPO}>Margens e custos</legend>

            {draft.formulaTipo === "multiplicador" ? (
              <CampoNumerico
                label="Despesa fixa"
                sufixo="%"
                required
                max="100"
                step="0.1"
                value={draft.despesaFixaPct}
                onChange={(valor) => atualizarDraft("despesaFixaPct", valor)}
              />
            ) : (
              <CampoNumerico
                label="Markup"
                sufixo="%"
                required
                step="0.1"
                value={draft.markupPct}
                onChange={(valor) => atualizarDraft("markupPct", valor)}
              />
            )}

            {draft.formulaTipo === "multiplicador" && (
              <CampoNumerico
                label="Margem-alvo"
                sufixo="%"
                required
                max="100"
                step="0.1"
                value={draft.margemAlvoPct}
                onChange={(valor) => atualizarDraft("margemAlvoPct", valor)}
              />
            )}

            <CampoNumerico
              label="Margem mínima — o piso"
              sufixo="%"
              required
              max="100"
              step="0.1"
              value={draft.margemMinimaPct}
              onChange={(valor) => atualizarDraft("margemMinimaPct", valor)}
            />

            <CampoNumerico
              label="Prazo de pagamento ao fornecedor"
              sufixo="dias"
              required
              min="0"
              step="1"
              value={draft.prazoPagamentoFornecedorDias}
              onChange={(valor) => atualizarDraft("prazoPagamentoFornecedorDias", valor)}
            />
          </fieldset>

          <fieldset className="flex flex-col gap-3 border-t border-border pt-5">
            <legend className={LEGENDA_GRUPO}>Mercado</legend>
            <div className="grid grid-cols-2 gap-3">
              <CampoNumerico
                label="Preço da praça — mínimo"
                srOnlyLabel
                prefixo="R$"
                placeholder="mínimo"
                value={draft.tetoPracaMin}
                onChange={(valor) => atualizarDraft("tetoPracaMin", valor)}
              />
              <CampoNumerico
                label="Preço da praça — máximo"
                srOnlyLabel
                prefixo="R$"
                placeholder="máximo"
                value={draft.tetoPracaMax}
                onChange={(valor) => atualizarDraft("tetoPracaMax", valor)}
              />
            </div>
          </fieldset>
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border px-5 py-4">
          <button
            type="button"
            onClick={onFechar}
            disabled={ui.isSimulating}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={aoRecalcular}
            disabled={ui.isSimulating}
            className="rounded-lg bg-text-primary px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {ui.isSimulating ? "Recalculando…" : "Recalcular"}
          </button>
        </footer>
      </div>
    </div>
  );
}
