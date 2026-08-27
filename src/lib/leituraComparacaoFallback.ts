/**
 * Leitura determinística de "Comparar estratégias" — SEM IA (Parte B do
 * prompt desta etapa). Serve como: (1) fallback quando `GEMINI_API_KEY` não
 * está configurada, (2) fallback quando a chamada à IA falha, (3) base de
 * testes, (4) garantia de que o produto funciona sem depender de LLM.
 *
 * Só descreve uma diferença entre estratégias quando as evidências
 * realmente a sustentam — no modelo markup, ou em qualquer cenário onde os
 * três repasses produzem a mesma trajetória, nenhuma frase de trade-off é
 * inventada (ver `evidenciasComparacao.ts`, mesma regra dos alertas).
 */

import type { CenarioRepasse } from "./motor";
import { formatarPct, formatarReais } from "./frases";
import type { EvidenciaCenario, EvidenciasComparacao } from "./evidenciasComparacao";

function porCenario(
  evidencias: EvidenciasComparacao,
  cenario: CenarioRepasse,
): EvidenciaCenario | undefined {
  return evidencias.cenarios.find((c) => c.cenario === cenario);
}

/**
 * Frase curta por estratégia: reajuste no período + situação de margem/teto,
 * só com fatos que `EvidenciaCenario` sustenta.
 */
function fraseEstrategia(evidencia: EvidenciaCenario): string {
  const { resumo, rotulo } = evidencia;

  const trechoReajuste =
    resumo.variacaoPrecoAbsoluta > 0
      ? `reajusta o preço em R$ ${formatarReais(resumo.variacaoPrecoAbsoluta)} até o fim do período`
      : resumo.variacaoPrecoAbsoluta < 0
        ? `reduz o preço em R$ ${formatarReais(Math.abs(resumo.variacaoPrecoAbsoluta))} até o fim do período`
        : "mantém o preço estável no período";

  let trechoStatus: string;
  if (resumo.anosFaixaInviavel > 0) {
    trechoStatus = `entra em faixa inviável a partir de ${resumo.primeiroAnoCritico}`;
  } else if (evidencia.primeiroAnoAcimaTeto !== null) {
    trechoStatus = `ultrapassa o teto a partir de ${evidencia.primeiroAnoAcimaTeto}`;
  } else if (evidencia.primeiroAnoMargemAbaixoMinima !== null) {
    trechoStatus = `fica abaixo da margem mínima a partir de ${evidencia.primeiroAnoMargemAbaixoMinima}`;
  } else {
    trechoStatus = `preserva a margem mínima em todo o período (folga mínima de ${formatarPct(resumo.menorFolgaMargemPct)} p.p.)`;
  }

  return `${rotulo} ${trechoReajuste} e ${trechoStatus}.`;
}

/**
 * Leitura completa (Integral + Gradual + Absorção + trade-off final,
 * quando existir) — equivalente conceitual ao exemplo do prompt desta
 * etapa: "Integral preserva mais margem, mas exige maior reajuste [...]".
 */
export function gerarLeituraFallback(evidencias: EvidenciasComparacao): string {
  if (evidencias.cenarios.length === 0) {
    return "Não há dados suficientes para comparar as estratégias neste ano.";
  }

  const integral = porCenario(evidencias, "integral");
  const gradual = porCenario(evidencias, "gradual");
  const absorcao = porCenario(evidencias, "absorcao");

  const trajetoriasIguais =
    integral !== undefined &&
    gradual !== undefined &&
    absorcao !== undefined &&
    integral.resumo.precoFinal === gradual.resumo.precoFinal &&
    integral.resumo.precoFinal === absorcao.resumo.precoFinal &&
    integral.resumo.menorMargemPct === gradual.resumo.menorMargemPct &&
    integral.resumo.menorMargemPct === absorcao.resumo.menorMargemPct;

  if (trajetoriasIguais) {
    return (
      "Neste modelo, os dados não diferenciam as estratégias: Integral, Gradual e Absorção produzem " +
      "a mesma trajetória de preço e margem no período."
    );
  }

  const frases = evidencias.cenarios.map(fraseEstrategia);
  return frases.join(" ");
}
