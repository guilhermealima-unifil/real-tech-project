/**
 * Helpers puros da edição rápida (Resultado → "Editar dados" →
 * Recalcular, ver PainelEdicaoRapida.tsx). Nenhuma regra nova: só
 * reconstrói um `SimulationFormState` a partir do snapshot da simulação
 * atual, e valida esse draft reaproveitando exatamente o que o wizard já
 * usa (`validarEntradaSimulacao`, `montarEntradaBruta`, `numOrUndefined`)
 * — sem copiar nenhuma regra campo por campo.
 */

import { validarEntradaSimulacao } from "@/lib/validacao";
import { montarEntradaBruta, numOrUndefined } from "./validacaoEtapas";
import type { SimulationFormState, SimulationResult } from "./simulacaoReducer";

/**
 * Reconstrói o form a partir dos dados que GERARAM o resultado atual —
 * `resultado.entradaSnapshot` + `resultado.custoCompra`/`formulaTipo`/`ramo`
 * (Parte 5 desta etapa: não usar `state.form` ao vivo, que pode ter
 * divergido do snapshot desde a última simulação). `entradaSnapshot` já
 * cobre todos os campos que a edição rápida expõe — não precisou estender
 * `SimulationResult`.
 *
 * `resultado.ramo` pode ser `null` só se o ramo do submit não existir mais
 * no catálogo carregado naquele momento (caso extremo); o draft nasce com
 * `ramoId: ""` nesse caso — o select de Ramo aparece sem seleção, e o
 * usuário precisa escolher de novo antes de recalcular (mesma exigência
 * `required` do wizard).
 */
export function montarDraftDeResultado(resultado: SimulationResult): SimulationFormState {
  const s = resultado.entradaSnapshot;
  return {
    ramoId: resultado.ramo?.id ?? "",
    custoCompra: String(resultado.custoCompra),
    formulaTipo: resultado.formulaTipo,
    despesaFixaPct: s.despesaFixaPct !== null ? String(s.despesaFixaPct) : "",
    markupPct: s.markupPct !== null ? String(s.markupPct) : "",
    margemAlvoPct: String(s.margemAlvoPct),
    margemMinimaPct: String(s.margemMinimaPct),
    tetoPracaMin: s.tetoPracaMin !== null ? String(s.tetoPracaMin) : "",
    tetoPracaMax: s.tetoPracaMax !== null ? String(s.tetoPracaMax) : "",
    prazoPagamentoFornecedorDias:
      s.prazoPagamentoFornecedorDias !== null ? String(s.prazoPagamentoFornecedorDias) : "",
  };
}

/**
 * Valida o draft completo do painel de edição rápida — equivalente a
 * somar os erros das 3 etapas do wizard de uma vez só, já que o painel
 * mostra Operação/Margens/Mercado juntos, sem conceito de etapa. Mesma
 * fonte de regras que o wizard usa por etapa
 * (`errosDaEtapa`/`validarEntradaSimulacao` em validacaoEtapas.ts): não
 * reimplementa nada, só chama `validarEntradaSimulacao` para o form
 * inteiro de uma vez e soma a checagem de prazo (fora do schema de
 * `validarEntradaSimulacao` porque `prazoPagamentoFornecedorDias` não é
 * lido por `simular()`, só por `calcularImpactoCaixa` no cliente — mesma
 * checagem que `SimulacaoWizard.errosDaEtapaAtual` já faz para a etapa
 * "margens").
 */
export function validarDraftEdicaoRapida(form: SimulationFormState): string[] {
  const validacao = validarEntradaSimulacao(montarEntradaBruta(form));
  const erros = validacao.ok ? [] : [...validacao.erros];
  if (numOrUndefined(form.prazoPagamentoFornecedorDias) === undefined) {
    erros.push("Informe o prazo de pagamento ao fornecedor, em dias.");
  }
  return erros;
}
