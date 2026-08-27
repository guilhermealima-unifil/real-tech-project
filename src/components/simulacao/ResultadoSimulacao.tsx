"use client";

import { useState } from "react";
import { useSimulation } from "@/state/SimulationProvider";
import { Button } from "@/components/ui/Button";
import { SalvarSimulacao } from "./SalvarSimulacao";
import { NavegacaoAnalise } from "./NavegacaoAnalise";
import { PainelEdicaoRapida } from "./PainelEdicaoRapida";
import { ConteudoAcaoResponsivo } from "./HeaderAnalise";
import { IconeEditar, IconeNovo } from "./icones";
import type { PremissasDados } from "./premissas";

/**
 * Área de resultado — destino da simulação, não uma quarta etapa de
 * formulário (ver CLAUDE.md).
 *
 * Modelo mental (pedido nesta etapa): a DECISÃO PRINCIPAL (ação
 * recomendada + ações da simulação inteira) mora no header sticky
 * decisório (HeaderAnalise, via NavegacaoAnalise), sempre visível — não só
 * dentro da aba "Faixa viável" como antes. cenário + ano são CONTEXTO,
 * "Faixa viável" / "Negociação" / "Impacto no caixa" são as SEÇÕES da
 * análise que explicam essa decisão — a navegação entre os três níveis
 * (cenário, ano, seção) é toda NavegacaoAnalise (mesmo componente reusado
 * pelo detalhe histórico, ver src/components/historico/DetalheSimulacaoSalva.tsx,
 * só sem a prop `acoes`). Este componente cuida do que é específico da
 * simulação AO VIVO: as ações (Salvar simulação/Editar dados/Nova
 * simulação), ligar cenário/ano ao
 * estado global (`ui.cenarioSelecionado`/`ui.anoSelecionado`), e a edição
 * rápida.
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
 *
 * O ramo não aparece mais solto aqui — mora no `<header>` de
 * src/app/simulador/page.tsx, associado ao título "Simulador".
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

  // Snapshot que gerou o resultado atual (nunca `state.form` ao vivo — ver
  // CLAUDE.md desta etapa, Parte 6) para PremissasSimulacao, via
  // NavegacaoAnalise.
  const premissas: PremissasDados = {
    custoCompra: resultado.custoCompra,
    ramoRotulo: resultado.ramo?.rotulo ?? null,
    formulaTipo: resultado.formulaTipo,
    despesaFixaPct: resultado.entradaSnapshot.despesaFixaPct,
    markupPct: resultado.entradaSnapshot.markupPct,
    margemAlvoPct: resultado.entradaSnapshot.margemAlvoPct,
    margemMinimaPct: resultado.entradaSnapshot.margemMinimaPct,
    tetoPracaMin: resultado.entradaSnapshot.tetoPracaMin,
    tetoPracaMax: resultado.entradaSnapshot.tetoPracaMax,
    prazoPagamentoFornecedorDias: resultado.entradaSnapshot.prazoPagamentoFornecedorDias,
  };

  return (
    <div className="flex flex-col gap-8">
      <NavegacaoAnalise
        cenarioSelecionado={ui.cenarioSelecionado}
        onSelecionarCenario={selecionarCenario}
        cenarioIrrelevante={cenarioIrrelevante}
        resultados={resultados}
        cenarios={resultado.cenarios}
        anoSelecionado={ui.anoSelecionado}
        onSelecionarAno={selecionarAno}
        custoCompra={resultado.custoCompra}
        descontoPedidoPct={ui.descontoPedidoPct}
        onDescontoPedidoChange={alterarDescontoPedido}
        impactoCaixa={resultado.impactoCaixa}
        premissas={premissas}
        acoes={
          <>
            <SalvarSimulacao resultado={resultado} />
            <Button
              variant="secondary"
              size="sm"
              aria-label="Editar dados"
              title="Editar dados"
              className="min-h-9 sm:min-h-0"
              onClick={() => setEditando(true)}
            >
              <ConteudoAcaoResponsivo rotulo="Editar" icone={<IconeEditar className="h-4 w-4" />} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Nova simulação"
              title="Nova simulação"
              className="min-h-9 sm:min-h-0"
              onClick={novaSimulacao}
            >
              <ConteudoAcaoResponsivo rotulo="Nova" icone={<IconeNovo className="h-4 w-4" />} />
            </Button>
          </>
        }
      />

      {editando && (
        <PainelEdicaoRapida resultado={resultado} onFechar={() => setEditando(false)} />
      )}
    </div>
  );
}
