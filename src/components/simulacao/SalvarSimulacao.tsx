"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/state/AuthProvider";
import type { SimulationResult } from "@/state/simulacaoReducer";
import { montarPayloadSimulacaoSalva } from "@/lib/simulacoesCliente";

interface SalvarSimulacaoProps {
  resultado: SimulationResult;
}

type EstadoSalvamento = "idle" | "salvando" | "salvo" | "erro";

/**
 * Ação "Salvar simulação" (histórico). Deslogado: CTA para /login, sem
 * bloquear o resultado (ver CLAUDE.md desta etapa). Autenticado: botão que
 * faz POST /api/simulacoes com o SNAPSHOT já pronto em
 * `resultado` (nunca `state.form`) — ver src/lib/simulacoesCliente.ts.
 *
 * Double-submit: só client-side (`estado !== "idle"` desabilita o botão
 * durante o próprio clique; uma vez "salvo", o botão é substituído pela
 * confirmação — não há como clicar de novo no mesmo componente; um novo
 * resultado desmonta esta instância inteira junto com <ResultadoSimulacao>,
 * então "salvo" nunca vaza para outra simulação). Deliberadamente SEM
 * idempotência no backend (ver etapa de polimento, "IDEMPOTÊNCIA"): a
 * única forma seria uma chave persistida (nova coluna + índice único em
 * `Simulacao`), que exige migration — fora do escopo desta etapa
 * ("NÃO ALTERE... migrations, salvo bug crítico real"). Risco residual:
 * um duplo POST feito por fora desta UI (ex.: replay de rede bem no
 * instante entre clique e desabilitar) poderia, em teoria, criar 2 linhas;
 * não observado na prática porque o `disabled` já cobre o caminho real do
 * usuário (clique/Enter). Pendência explícita, não bloqueante para o MVP.
 *
 * `aria-live="polite"` no texto de status: o clique não recarrega a
 * página nem move o foco, então "Salvando…" → "Simulação salva" (ou um
 * erro) precisa ser anunciado ativamente para quem usa leitor de tela —
 * sem isso, a mudança de estado é silenciosa.
 */
export function SalvarSimulacao({ resultado }: SalvarSimulacaoProps) {
  const { status } = useAuth();
  const [estado, setEstado] = useState<EstadoSalvamento>("idle");
  const [simulacaoId, setSimulacaoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (status === "loading") return null;

  if (status === "deslogado") {
    return (
      <Link
        href="/login"
        className="text-xs font-medium text-primary underline-offset-2 hover:underline"
      >
        Entre para salvar esta simulação
      </Link>
    );
  }

  async function aoSalvar() {
    if (estado === "salvando" || estado === "salvo") return; // impede double-submit

    const payload = montarPayloadSimulacaoSalva(resultado);
    if (!payload) {
      setEstado("erro");
      setErro("Não foi possível identificar o ramo desta simulação.");
      return;
    }

    setEstado("salvando");
    setErro(null);

    try {
      const resposta = await fetch("/api/simulacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const corpo = await resposta.json();

      if (!resposta.ok) {
        setEstado("erro");
        setErro(corpo.erros?.[0] ?? "Não foi possível salvar a simulação.");
        return;
      }

      setSimulacaoId(corpo.id);
      setEstado("salvo");
    } catch {
      setEstado("erro");
      setErro("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
    }
  }

  if (estado === "salvo") {
    return (
      <span aria-live="polite" className="flex items-center gap-2 text-xs font-medium text-success">
        Simulação salva
        {simulacaoId && (
          <Link href={`/historico/${simulacaoId}`} className="underline-offset-2 hover:underline">
            Ver simulação
          </Link>
        )}
      </span>
    );
  }

  return (
    <span aria-live="polite" className="flex items-center gap-2">
      <button
        type="button"
        onClick={aoSalvar}
        disabled={estado === "salvando"}
        className="text-xs font-medium text-text-secondary underline-offset-2 hover:text-text-primary hover:underline disabled:opacity-50"
      >
        {estado === "salvando" ? "Salvando…" : "Salvar simulação"}
      </button>
      {estado === "erro" && erro && <span className="text-xs text-danger">{erro}</span>}
    </span>
  );
}
