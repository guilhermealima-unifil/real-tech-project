"use client";

import { useState } from "react";
import { useSimulation } from "@/state/SimulationProvider";
import { SalvarSimulacao } from "./SalvarSimulacao";
import { NavegacaoAnalise } from "./NavegacaoAnalise";
import { PainelEdicaoRapida } from "./PainelEdicaoRapida";

/**
 * Área de resultado — destino da simulação, não uma quarta etapa de
 * formulário (ver CLAUDE.md).
 *
 * Modelo mental (pedido nesta etapa): cenário + ano são CONTEXTO GLOBAL,
 * "Faixa viável" / "Negociação" / "Impacto no caixa" são as SEÇÕES da
 * análise — a navegação entre os três níveis (cenário, ano, seção) é toda
 * NavegacaoAnalise (mesmo componente reusado pelo detalhe histórico, ver
 * src/components/historico/DetalheSimulacaoSalva.tsx). Este componente só
 * cuida do que é específico da simulação AO VIVO: a barra de ações
 * (Salvar/Editar/Nova), ligar cenário/ano ao estado global
 * (`ui.cenarioSelecionado`/`ui.anoSelecionado`), e a edição rápida.
 *
 * "Editar dados" não navega mais para o wizard (ver PainelEdicaoRapida) —
 * abre um painel por cima desta mesma tela. `editando` é estado de
 * apresentação puro (só decide se o painel está montado), por isso fica
 * local — nada aqui precisa saber disso fora deste componente. Como o
 * painel some/aparece sem desmontar `NavegacaoAnalise`, `resultado` nunca
 * fica nulo nesse meio-tempo (ver simulacaoReducer.ts: SIMULACAO_FALHOU
 * não zera mais `resultado`) — é assim que cenário/ano (estado global) e
 * a aba selecionada (estado local dentro de NavegacaoAnalise) sobrevivem a
 * um recálculo, com sucesso ou não.
 */
export function ResultadoSimulacao() {
  const { state, selecionarCenario, selecionarAno, alterarDescontoPedido, novaSimulacao } =
    useSimulation();
  const { resultado, ui } = state;

  const [editando, setEditando] = useState(false);

  // Salvaguarda: SimuladorPage só monta este componente quando `resultado`
  // existe (ver page.tsx). Sem isso o TS não estreita `resultado` abaixo.
  if (!resultado) return null;

  const resultados = resultado.cenarios[ui.cenarioSelecionado];
  const cenarioIrrelevante = resultado.formulaTipo === "markup";

  return (
    <div className="flex flex-col gap-8">
      {/* Barra utilitária — nome/ramo + ações, deliberadamente discretas: a
          decisão de preço abaixo é que deve chamar atenção, não isto. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <p className="text-text-secondary">
          {resultado.ramo ? resultado.ramo.rotulo : "Resultado da simulação"}
        </p>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-text-secondary">
          <SalvarSimulacao resultado={resultado} />
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="underline-offset-2 hover:text-text-primary hover:underline"
          >
            Editar dados
          </button>
          <button
            type="button"
            onClick={novaSimulacao}
            className="underline-offset-2 hover:text-text-primary hover:underline"
          >
            Nova simulação
          </button>
        </div>
      </div>

      <NavegacaoAnalise
        cenarioSelecionado={ui.cenarioSelecionado}
        onSelecionarCenario={selecionarCenario}
        cenarioIrrelevante={cenarioIrrelevante}
        resultados={resultados}
        anoSelecionado={ui.anoSelecionado}
        onSelecionarAno={selecionarAno}
        custoCompra={resultado.custoCompra}
        descontoPedidoPct={ui.descontoPedidoPct}
        onDescontoPedidoChange={alterarDescontoPedido}
        impactoCaixa={resultado.impactoCaixa}
      />

      {editando && (
        <PainelEdicaoRapida resultado={resultado} onFechar={() => setEditando(false)} />
      )}
    </div>
  );
}
