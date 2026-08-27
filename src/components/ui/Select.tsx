"use client";

import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[];
}

/**
 * Primitive de seleção — continua um `<select>` real por baixo (teclado e
 * leitor de tela nativos, sem reimplementar navegação), mas sem nenhuma
 * aparência nativa do navegador: `appearance-none` remove o chrome padrão
 * e o `<svg>` ao lado desenha o indicador próprio. Não sabe o que são as
 * opções que recebe (ver CLAUDE.md desta etapa, Parte 3) — isso fica nos
 * componentes de src/components/simulacao.
 */
export function Select({ options, className = "", disabled, ...props }: SelectProps) {
  return (
    <span className="relative inline-flex">
      <select
        disabled={disabled}
        className={
          "appearance-none rounded-lg border border-border bg-surface py-2 pl-3.5 pr-9 text-sm text-text-primary " +
          "transition-colors focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 " +
          className
        }
        {...props}
      >
        {options.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={
          "pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-muted " +
          (disabled ? "opacity-50" : "")
        }
      >
        <path d="M5.5 7.5 10 12l4.5-4.5" />
      </svg>
    </span>
  );
}
