"use client";

import { ROTULO_CAMPO } from "@/components/simulacao/estiloCampo";

interface CampoTextoProps {
  label: string;
  type: "text" | "email" | "password";
  value: string;
  onChange: (valor: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  helper?: string;
}

/**
 * Campo de texto de login/cadastro — mesmo padrão visual de
 * CampoNumerico.tsx (rótulo + wrapper com foco em anel, label envolvendo o
 * input para associação implícita), sem prefixo/sufixo/font-figures
 * (não é um valor financeiro). Reaproveita ROTULO_CAMPO do wizard para o
 * rótulo nunca divergir visualmente entre as duas áreas do produto.
 */
export function CampoTexto({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  helper,
}: CampoTextoProps) {
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label className="flex flex-col gap-1.5">
        <span className={ROTULO_CAMPO}>{label}</span>
        <span className="flex items-center rounded-lg border border-border bg-surface px-3.5 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
          <input
            type={type}
            autoComplete={autoComplete}
            required={required}
            minLength={minLength}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full min-w-0 bg-transparent py-2.5 text-sm text-text-primary outline-none placeholder:text-muted"
          />
        </span>
      </label>
      {helper && <p className="text-xs text-text-secondary">{helper}</p>}
    </div>
  );
}
