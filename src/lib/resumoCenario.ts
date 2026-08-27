/**
 * Agregação determinística de um cenário de repasse sobre todo o período.
 * Combina somente os valores já persistidos/devolvidos em `ResultadoAno[]`
 * com a margem mínima do snapshot da simulação. Não chama nem replica o
 * motor tributário.
 */

import { classificarStatusPreco } from "./analiseResultado";
import type { ResultadoAno } from "./motor";

export interface ResumoCenario {
  /** Preço do primeiro e do último ano cronológico disponíveis. */
  precoInicial: number;
  precoFinal: number;
  /** `precoFinal - precoInicial`, em reais. */
  variacaoPrecoAbsoluta: number;
  /** Variação percentual na escala de exibição: 2.5 = 2,5%. */
  variacaoPrecoPct: number | null;
  /** Maior diferença positiva entre anos cronológicos consecutivos. */
  maiorReajusteAnual: number;
  /** Ano de chegada do maior reajuste; `null` quando não houve aumento. */
  anoMaiorReajuste: number | null;
  /** Menor `margemResultante` no período, em fração decimal. */
  menorMargemPct: number;
  /** `margemResultante - margemMinimaFracao` no ponto de maior pressão. */
  menorFolgaMargemPct: number;
  anoMenorFolgaMargem: number | null;
  /** Menor `teto - preco`, em reais; `null` quando nenhum ano tem teto. */
  menorDistanciaTeto: number | null;
  anoMenorDistanciaTeto: number | null;
  /** Mantida para consumidores existentes; menor desconto não-nulo do período. */
  menorDescontoPct: number | null;
  anosAbaixoMargemMinima: number;
  /** Conta somente `acima_teto`; faixa inviável é contabilizada separadamente. */
  anosAcimaTeto: number;
  anosFaixaInviavel: number;
  /** Primeiro ano com margem furada ou status de preço crítico. */
  primeiroAnoCritico: number | null;
}

export function resumirCenario(
  resultados: ResultadoAno[],
  margemMinimaFracao: number,
): ResumoCenario {
  const ordenados = [...resultados].sort((a, b) => a.ano - b.ano);
  const primeiro = ordenados[0];
  const ultimo = ordenados.at(-1);

  const precoInicial = primeiro?.preco ?? 0;
  const precoFinal = ultimo?.preco ?? 0;
  const variacaoPrecoAbsoluta = precoFinal - precoInicial;
  const variacaoPrecoPct = precoInicial !== 0 ? (variacaoPrecoAbsoluta / precoInicial) * 100 : null;

  let maiorReajusteAnual = 0;
  let anoMaiorReajuste: number | null = null;
  let menorMargemPct = primeiro?.margemResultante ?? 0;
  let menorFolgaMargemPct = primeiro
    ? primeiro.margemResultante - margemMinimaFracao
    : 0;
  let anoMenorFolgaMargem = primeiro?.ano ?? null;
  let menorDistanciaTeto: number | null = null;
  let anoMenorDistanciaTeto: number | null = null;
  let menorDescontoPct: number | null = null;
  let anosAbaixoMargemMinima = 0;
  let anosAcimaTeto = 0;
  let anosFaixaInviavel = 0;
  let primeiroAnoCritico: number | null = null;

  ordenados.forEach((resultado, indice) => {
    const anterior = ordenados[indice - 1];
    if (anterior) {
      const reajuste = resultado.preco - anterior.preco;
      if (reajuste > maiorReajusteAnual) {
        maiorReajusteAnual = reajuste;
        anoMaiorReajuste = resultado.ano;
      }
    }

    menorMargemPct = Math.min(menorMargemPct, resultado.margemResultante);

    const folgaMargem = resultado.margemResultante - margemMinimaFracao;
    if (folgaMargem < menorFolgaMargemPct) {
      menorFolgaMargemPct = folgaMargem;
      anoMenorFolgaMargem = resultado.ano;
    }

    if (resultado.teto !== null) {
      const distanciaTeto = resultado.teto - resultado.preco;
      if (menorDistanciaTeto === null || distanciaTeto < menorDistanciaTeto) {
        menorDistanciaTeto = distanciaTeto;
        anoMenorDistanciaTeto = resultado.ano;
      }
    }

    if (resultado.descontoMaximoPct !== null) {
      menorDescontoPct =
        menorDescontoPct === null
          ? resultado.descontoMaximoPct
          : Math.min(menorDescontoPct, resultado.descontoMaximoPct);
    }

    const margemAbaixoMinima = resultado.margemResultante < margemMinimaFracao;
    if (margemAbaixoMinima) anosAbaixoMargemMinima += 1;

    const status = classificarStatusPreco(resultado.preco, resultado.piso, resultado.teto);
    if (status === "acima_teto") anosAcimaTeto += 1;
    if (status === "faixa_inviavel") anosFaixaInviavel += 1;

    const critico =
      margemAbaixoMinima ||
      status === "acima_teto" ||
      status === "abaixo_piso" ||
      status === "faixa_inviavel";
    if (critico && primeiroAnoCritico === null) primeiroAnoCritico = resultado.ano;
  });

  return {
    precoInicial,
    precoFinal,
    variacaoPrecoAbsoluta,
    variacaoPrecoPct,
    maiorReajusteAnual,
    anoMaiorReajuste,
    menorMargemPct,
    menorFolgaMargemPct,
    anoMenorFolgaMargem,
    menorDistanciaTeto,
    anoMenorDistanciaTeto,
    menorDescontoPct,
    anosAbaixoMargemMinima,
    anosAcimaTeto,
    anosFaixaInviavel,
    primeiroAnoCritico,
  };
}
