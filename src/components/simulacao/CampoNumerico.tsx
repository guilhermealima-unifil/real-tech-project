"use client";

import { ROTULO_CAMPO, AJUDA_CAMPO } from "./estiloCampo";

interface CampoNumericoProps {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  prefixo?: string;
  sufixo?: string;
  placeholder?: string;
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
  helper?: string;
  /** Rótulo só para leitor de tela — usado quando o afixo (ex. "R$") já comunica o contexto visualmente. */
  srOnlyLabel?: boolean;
}

/**
 * Campo numérico padrão do wizard: rótulo + input com afixo (R$/%/dias) +
 * texto de ajuda, usando os tokens visuais globais. `font-figures` no
 * afixo e no valor digitado — o número lê como dado financeiro, não texto
 * comum. Clicar em qualquer parte do rótulo (inclusive o afixo) foca o
 * input, por estarem todos dentro do mesmo `<label>`.
 */
export function CampoNumerico({
  label,
  value,
  onChange,
  prefixo,
  sufixo,
  placeholder,
  required,
  min = "0",
  max,
  step = "0.01",
  helper,
  srOnlyLabel = false,
}: CampoNumericoProps) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label className="flex flex-col gap-1.5">
        <span className={srOnlyLabel ? "sr-only" : ROTULO_CAMPO}>{label}</span>
        <span className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          {prefixo && <span className="font-figures shrink-0 text-sm text-muted">{prefixo}</span>}
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            required={required}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="font-figures w-full min-w-0 bg-transparent py-2.5 text-sm text-text-primary outline-none placeholder:font-sans placeholder:text-muted"
          />
          {sufixo && <span className="font-figures shrink-0 text-sm text-muted">{sufixo}</span>}
        </span>
      </label>
      {helper && <p className={AJUDA_CAMPO}>{helper}</p>}
    </div>
  );
}
