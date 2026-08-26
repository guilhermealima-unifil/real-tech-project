/**
 * Validação de progressão do wizard. Não reimplementa nenhuma regra: roda
 * `validarEntradaSimulacao()` (src/lib/validacao.ts, intocado) contra o
 * form inteiro e filtra só os erros dos campos que pertencem à etapa
 * perguntada — usando a convenção já existente de toda mensagem de erro
 * começar com o nome do campo. Se `validarEntradaSimulacao` mudar de
 * mensagens, esse filtro precisa acompanhar (não há acoplamento por tipo,
 * só por convenção de string — risco documentado no relatório da etapa).
 */

import { validarEntradaSimulacao } from "@/lib/validacao";
import type { SimulationFormState } from "./simulacaoReducer";

export function numOrUndefined(valor: string): number | undefined {
  if (valor.trim() === "") return undefined;
  const n = Number(valor);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Mesma conversão form → payload usada por SimulationProvider.executarSimulacao
 * — único lugar, para as duas pontas (rodar a simulação e validar uma
 * etapa) nunca divergirem.
 */
export function montarEntradaBruta(form: SimulationFormState) {
  return {
    ramoId: form.ramoId,
    custoCompra: numOrUndefined(form.custoCompra),
    formulaTipo: form.formulaTipo,
    despesaFixaPct:
      form.formulaTipo === "multiplicador" ? numOrUndefined(form.despesaFixaPct) : undefined,
    markupPct: form.formulaTipo === "markup" ? numOrUndefined(form.markupPct) : undefined,
    margemAlvoPct:
      form.formulaTipo === "markup"
        ? numOrUndefined(form.markupPct)
        : numOrUndefined(form.margemAlvoPct),
    margemMinimaPct: numOrUndefined(form.margemMinimaPct),
    tetoPracaMin: numOrUndefined(form.tetoPracaMin),
    tetoPracaMax: numOrUndefined(form.tetoPracaMax),
  };
}

export type EtapaValidavel = "operacao" | "margens" | "mercado";

const CAMPOS_POR_ETAPA: Record<EtapaValidavel, string[]> = {
  operacao: ["ramoId", "custoCompra", "formulaTipo"],
  margens: ["despesaFixaPct", "markupPct", "margemAlvoPct", "margemMinimaPct"],
  mercado: ["tetoPracaMin", "tetoPracaMax"],
};

/**
 * Erros (já existentes em validacao.ts) que pertencem aos campos da etapa
 * informada. Não valida `prazoPagamentoFornecedorDias` — não existe regra
 * para ele em validacao.ts (não é lido por `simular()`, só por
 * `calcularImpactoCaixa` no cliente); quem chama esta função trata esse
 * campo à parte, com uma checagem mínima de presença.
 */
export function errosDaEtapa(etapa: EtapaValidavel, form: SimulationFormState): string[] {
  const validacao = validarEntradaSimulacao(montarEntradaBruta(form));
  if (validacao.ok) return [];
  const camposDaEtapa = CAMPOS_POR_ETAPA[etapa];
  return validacao.erros.filter((erro) => camposDaEtapa.some((campo) => erro.startsWith(campo)));
}
