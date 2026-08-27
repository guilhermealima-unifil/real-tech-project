"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/state/AuthProvider";
import { IconeUsuario } from "./icones";

interface MenuUsuarioProps {
  /** "sidebar" (rodapé, largura cheia, popover abre para cima) ou "compacta" (barra superior mobile, popover abre para baixo). */
  variante: "sidebar" | "compacta";
}

const GATILHO_BASE = "flex items-center gap-2 rounded-lg text-sm font-medium transition-colors";
const GATILHO_SIDEBAR =
  "w-full px-2.5 py-2 text-text-primary hover:bg-background";
const GATILHO_COMPACTA = "px-2 py-1.5 text-text-secondary hover:text-text-primary";

/**
 * Menu de usuário — reutilizado pela Sidebar (rodapé, desktop) e pela
 * BarraSuperiorMobile (mobile), único lugar com a lógica de
 * abrir/fechar/Escape/clique-fora, para as duas telas nunca terem
 * comportamentos divergentes (ver CLAUDE.md desta etapa, Parte 9: "não
 * crie um segundo sistema de conta independente").
 *
 * Popover simples, sem biblioteca: `aria-haspopup="true"`/`aria-expanded`
 * no botão (Parte 15), mas deliberadamente SEM `role="menu"`/`"menuitem"`
 * nos itens — esse role implica o padrão ARIA completo de menu (setas do
 * teclado navegando entre itens), que não foi pedido nem implementado
 * aqui; forçar o role sem o comportamento seria pior que não usá-lo.
 * "Sair" reaproveita `logout()` de AuthProvider — nenhuma lógica nova.
 */
export function MenuUsuario({ variante }: MenuUsuarioProps) {
  const { status, usuario, logout } = useAuth();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const botaoRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setAberto(false);
      }
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAberto(false);
        botaoRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  if (status === "loading") return null;

  if (status === "deslogado") {
    return (
      <Link
        href="/login"
        className={
          GATILHO_BASE + " " + (variante === "sidebar" ? GATILHO_SIDEBAR : GATILHO_COMPACTA)
        }
      >
        <IconeUsuario className="h-4 w-4 shrink-0" />
        Entrar
      </Link>
    );
  }

  const primeiroNome = usuario!.nome.trim().split(/\s+/)[0];

  async function aoSair() {
    setAberto(false);
    await logout();
    router.push("/");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={botaoRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
        className={
          GATILHO_BASE +
          " " +
          (variante === "sidebar" ? GATILHO_SIDEBAR + " justify-between" : GATILHO_COMPACTA)
        }
      >
        <span className="flex min-w-0 items-center gap-2">
          <IconeUsuario className="h-4 w-4 shrink-0" />
          <span className="truncate">{primeiroNome}</span>
        </span>
      </button>

      {aberto && (
        <div
          className={
            "shadow-elevated absolute z-30 w-56 rounded-lg border border-border bg-surface-elevated p-3 " +
            (variante === "sidebar" ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2")
          }
        >
          <p className="truncate text-sm font-medium text-text-primary">{usuario!.nome}</p>
          <p className="truncate text-xs text-text-secondary">{usuario!.email}</p>
          <div className="my-2 border-t border-border" />
          <button
            type="button"
            onClick={aoSair}
            className="w-full rounded-md px-2 py-1.5 text-left text-sm font-medium text-text-primary transition-colors hover:bg-background"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
