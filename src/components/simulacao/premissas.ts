/**
 * Formato/dados de apresentação para `PremissasSimulacao.tsx` — funções
 * puras, sem JSX, no mesmo padrão de src/components/simulacao/navegacaoAno.ts.
 *
 * `PremissasDados` é o formato COMUM que tanto a simulação ao vivo
 * (`SimulationResult.entradaSnapshot` + `custoCompra`/`formulaTipo`/`ramo`,
 * ver ResultadoSimulacao.tsx) quanto o snapshot salvo (`SimulacaoDetalhe`,
 * já achatado, ver DetalheSimulacaoSalva.tsx) mapeiam antes de chegar aqui
 * — este módulo não sabe se os dados vieram do reducer ao vivo ou do banco,
 * só que já são o que efetivamente foi simulado (nunca `state.form` ao
 * vivo, que pode ter divergido do resultado na tela).
 */

import type { FormulaTipo } from "@/lib/motor";
import { formatarReais } from "@/lib/frases";

export interface PremissasDados {
  custoCompra: number;
  ramoRotulo: string | null;
  formulaTipo: FormulaTipo;
  /** Percentual "inteiro" (20 = 20%), mesma convenção de entradaSnapshot/SimulacaoDetalhe — não fração. */
  despesaFixaPct: number | null;
  markupPct: number | null;
  margemAlvoPct: number;
  margemMinimaPct: number;
  tetoPracaMin: number | null;
  tetoPracaMax: number | null;
  prazoPagamentoFornecedorDias: number | null;
}

/**
 * Rótulo do modelo de precificação — mesma nomenclatura das opções da
 * Etapa 1 do wizard (ver EtapaOperacao.tsx: "uso um markup único" /
 * "calculo despesas e margem separadas"), só resumida para caber num rótulo
 * curto de premissa.
 */
export function rotuloModelo(formulaTipo: FormulaTipo): string {
  return formulaTipo === "markup" ? "Markup único" : "Despesa + margem";
}

/**
 * Faixa de preço da praça para exibição. `tetoPracaMin`/`tetoPracaMax` são
 * os dois opcionais que o usuário pode informar (ver EtapaMercado.tsx) —
 * os quatro casos (nenhum/só mínimo/só máximo/os dois) já são válidos pela
 * própria validação (src/lib/validacao.ts); esta função só formata o que
 * já veio pronto, nenhuma regra nova.
 */
export function formatarFaixaPraca(min: number | null, max: number | null): string {
  if (min !== null && max !== null) {
    return `R$ ${formatarReais(min)} – R$ ${formatarReais(max)}`;
  }
  if (min !== null) {
    return `a partir de R$ ${formatarReais(min)}`;
  }
  if (max !== null) {
    return `até R$ ${formatarReais(max)}`;
  }
  return "Não informado";
}
