"use client";

import { useEffect } from "react";
import type { ToastItem, ToastVariant } from "@/state/toast";

const ESTILO_VARIANTE: Record<
  ToastVariant,
  { icone: string; classeIcone: string }
> = {
  success: { icone: "✓", classeIcone: "bg-success/10 text-success" },
  error: { icone: "!", classeIcone: "bg-danger/10 text-danger" },
  info: { icone: "i", classeIcone: "bg-background text-text-secondary" },
};

function ToastVisual({
  toast,
  onRemover,
}: {
  toast: ToastItem;
  onRemover: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onRemover(toast.id), toast.durationMs);
    return () => window.clearTimeout(timer);
  }, [toast.durationMs, toast.id, onRemover]);

  const estilo = ESTILO_VARIANTE[toast.variant];
  const eErro = toast.variant === "error";

  return (
    <div
      role={eErro ? "alert" : "status"}
      aria-live={eErro ? "assertive" : "polite"}
      aria-atomic="true"
      className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-border bg-surface-elevated p-4 shadow-elevated"
    >
      <span
        aria-hidden="true"
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${estilo.classeIcone}`}
      >
        {estilo.icone}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
            {toast.description}
          </p>
        )}
      </div>

      <button
        type="button"
        aria-label={`Fechar notificação: ${toast.title}`}
        onClick={() => onRemover(toast.id)}
        className="shrink-0 rounded-md p-1 text-muted transition-colors hover:bg-background hover:text-text-primary"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          aria-hidden="true"
          className="h-4 w-4"
        >
          <path d="m5 5 10 10M15 5 5 15" />
        </svg>
      </button>
    </div>
  );
}

export function ToastViewport({
  toasts,
  onRemover,
}: {
  toasts: ToastItem[];
  onRemover: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notificações"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[70] flex flex-col gap-2 sm:left-auto sm:right-4 sm:w-full sm:max-w-sm lg:bottom-6 lg:right-6"
    >
      {toasts.map((toast) => (
        <ToastVisual key={toast.id} toast={toast} onRemover={onRemover} />
      ))}
    </div>
  );
}
