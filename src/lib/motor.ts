/**
 * Motor de cálculo tributário — função pura, sem dependência de banco ou rede.
 * Ver docs/00-plano-implementacao.md (seção 6) e docs/02-especificacao-completa.md
 * (seções 4 e 6.1) para o desenho e os 8 testes de aceitação.
 *
 * Convenções de unidade:
 * - despesaFixaPct, markupPct, margemAlvoPct, margemMinimaPct: fração decimal (0.20 = 20%).
 * - ParametroTributarioAno (cbsPct, ibsPct, pisCofinsPct, icmsIssPct): porcentagem
 *   inteira (18 = 18%), igual ao exemplo de seed do Documento 1 — convertida para
 *   fração internamente antes de entrar na fórmula.
 *
 * Abordagem "delta desde o ano-base": despesaFixaPct/markupPct, como o empresário
 * informa, já incluem impostos do ano-base (2026) — ver EletroLondrina e In-Pacto
 * nas entrevistas (docs/04-dossie-consolidado.md, seção 5). Como não há como saber
 * quanto desse percentual já é imposto, o motor não decompõe esse valor: ele soma
 * só a VARIAÇÃO da carga tributária total em relação a 2026. Isso explica os
 * Testes 3 e 4 sem inventar nenhum dado que as entrevistas não deram.
 */

import { recomendacaoParaAno } from "./frases";

export type FormulaTipo = "multiplicador" | "markup";
export type Regime = "simples" | "lucroReal";
export type CenarioRepasse = "integral" | "gradual" | "absorcao";

export interface ParametroTributarioAno {
  ano: number;
  /** Porcentagem inteira, ex: 18 = 18%. */
  cbsPct: number;
  ibsPct: number;
  pisCofinsPct: number;
  icmsIssPct: number;
}

export interface SimularEntrada {
  custoCompra: number;
  formulaTipo: FormulaTipo;
  /** Obrigatório quando formulaTipo === "multiplicador". Fração decimal. */
  despesaFixaPct?: number;
  /** Obrigatório quando formulaTipo === "markup". Fração decimal. */
  markupPct?: number;
  margemAlvoPct: number;
  margemMinimaPct: number;
  regime: Regime;
  tetoPracaMin?: number;
  tetoPracaMax?: number;
  /** Default "integral" — "gradual" e "absorcao" ainda não implementados (Fase 3). */
  cenarioRepasse?: CenarioRepasse;
}

export interface ResultadoAno {
  ano: number;
  preco: number;
  margemResultante: number;
  /** Porcentagem inteira do ano (soma de cbsPct+ibsPct+pisCofinsPct+icmsIssPct). */
  tributoTotalPct: number;
  piso: number;
  teto: number | null;
  descontoMaximoPct: number | null;
  alertaDisparado: boolean;
  mensagemRecomendacao: string | null;
}

const ANO_BASE = 2026;

function tributoTotalPctInteiro(p: ParametroTributarioAno): number {
  return p.cbsPct + p.ibsPct + p.pisCofinsPct + p.icmsIssPct;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

export function simular(
  entrada: SimularEntrada,
  parametros: ParametroTributarioAno[],
): ResultadoAno[] {
  if (entrada.custoCompra <= 0) {
    throw new Error("custoCompra deve ser maior que zero.");
  }

  const cenarioRepasse = entrada.cenarioRepasse ?? "integral";
  if (cenarioRepasse !== "integral") {
    throw new Error(
      `Cenário de repasse "${cenarioRepasse}" ainda não implementado (Fase 3, ` +
        `docs/00-plano-implementacao.md). Só "integral" está disponível hoje.`,
    );
  }

  if (entrada.formulaTipo === "multiplicador" && entrada.despesaFixaPct === undefined) {
    throw new Error("despesaFixaPct é obrigatório quando formulaTipo é 'multiplicador'.");
  }
  if (entrada.formulaTipo === "markup" && entrada.markupPct === undefined) {
    throw new Error("markupPct é obrigatório quando formulaTipo é 'markup'.");
  }

  const parametrosOrdenados = [...parametros].sort((a, b) => a.ano - b.ano);
  const parametroBase = parametrosOrdenados.find((p) => p.ano === ANO_BASE);
  if (!parametroBase) {
    throw new Error(`Parâmetro tributário do ano-base (${ANO_BASE}) não encontrado.`);
  }
  const tributoBaseFrac = tributoTotalPctInteiro(parametroBase) / 100;

  const teto = entrada.tetoPracaMax ?? entrada.tetoPracaMin ?? null;

  return parametrosOrdenados.map((parametro) => {
    const tributoAnoFrac = tributoTotalPctInteiro(parametro) / 100;
    const deltaTributo = tributoAnoFrac - tributoBaseFrac;

    let preco: number;
    let piso: number;
    let margemResultante: number;

    if (entrada.formulaTipo === "multiplicador") {
      const despesaFixaPct = entrada.despesaFixaPct as number;
      preco = entrada.custoCompra * (1 + despesaFixaPct + deltaTributo + entrada.margemAlvoPct);
      piso = entrada.custoCompra * (1 + despesaFixaPct + deltaTributo + entrada.margemMinimaPct);
      margemResultante = entrada.margemAlvoPct;
    } else {
      const markupPct = entrada.markupPct as number;
      preco = entrada.custoCompra * (1 + markupPct);
      piso = entrada.custoCompra * (1 + entrada.margemMinimaPct + deltaTributo);
      const lucroLiquido = entrada.custoCompra * (markupPct - deltaTributo);
      margemResultante = lucroLiquido / entrada.custoCompra;
    }

    const descontoMaximoPct = preco > 0 ? Math.max((preco - piso) / preco, 0) : null;

    const alertaDisparado =
      (teto !== null && piso > teto) || margemResultante < entrada.margemMinimaPct;

    const precoArredondado = round2(preco);
    const pisoArredondado = round2(piso);
    const margemResultanteArredondada = round4(margemResultante);
    const descontoMaximoArredondado = descontoMaximoPct === null ? null : round4(descontoMaximoPct);

    return {
      ano: parametro.ano,
      preco: precoArredondado,
      margemResultante: margemResultanteArredondada,
      tributoTotalPct: round4(tributoTotalPctInteiro(parametro)),
      piso: pisoArredondado,
      teto,
      descontoMaximoPct: descontoMaximoArredondado,
      alertaDisparado,
      mensagemRecomendacao: recomendacaoParaAno({
        ano: parametro.ano,
        preco: precoArredondado,
        piso: pisoArredondado,
        teto,
        margemResultante: margemResultanteArredondada,
        margemMinimaPct: entrada.margemMinimaPct,
        descontoMaximoPct: descontoMaximoArredondado,
      }),
    };
  });
}
