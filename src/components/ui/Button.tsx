"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Mostra um spinner e desabilita o botão, sem exigir lógica própria de quem chama. */
  loading?: boolean;
  children: ReactNode;
}

const BASE =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const VARIANTES: Record<ButtonVariant, string> = {
  primary: "bg-primary text-surface hover:opacity-90",
  secondary: "border border-border bg-surface text-text-primary hover:bg-background",
  ghost: "text-text-secondary hover:bg-background hover:text-text-primary",
};

const TAMANHOS: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

/**
 * Primitive de botão — abstrai VISUAL e comportamento comum (variante,
 * tamanho, loading), não semântica: continua sendo um `<button>` real, e
 * quem chama decide `type`/`onClick`/`aria-*`. Não sabe o que é "Salvar
 * simulação" nem nenhuma outra ação de domínio (ver CLAUDE.md desta etapa,
 * Parte 3) — isso fica nos componentes de src/components/simulacao.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "secondary",
    size = "md",
    loading = false,
    disabled,
    className = "",
    children,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${BASE} ${VARIANTES[variant]} ${TAMANHOS[size]} ${className}`.trim()}
      {...props}
    >
      {loading && (
        <svg
          className="h-3.5 w-3.5 shrink-0 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
          />
        </svg>
      )}
      {children}
    </button>
  );
});
