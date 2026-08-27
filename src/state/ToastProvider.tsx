"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { ToastViewport } from "@/components/ui/Toast";
import {
  DURACAO_TOAST_MS,
  toastReducer,
  type ToastInput,
} from "./toast";

interface ToastContextValue {
  toast: (input: ToastInput) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, []);
  const proximoIdRef = useRef(0);

  const toast = useCallback((input: ToastInput): string => {
    const id = `toast-${++proximoIdRef.current}`;
    dispatch({
      type: "ADICIONAR",
      toast: {
        ...input,
        id,
        durationMs: DURACAO_TOAST_MS[input.variant],
      },
    });
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    dispatch({ type: "REMOVER", id });
  }, []);

  const value = useMemo(() => ({ toast, dismissToast }), [dismissToast, toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onRemover={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast precisa ser usado dentro de <ToastProvider>.");
  }
  return context;
}
