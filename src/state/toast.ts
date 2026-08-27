export type ToastVariant = "success" | "error" | "info";

export interface ToastInput {
  variant: ToastVariant;
  title: string;
  description?: string;
}

export interface ToastItem extends ToastInput {
  id: string;
  durationMs: number;
}

export type ToastAction =
  | { type: "ADICIONAR"; toast: ToastItem }
  | { type: "REMOVER"; id: string };

export const LIMITE_TOASTS_VISIVEIS = 3;
export const DURACAO_TOAST_MS: Record<ToastVariant, number> = {
  success: 5_000,
  info: 5_000,
  error: 8_000,
};

/**
 * Estado efêmero e deliberadamente mínimo: mensagens novas entram no fim,
 * o excesso remove as mais antigas e remoções desconhecidas são inofensivas.
 */
export function toastReducer(estado: ToastItem[], acao: ToastAction): ToastItem[] {
  if (acao.type === "ADICIONAR") {
    return [...estado, acao.toast].slice(-LIMITE_TOASTS_VISIVEIS);
  }
  return estado.filter((toast) => toast.id !== acao.id);
}
