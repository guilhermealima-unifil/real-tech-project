"use client";

import { useRef } from "react";
import type { CenarioRepasse } from "@/lib/motor";
import { Select } from "@/components/ui/Select";

/** Rótulos das estratégias de repasse — reaproveitado por ComparacaoCenarios.tsx (mesmo nome exibido aqui e nos cards de comparação). */
export const CENARIOS: { valor: CenarioRepasse; rotulo: string }[] = [
  { valor: "integral", rotulo: "Repasse integral" },
  { valor: "gradual", rotulo: "Repasse gradual" },
  { valor: "absorcao", rotulo: "Absorção" },
];

const RADIO_BASE =
  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors";
const RADIO_SELECIONADO = "border-primary/30 bg-primary/10 font-semibold text-primary";
const RADIO_NAO_SELECIONADO =
  "border-border text-text-secondary hover:border-text-secondary hover:text-text-primary";

interface SeletorEstrategiaRepasseProps {
  estrategiaSelecionada: CenarioRepasse;
  onSelecionarEstrategia: (estrategia: CenarioRepasse) => void;
  /** Modelo markup: preço não reage a estratégia de repasse (ver motor.ts) — o controle fica visível, mas desabilitado. */
  estrategiaIrrelevante: boolean;
}

/**
 * Controle de estratégia de repasse — vive dentro da aba "Faixa viável" (ver
 * NavegacaoAnalise.tsx), não mais no header global: só essa análise reage de
 * verdade a Integral/Gradual/Absorção (Negociação, Impacto no caixa e
 * Comparar estratégias não dependem dela, ver ComparacaoCenarios.tsx e
 * AnaliseDesconto/ImpactoCaixaChart, que nem recebem essa prop).
 *
 * Extraído do antigo `HeaderAnalise` (mesmo par Select mobile/radiogroup
 * desktop, mesmo estado do chamador, sem duplicar) para não prometer, via
 * posição no header, uma relação causal que o produto não tem mais.
 */
export function SeletorEstrategiaRepasse({
  estrategiaSelecionada,
  onSelecionarEstrategia,
  estrategiaIrrelevante,
}: SeletorEstrategiaRepasseProps) {
  const radiosRef = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(evento: React.KeyboardEvent<HTMLButtonElement>, indice: number) {
    if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
    evento.preventDefault();
    const delta = evento.key === "ArrowRight" ? 1 : -1;
    const proximoIndice = (indice + delta + CENARIOS.length) % CENARIOS.length;
    onSelecionarEstrategia(CENARIOS[proximoIndice].valor);
    radiosRef.current[proximoIndice]?.focus();
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-border bg-surface px-4 py-3 sm:px-5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted">
        Estratégia de repasse
      </span>

      <div className="sm:hidden">
        <Select
          aria-label="Estratégia de repasse"
          disabled={estrategiaIrrelevante}
          value={estrategiaSelecionada}
          onChange={(e) => onSelecionarEstrategia(e.target.value as CenarioRepasse)}
          options={CENARIOS.map((estrategia) => ({ value: estrategia.valor, label: estrategia.rotulo }))}
          className="w-full"
        />
      </div>

      <div
        role="radiogroup"
        aria-label="Estratégia de repasse"
        aria-orientation="horizontal"
        className="hidden flex-wrap gap-1.5 sm:flex"
      >
        {CENARIOS.map((estrategia, indice) => (
          <button
            key={estrategia.valor}
            ref={(el) => {
              radiosRef.current[indice] = el;
            }}
            type="button"
            role="radio"
            aria-checked={estrategiaSelecionada === estrategia.valor}
            aria-disabled={estrategiaIrrelevante}
            tabIndex={estrategiaSelecionada === estrategia.valor ? 0 : -1}
            disabled={estrategiaIrrelevante}
            onClick={() => onSelecionarEstrategia(estrategia.valor)}
            onKeyDown={(e) => onKeyDown(e, indice)}
            className={
              RADIO_BASE +
              " " +
              (estrategiaIrrelevante
                ? "cursor-not-allowed border-border text-muted"
                : estrategiaSelecionada === estrategia.valor
                  ? RADIO_SELECIONADO
                  : RADIO_NAO_SELECIONADO)
            }
          >
            {estrategia.rotulo}
          </button>
        ))}
      </div>

      {estrategiaIrrelevante && (
        <p className="text-xs text-text-secondary">
          Estratégia de repasse não se aplica ao modelo de markup — o preço já é fixo por definição
          (custo × (1 + markup)); quem varia é o lucro líquido, não o preço.
        </p>
      )}
    </div>
  );
}
