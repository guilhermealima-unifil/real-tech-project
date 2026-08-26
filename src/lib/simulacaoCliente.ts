/**
 * Orquestração da simulação no cliente. Migração do Documento 0 (evolução
 * arquitetural pós-Fase 5): antes, `POST /api/simular-cenarios` chamava
 * `simular()` no servidor; agora a mesma sequência (validar → converter
 * unidade → rodar os três cenários de repasse) roda direto no navegador,
 * reaproveitando `validarEntradaSimulacao()` (src/lib/validacao.ts) e
 * `simular()` (src/lib/motor.ts) sem alterar nenhum dos dois.
 *
 * `/api/simular-cenarios` continua existindo como fallback (ver CLAUDE.md),
 * com sua própria cópia da mesma conversão — não foi alterada nesta etapa.
 */

import {
  simular,
  type CenarioRepasse,
  type ParametroTributarioAno,
  type ResultadoAno,
  type SimularEntrada,
} from "./motor";
import { validarEntradaSimulacao, type EntradaSimulacaoAPI } from "./validacao";

const CENARIOS: CenarioRepasse[] = ["integral", "gradual", "absorcao"];

export type ResultadoSimulacaoCliente =
  | { ok: true; cenarios: Record<CenarioRepasse, ResultadoAno[]> }
  | { ok: false; erros: string[] };

/**
 * Converte os percentuais "inteiros" do formulário/validação (20 = 20%)
 * para a fração decimal (0.20) que `simular()` espera — mesma conversão
 * que antes só existia dentro de `POST /api/simular-cenarios`, agora num
 * único lugar reutilizável por qualquer chamador de `simular()`.
 */
export function converterParaEntradaMotor(
  entrada: EntradaSimulacaoAPI,
  cenarioRepasse: CenarioRepasse,
): SimularEntrada {
  return {
    custoCompra: entrada.custoCompra,
    formulaTipo: entrada.formulaTipo,
    despesaFixaPct: entrada.despesaFixaPct !== undefined ? entrada.despesaFixaPct / 100 : undefined,
    markupPct: entrada.markupPct !== undefined ? entrada.markupPct / 100 : undefined,
    margemAlvoPct: entrada.margemAlvoPct / 100,
    margemMinimaPct: entrada.margemMinimaPct / 100,
    tetoPracaMin: entrada.tetoPracaMin,
    tetoPracaMax: entrada.tetoPracaMax,
    cenarioRepasse,
  };
}

/**
 * Valida a entrada bruta do formulário e roda os três cenários de repasse
 * de uma vez — equivalente ao que `POST /api/simular-cenarios` fazia no
 * servidor, agora executado no navegador. Não toca em banco: `ramoId` só
 * precisa ser uma string não vazia (a existência do ramo já é garantida
 * pela UI, que só lista ramos vindos de `GET /api/ramos`).
 */
export function simularTresCenarios(
  entradaBruta: unknown,
  parametros: ParametroTributarioAno[],
): ResultadoSimulacaoCliente {
  const validacao = validarEntradaSimulacao(entradaBruta);
  if (!validacao.ok) {
    return { ok: false, erros: validacao.erros };
  }

  try {
    const cenarios = {} as Record<CenarioRepasse, ResultadoAno[]>;
    for (const cenarioRepasse of CENARIOS) {
      cenarios[cenarioRepasse] = simular(
        converterParaEntradaMotor(validacao.entrada, cenarioRepasse),
        parametros,
      );
    }
    return { ok: true, cenarios };
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido ao simular.";
    return { ok: false, erros: [mensagem] };
  }
}
