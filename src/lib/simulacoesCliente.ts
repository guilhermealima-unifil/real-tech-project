/**
 * Monta o payload de POST /api/simulacoes a partir do SNAPSHOT da
 * simulação (`SimulationResult`), nunca de `state.form` ao vivo — ver
 * SimulationResult.entradaSnapshot (src/state/simulacaoReducer.ts) e
 * SimulationProvider.executarSimulacao, que já isolam esse snapshot no
 * momento do submit.
 */

import type { SimulationResult } from "@/state/simulacaoReducer";

export interface PayloadSimulacaoSalva {
  ramoId: string;
  ramoRotulo: string;
  ramoAliquotaSugerida: number;
  formulaTipo: SimulationResult["formulaTipo"];
  custoCompra: number;
  despesaFixaPct: number | null;
  markupPct: number | null;
  margemAlvoPct: number;
  margemMinimaPct: number;
  tetoPracaMin: number | null;
  tetoPracaMax: number | null;
  prazoPagamentoFornecedorDias: number | null;
  cenarios: SimulationResult["cenarios"];
  impactoCaixa: SimulationResult["impactoCaixa"];
}

export function montarPayloadSimulacaoSalva(resultado: SimulationResult): PayloadSimulacaoSalva | null {
  if (!resultado.ramo) return null; // sem ramo não há como satisfazer o FK obrigatório no banco

  return {
    ramoId: resultado.ramo.id,
    ramoRotulo: resultado.ramo.rotulo,
    ramoAliquotaSugerida: resultado.ramo.aliquotaSugerida,
    formulaTipo: resultado.formulaTipo,
    custoCompra: resultado.custoCompra,
    despesaFixaPct: resultado.entradaSnapshot.despesaFixaPct,
    markupPct: resultado.entradaSnapshot.markupPct,
    margemAlvoPct: resultado.entradaSnapshot.margemAlvoPct,
    margemMinimaPct: resultado.entradaSnapshot.margemMinimaPct,
    tetoPracaMin: resultado.entradaSnapshot.tetoPracaMin,
    tetoPracaMax: resultado.entradaSnapshot.tetoPracaMax,
    prazoPagamentoFornecedorDias: resultado.entradaSnapshot.prazoPagamentoFornecedorDias,
    cenarios: resultado.cenarios,
    impactoCaixa: resultado.impactoCaixa,
  };
}
