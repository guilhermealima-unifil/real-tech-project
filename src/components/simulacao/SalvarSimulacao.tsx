"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/state/AuthProvider";
import { useSimulation } from "@/state/SimulationProvider";
import { useToast } from "@/state/ToastProvider";
import type { SimulationResult } from "@/state/simulacaoReducer";
import { montarPayloadSimulacaoSalva } from "@/lib/simulacoesCliente";
import { Button } from "@/components/ui/Button";
import { DialogSalvarSimulacao } from "./DialogSalvarSimulacao";
import { ConteudoAcaoResponsivo } from "./HeaderAnalise";
import { IconeSalvar } from "./icones";

interface SalvarSimulacaoProps {
  resultado: SimulationResult;
}

type EstadoSalvamento = "idle" | "salvando" | "salvo" | "erro";

/**
 * Ação "Salvar simulação" (histórico). Deslogado: CTA para /login, sem
 * bloquear o resultado (ver CLAUDE.md desta etapa). Autenticado: botão que
 * abre o dialog "Salvar simulação" (DialogSalvarSimulacao) para coletar o
 * nome do produto/serviço antes de fazer POST /api/simulacoes — o resto do
 * payload continua vindo do SNAPSHOT já pronto em `resultado` (nunca
 * `state.form`) — ver src/lib/simulacoesCliente.ts. `nomeProduto` é a
 * única exceção: não pertence ao motor nem ao snapshot da simulação (ver
 * CLAUDE.md desta etapa), por isso chega separado, só no momento de
 * confirmar o dialog.
 *
 * Double-submit: só client-side (`estado !== "idle"` desabilita os botões
 * do dialog durante o próprio clique; uma vez "salvo", botão e dialog são
 * substituídos pela confirmação — não há como clicar de novo no mesmo
 * componente; um novo resultado desmonta esta instância inteira junto com
 * <ResultadoSimulacao>, então "salvo" nunca vaza para outra simulação).
 * Deliberadamente SEM idempotência no backend (ver etapa de polimento,
 * "IDEMPOTÊNCIA") — pendência já registrada antes desta etapa, não
 * reaberta aqui.
 *
 * `aria-live="polite"` no texto de status: o clique não recarrega a
 * página nem move o foco, então "Salvando…" → "Simulação salva" (ou um
 * erro) precisa ser anunciado ativamente para quem usa leitor de tela —
 * sem isso, a mudança de estado é silenciosa.
 */
export function SalvarSimulacao({ resultado }: SalvarSimulacaoProps) {
  const { status } = useAuth();
  const { state } = useSimulation();
  const { toast } = useToast();
  const [dialogAberto, setDialogAberto] = useState(false);
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

  // Contexto resumido do dialog — o mesmo ano/cenário que o usuário está
  // vendo em NavegacaoAnalise agora, só para exibição (não persistido como
  // parte do nome nem de nenhum outro campo).
  const resultadoSelecionado =
    resultado.cenarios[state.ui.cenarioSelecionado]?.find((r) => r.ano === state.ui.anoSelecionado) ??
    null;

  async function aoConfirmarNome(nomeProduto: string) {
    if (estado === "salvando" || estado === "salvo") return; // impede double-submit

    const payload = montarPayloadSimulacaoSalva(resultado, nomeProduto);
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
        return; // dialog continua aberto — não perde o nome já digitado
      }

      setSimulacaoId(corpo.id);
      setEstado("salvo");
      setDialogAberto(false);
      toast({
        variant: "success",
        title: "Simulação salva",
        description: "Ela já está disponível no seu histórico.",
      });
    } catch {
      setEstado("erro");
      setErro("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.");
    }
  }

  function aoCancelarDialog() {
    setDialogAberto(false); // descarta o nome digitado; não toca `estado`/resultado/cenário/ano
  }

  if (estado === "salvo") {
    return (
      <span className="flex items-center gap-2 text-xs font-medium text-success">
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
    <span aria-live="polite" className="inline-flex items-center">
      <Button
        variant="primary"
        size="sm"
        aria-label="Salvar simulação"
        title="Salvar simulação"
        className="min-h-9 sm:min-h-0"
        onClick={() => setDialogAberto(true)}
      >
        <ConteudoAcaoResponsivo rotulo="Salvar" icone={<IconeSalvar className="h-4 w-4" />} />
      </Button>

      {dialogAberto && (
        <DialogSalvarSimulacao
          ramoRotulo={resultado.ramo?.rotulo ?? null}
          precoAnalisado={resultadoSelecionado?.preco ?? null}
          salvando={estado === "salvando"}
          erro={estado === "erro" ? erro : null}
          onCancelar={aoCancelarDialog}
          onConfirmar={aoConfirmarNome}
        />
      )}
    </span>
  );
}
