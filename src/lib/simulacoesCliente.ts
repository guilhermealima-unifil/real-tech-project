/**
 * Monta o payload de POST /api/simulacoes a partir do SNAPSHOT da
 * simulação (`SimulationResult`), nunca de `state.form` ao vivo — ver
 * SimulationResult.entradaSnapshot (src/state/simulacaoReducer.ts) e
 * SimulationProvider.executarSimulacao, que já isolam esse snapshot no
 * momento do submit.
 *
 * `nomeProduto` é a exceção deliberada: não vem do snapshot da simulação
 * (não pertence ao motor nem ao formulário — ver CLAUDE.md desta etapa,
 * "Isso NÃO pertence ao motor"), vem de fora, do dialog "Salvar
 * simulação" (src/components/simulacao/SalvarSimulacao.tsx). Por isso
 * `montarPayloadSimulacaoSalva` recebe os dois como parâmetros
 * independentes, em vez de `nomeProduto` viver dentro de `SimulationResult`.
 */

import type { SimulationResult } from "@/state/simulacaoReducer";

// Mesmo limite de src/lib/validacaoSimulacaoSalva.ts (MAX_TAMANHO_NOME_PRODUTO)
// — duplicado deliberadamente aqui: o cliente não deveria importar de
// dentro de uma rota de API, e o backend continua sendo quem de fato
// impõe o limite (ver validarNomeProdutoSimulacao abaixo, só para dar
// feedback imediato antes do POST).
export const NOME_PRODUTO_MAX_CARACTERES = 120;

export interface PayloadSimulacaoSalva {
  ramoId: string;
  ramoRotulo: string;
  ramoAliquotaSugerida: number;
  nomeProduto: string;
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

/**
 * Validação client-side de `nomeProduto`, antes do POST — só para dar
 * feedback imediato dentro do dialog (ver DialogSalvarSimulacao). Mesma
 * regra do backend (trim, não vazio, até NOME_PRODUTO_MAX_CARACTERES);
 * o backend (validarEntradaSimulacaoSalva) continua sendo quem realmente
 * impõe isso — esta função nunca é a última linha de defesa.
 */
export function validarNomeProdutoSimulacao(nome: string): string | null {
  const nomeAparado = nome.trim();
  if (nomeAparado.length === 0) {
    return "Informe o nome do produto ou serviço.";
  }
  if (nomeAparado.length > NOME_PRODUTO_MAX_CARACTERES) {
    return `O nome pode ter no máximo ${NOME_PRODUTO_MAX_CARACTERES} caracteres.`;
  }
  return null;
}

export function montarPayloadSimulacaoSalva(
  resultado: SimulationResult,
  nomeProduto: string,
): PayloadSimulacaoSalva | null {
  if (!resultado.ramo) return null; // sem ramo não há como satisfazer o FK obrigatório no banco

  return {
    ramoId: resultado.ramo.id,
    ramoRotulo: resultado.ramo.rotulo,
    ramoAliquotaSugerida: resultado.ramo.aliquotaSugerida,
    nomeProduto: nomeProduto.trim(),
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
