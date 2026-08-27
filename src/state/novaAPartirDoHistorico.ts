/**
 * Helper puro de "Nova a partir desta" (histórico → nova simulação, ver
 * src/components/historico/NovaAPartirDesta.tsx). Mesma reconstrução de
 * `SimulationFormState` que a edição rápida já faz a partir do resultado
 * ao vivo (ver `montarDraftDeResultado` em edicaoRapida.ts) — aqui a fonte
 * é o SNAPSHOT histórico (`SimulacaoDetalhe`, já achatado, sem
 * `entradaSnapshot` aninhado), nunca um recálculo do motor.
 *
 * Só copia INPUTS/premissas que o usuário pode editar — nunca outputs
 * derivados (preço, margem resultante, piso/teto calculados, recomendação
 * etc., que vivem em `SimulacaoDetalhe.cenarios`/`impactoCaixa`, de
 * propósito fora do `Pick` abaixo).
 */

import type { SimulacaoDetalhe } from "@/lib/historico";
import type { SimulationFormState } from "./simulacaoReducer";

type EntradasReutilizaveis = Pick<
  SimulacaoDetalhe,
  | "ramoId"
  | "custoCompra"
  | "formulaTipo"
  | "despesaFixaPct"
  | "markupPct"
  | "margemAlvoPct"
  | "margemMinimaPct"
  | "tetoPracaMin"
  | "tetoPracaMax"
  | "prazoPagamentoFornecedorDias"
>;

export function formStateAPartirDoHistorico(simulacao: EntradasReutilizaveis): SimulationFormState {
  return {
    ramoId: simulacao.ramoId,
    custoCompra: String(simulacao.custoCompra),
    formulaTipo: simulacao.formulaTipo,
    despesaFixaPct: simulacao.despesaFixaPct !== null ? String(simulacao.despesaFixaPct) : "",
    markupPct: simulacao.markupPct !== null ? String(simulacao.markupPct) : "",
    margemAlvoPct: String(simulacao.margemAlvoPct),
    margemMinimaPct: String(simulacao.margemMinimaPct),
    tetoPracaMin: simulacao.tetoPracaMin !== null ? String(simulacao.tetoPracaMin) : "",
    tetoPracaMax: simulacao.tetoPracaMax !== null ? String(simulacao.tetoPracaMax) : "",
    prazoPagamentoFornecedorDias:
      simulacao.prazoPagamentoFornecedorDias !== null
        ? String(simulacao.prazoPagamentoFornecedorDias)
        : "",
  };
}
