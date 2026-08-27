"use client";

import { useState } from "react";
import type { AlertaAnalise, EvidenciasComparacao } from "@/lib/evidenciasComparacao";
import { gerarLeituraFallback } from "@/lib/leituraComparacaoFallback";

interface LeituraComparacaoProps {
  evidencias: EvidenciasComparacao;
}

interface RespostaAPI {
  disponivel: boolean;
  texto?: string;
}

type EstadoLeitura =
  | { tipo: "inicial" }
  | { tipo: "carregando" }
  | { tipo: "gerada"; texto: string }
  | { tipo: "indisponivel" };

const ROTULO_ALERTA: Record<AlertaAnalise["tipo"], string> = {
  margem_abaixo_minima: "Margem",
  acima_teto: "Teto",
  faixa_inviavel: "Faixa inviável",
  sem_teto_informado: "Teto não informado",
  sem_reajuste: "Sem reajuste",
  maior_reajuste: "Maior reajuste",
  menor_folga_margem: "Menor folga",
};

/**
 * "Orientação inteligente" de Comparar estratégias (renomeada de "Leitura
 * inteligente" — mesmo componente, papel da IA mudou de síntese para
 * orientação condicionada à prioridade, ver leituraComparacaoPrompt.ts) —
 * NÃO é chat: um botão único (`Gerar orientação` / `Atualizar
 * orientação`), sem campo de texto, sem histórico de conversa. A IA só
 * explica verbalmente as evidências que `evidencias` já carrega (calculadas
 * client-side por `construirEvidenciasComparacao`, sem recalcular motor) —
 * nunca decide preço, margem ou "melhor estratégia" no geral; pode indicar,
 * de forma condicional, qual estratégia mais atende a UMA prioridade
 * (preservar margem, manter preço dentro do teto da praça), sempre com a
 * limitação daquela estratégia citada junto.
 *
 * Sem chamada automática a cada render (Parte G): só dispara ao clicar.
 * Em erro/sem chave, cai na leitura determinística de `leituraComparacaoFallback.ts`
 * (Parte B/H) — a comparação nunca fica sem leitura nenhuma. O fallback
 * continua sendo uma leitura factual (não foi convertido para orientação
 * por prioridade — ver relatório desta etapa: replicar a lógica de
 * prioridade/desempate sem IA duplicaria a precedência de alertas já
 * calculada em evidenciasComparacao.ts, com risco de as duas divergirem).
 */
export function LeituraComparacao({ evidencias }: LeituraComparacaoProps) {
  const [estado, setEstado] = useState<EstadoLeitura>({ tipo: "inicial" });

  const alertas = evidencias.alertas;
  const leituraFallback = gerarLeituraFallback(evidencias);

  async function gerarLeitura() {
    setEstado({ tipo: "carregando" });
    try {
      const resposta = await fetch("/api/leitura-comparacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evidencias }),
      });

      if (!resposta.ok) {
        setEstado({ tipo: "indisponivel" });
        return;
      }

      const dados = (await resposta.json()) as RespostaAPI;
      if (dados.disponivel && dados.texto) {
        setEstado({ tipo: "gerada", texto: dados.texto });
      } else {
        setEstado({ tipo: "indisponivel" });
      }
    } catch {
      setEstado({ tipo: "indisponivel" });
    }
  }

  return (
    <section aria-labelledby="leitura-comparacao-titulo" className="space-y-3">
      {alertas.length > 0 && (
        <ul className="space-y-1.5">
          {alertas.map((alerta, indice) => (
            <li
              key={`${alerta.tipo}-${alerta.cenario ?? "geral"}-${indice}`}
              className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-text-primary"
            >
              <span className="mt-0.5 shrink-0 rounded-full bg-warning/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                {ROTULO_ALERTA[alerta.tipo]}
              </span>
              <span>{alerta.texto}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="leitura-comparacao-titulo" className="text-base font-semibold text-text-primary">
              Orientação inteligente
            </h2>
            <p className="mt-0.5 text-xs text-text-secondary">
              Veja como cada estratégia atende a diferentes prioridades.
            </p>
          </div>
          <button
            type="button"
            onClick={gerarLeitura}
            disabled={estado.tipo === "carregando"}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            {estado.tipo === "carregando" && (
              <svg className="h-3 w-3 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z"
                />
              </svg>
            )}
            {estado.tipo === "gerada" || estado.tipo === "indisponivel"
              ? "Atualizar orientação"
              : "Gerar orientação"}
          </button>
        </div>

        <div className="mt-3 text-sm text-text-secondary">
          {estado.tipo === "carregando" && <p>Analisando os cenários...</p>}

          {estado.tipo === "gerada" && <p className="text-text-primary">{estado.texto}</p>}

          {estado.tipo === "indisponivel" && (
            <>
              <p className="text-xs text-muted">
                Não foi possível gerar a orientação inteligente. Os dados da comparação continuam
                disponíveis acima.
              </p>
              <p className="mt-2 text-text-primary">{leituraFallback}</p>
            </>
          )}

          {estado.tipo === "inicial" && <p>{leituraFallback}</p>}
        </div>

        <p className="mt-3 text-xs text-muted">
          Baseada exclusivamente nos dados desta simulação. Não substitui validação
          contábil/comercial.
        </p>
      </div>
    </section>
  );
}
