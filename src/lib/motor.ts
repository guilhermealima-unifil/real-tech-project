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

import { recomendacaoCaixaParaAno, recomendacaoParaAno } from "./frases";

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
  /**
   * Default "integral". Só afeta `formulaTipo === "multiplicador"` — ver
   * CLAUDE.md, seção "Desenho do motor", para o porquê do markup ficar de
   * fora.
   */
  cenarioRepasse?: CenarioRepasse;
}

export interface ImpactoCaixaAno {
  ano: number;
  /** R$ do imposto embutido na compra já sob split payment — crédito disponível no ato do pagamento (à vista) ou parcela a parcela (docs/05). */
  valorProtegido: number;
  /** R$ do imposto embutido na compra ainda sob PIS/Cofins + ICMS/ISS — crédito sujeito ao fornecedor recolher, prazo indeterminado. */
  valorEmRisco: number;
  mensagemRecomendacao: string;
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

  const idxBase = parametrosOrdenados.findIndex((p) => p.ano === ANO_BASE);
  const idxUltimo = parametrosOrdenados.length - 1;

  /**
   * Fração do delta tributário do ano que é repassada ao preço (o resto
   * fica com a margem). "integral" repassa tudo de uma vez (comportamento
   * original, cenário default). "absorcao" nunca repassa — o preço fica
   * congelado no nível do ano-base e a margem cai o quanto o delta subir.
   * "gradual" faz a fração crescer linearmente até chegar a 1 no ÚLTIMO
   * ano presente em `parametros` (hoje 2033, fim da transição prevista na
   * LC 214/2025 — ver docs/05) — não é um valor fixo no código porque o
   * seed é quem define até quando a transição vai.
   */
  function fracaoRepasse(indice: number): number {
    if (cenarioRepasse === "integral") return 1;
    if (cenarioRepasse === "absorcao") return 0;
    if (idxUltimo === idxBase) return 1;
    const fracao = (indice - idxBase) / (idxUltimo - idxBase);
    return Math.min(Math.max(fracao, 0), 1);
  }

  const teto = entrada.tetoPracaMax ?? entrada.tetoPracaMin ?? null;

  return parametrosOrdenados.map((parametro, indice) => {
    const tributoAnoFrac = tributoTotalPctInteiro(parametro) / 100;
    const deltaTributo = tributoAnoFrac - tributoBaseFrac;
    const deltaTributoRepassado = deltaTributo * fracaoRepasse(indice);

    let preco: number;
    let piso: number;
    let margemResultante: number;

    if (entrada.formulaTipo === "multiplicador") {
      const despesaFixaPct = entrada.despesaFixaPct as number;
      // Piso reflete sempre o delta CHEIO (custo real do ano), independente
      // do cenário — é a régua de "quanto custaria cobrir o imposto de
      // verdade", não do que a estratégia de repasse escolheu praticar.
      preco =
        entrada.custoCompra * (1 + despesaFixaPct + deltaTributoRepassado + entrada.margemAlvoPct);
      piso = entrada.custoCompra * (1 + despesaFixaPct + deltaTributo + entrada.margemMinimaPct);
      margemResultante = entrada.margemAlvoPct - (deltaTributo - deltaTributoRepassado);
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

/**
 * Impacto no caixa (Fase 5) — não modela dias, modela quanto do imposto da
 * COMPRA (não da venda) já está protegido pelo split payment vs. ainda sob
 * o regime antigo. Ver CLAUDE.md, seção "Desenho do motor", e docs/05 para
 * o porquê: o prazo de recuperação de crédito no regime antigo é incerto
 * por definição (a própria dor relatada pelo contador na entrevista), então
 * o motor não inventa um número de dias para ele — só quantifica o valor em
 * R$ que está de um lado ou do outro, ano a ano.
 *
 * `cbsPct + ibsPct` = fatia sob split payment (crédito ~imediato, à vista
 * ou parcela a parcela). `pisCofinsPct + icmsIssPct` = fatia sob o regime
 * antigo (crédito depende do fornecedor recolher, prazo indeterminado).
 */
export function calcularImpactoCaixa(
  custoCompra: number,
  prazoPagamentoFornecedorDias: number,
  parametros: ParametroTributarioAno[],
): ImpactoCaixaAno[] {
  if (custoCompra <= 0) {
    throw new Error("custoCompra deve ser maior que zero.");
  }

  return [...parametros]
    .sort((a, b) => a.ano - b.ano)
    .map((parametro) => {
      const valorProtegido = round2((custoCompra * (parametro.cbsPct + parametro.ibsPct)) / 100);
      const valorEmRisco = round2((custoCompra * (parametro.pisCofinsPct + parametro.icmsIssPct)) / 100);

      return {
        ano: parametro.ano,
        valorProtegido,
        valorEmRisco,
        mensagemRecomendacao: recomendacaoCaixaParaAno({
          ano: parametro.ano,
          valorProtegido,
          valorEmRisco,
          prazoPagamentoFornecedorDias,
        }),
      };
    });
}
