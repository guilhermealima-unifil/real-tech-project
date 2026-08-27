/**
 * Validação estrutural de POST /api/simulacoes — NÃO recalcula regra
 * tributária nenhuma (isso já rodou no cliente, em src/lib/motor.ts, antes
 * do payload chegar aqui). Só garante que o JSON tem o formato esperado:
 * tipos, presença, números finitos, tamanhos razoáveis. Mesmo padrão de
 * src/lib/validacao.ts (função pura, sem banco, devolve { ok, erros }).
 *
 * `ramoId` existir de fato é responsabilidade da rota (tem acesso ao
 * Prisma) — mesma divisão de responsabilidade já usada em
 * /api/simular-cenarios (validacao.ts valida forma, a rota confere o FK).
 */

import type { CenarioRepasse, FormulaTipo, ImpactoCaixaAno, ResultadoAno } from "./motor";

const CENARIOS_VALIDOS: CenarioRepasse[] = ["integral", "gradual", "absorcao"];
const ANO_MIN = 2000;
const ANO_MAX = 2200;
const MAX_ANOS_POR_CENARIO = 50; // generoso acima dos 8 anos reais (2026-2033) — só um teto defensivo
const MAX_TAMANHO_MENSAGEM = 2000;
const MAX_TAMANHO_ROTULO = 200;

export interface EntradaSimulacaoSalva {
  ramoId: string;
  ramoRotulo: string;
  ramoAliquotaSugerida: number;
  formulaTipo: FormulaTipo;
  custoCompra: number;
  despesaFixaPct: number | null;
  markupPct: number | null;
  margemAlvoPct: number;
  margemMinimaPct: number;
  tetoPracaMin: number | null;
  tetoPracaMax: number | null;
  prazoPagamentoFornecedorDias: number | null;
  cenarios: Record<CenarioRepasse, ResultadoAno[]>;
  impactoCaixa: ImpactoCaixaAno[] | null;
}

export type ResultadoValidacaoSimulacaoSalva =
  | { ok: true; entrada: EntradaSimulacaoSalva }
  | { ok: false; erros: string[] };

function numeroFinito(valor: unknown): number | undefined {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : undefined;
}

function numeroFinitoOuNulo(valor: unknown): { ok: true; valor: number | null } | { ok: false } {
  if (valor === null || valor === undefined) return { ok: true, valor: null };
  const n = numeroFinito(valor);
  return n === undefined ? { ok: false } : { ok: true, valor: n };
}

function textoNaoVazio(valor: unknown, tamanhoMax: number): valor is string {
  return typeof valor === "string" && valor.trim().length > 0 && valor.length <= tamanhoMax;
}

function mensagemOuNulaValida(valor: unknown): boolean {
  if (valor === null || valor === undefined) return true;
  return typeof valor === "string" && valor.length <= MAX_TAMANHO_MENSAGEM;
}

/** Valida um item de `cenarios[x]` (mesmo shape de ResultadoAno). */
function validarResultadoAno(item: unknown, contexto: string, erros: string[]): ResultadoAno | undefined {
  if (typeof item !== "object" || item === null) {
    erros.push(`${contexto} deve ser um objeto.`);
    return undefined;
  }
  const r = item as Record<string, unknown>;

  const ano = numeroFinito(r.ano);
  if (ano === undefined || !Number.isInteger(ano) || ano < ANO_MIN || ano > ANO_MAX) {
    erros.push(`${contexto}.ano inválido.`);
  }
  const preco = numeroFinito(r.preco);
  if (preco === undefined) erros.push(`${contexto}.preco inválido.`);
  const margemResultante = numeroFinito(r.margemResultante);
  if (margemResultante === undefined) erros.push(`${contexto}.margemResultante inválido.`);
  const tributoTotalPct = numeroFinito(r.tributoTotalPct);
  if (tributoTotalPct === undefined) erros.push(`${contexto}.tributoTotalPct inválido.`);
  const piso = numeroFinito(r.piso);
  if (piso === undefined) erros.push(`${contexto}.piso inválido.`);

  const tetoResultado = numeroFinitoOuNulo(r.teto);
  if (!tetoResultado.ok) erros.push(`${contexto}.teto deve ser número ou null.`);
  const descontoResultado = numeroFinitoOuNulo(r.descontoMaximoPct);
  if (!descontoResultado.ok) erros.push(`${contexto}.descontoMaximoPct deve ser número ou null.`);

  if (typeof r.alertaDisparado !== "boolean") {
    erros.push(`${contexto}.alertaDisparado deve ser booleano.`);
  }
  if (!mensagemOuNulaValida(r.mensagemRecomendacao)) {
    erros.push(`${contexto}.mensagemRecomendacao deve ser string (até ${MAX_TAMANHO_MENSAGEM} caracteres) ou null.`);
  }

  if (
    ano === undefined ||
    preco === undefined ||
    margemResultante === undefined ||
    tributoTotalPct === undefined ||
    piso === undefined ||
    !tetoResultado.ok ||
    !descontoResultado.ok ||
    typeof r.alertaDisparado !== "boolean" ||
    !mensagemOuNulaValida(r.mensagemRecomendacao)
  ) {
    return undefined;
  }

  return {
    ano,
    preco,
    margemResultante,
    tributoTotalPct,
    piso,
    teto: tetoResultado.valor,
    descontoMaximoPct: descontoResultado.valor,
    alertaDisparado: r.alertaDisparado,
    mensagemRecomendacao: (r.mensagemRecomendacao as string | null) ?? null,
  };
}

function validarImpactoCaixaAno(item: unknown, contexto: string, erros: string[]): ImpactoCaixaAno | undefined {
  if (typeof item !== "object" || item === null) {
    erros.push(`${contexto} deve ser um objeto.`);
    return undefined;
  }
  const r = item as Record<string, unknown>;

  const ano = numeroFinito(r.ano);
  if (ano === undefined || !Number.isInteger(ano) || ano < ANO_MIN || ano > ANO_MAX) {
    erros.push(`${contexto}.ano inválido.`);
  }
  const valorProtegido = numeroFinito(r.valorProtegido);
  if (valorProtegido === undefined || valorProtegido < 0) {
    erros.push(`${contexto}.valorProtegido inválido.`);
  }
  const valorEmRisco = numeroFinito(r.valorEmRisco);
  if (valorEmRisco === undefined || valorEmRisco < 0) {
    erros.push(`${contexto}.valorEmRisco inválido.`);
  }
  // Diferente de ResultadoAno, ImpactoCaixaAno.mensagemRecomendacao nunca é
  // null — recomendacaoCaixaParaAno (src/lib/frases.ts) sempre devolve uma
  // das 3 frases fixas.
  const mensagemValida = textoNaoVazio(r.mensagemRecomendacao, MAX_TAMANHO_MENSAGEM);
  if (!mensagemValida) {
    erros.push(`${contexto}.mensagemRecomendacao deve ser uma string não vazia (até ${MAX_TAMANHO_MENSAGEM} caracteres).`);
  }

  if (
    ano === undefined ||
    valorProtegido === undefined ||
    valorProtegido < 0 ||
    valorEmRisco === undefined ||
    valorEmRisco < 0 ||
    !mensagemValida
  ) {
    return undefined;
  }

  return {
    ano,
    valorProtegido,
    valorEmRisco,
    mensagemRecomendacao: r.mensagemRecomendacao as string,
  };
}

export function validarEntradaSimulacaoSalva(body: unknown): ResultadoValidacaoSimulacaoSalva {
  const erros: string[] = [];

  if (typeof body !== "object" || body === null) {
    return { ok: false, erros: ["Corpo da requisição deve ser um objeto JSON."] };
  }
  const b = body as Record<string, unknown>;

  const ramoId = textoNaoVazio(b.ramoId, 100) ? b.ramoId : undefined;
  if (!ramoId) erros.push("ramoId é obrigatório.");

  const ramoRotulo = textoNaoVazio(b.ramoRotulo, MAX_TAMANHO_ROTULO) ? b.ramoRotulo : undefined;
  if (!ramoRotulo) erros.push("ramoRotulo é obrigatório.");

  const ramoAliquotaSugerida = numeroFinito(b.ramoAliquotaSugerida);
  if (ramoAliquotaSugerida === undefined || ramoAliquotaSugerida < 0 || ramoAliquotaSugerida > 100) {
    erros.push("ramoAliquotaSugerida é obrigatório, entre 0 e 100.");
  }

  const formulaTipo =
    b.formulaTipo === "multiplicador" || b.formulaTipo === "markup"
      ? (b.formulaTipo as FormulaTipo)
      : undefined;
  if (!formulaTipo) erros.push('formulaTipo deve ser "multiplicador" ou "markup".');

  const custoCompra = numeroFinito(b.custoCompra);
  if (custoCompra === undefined || custoCompra <= 0) {
    erros.push("custoCompra é obrigatório e deve ser maior que zero.");
  }

  const despesaFixaPctResultado = numeroFinitoOuNulo(b.despesaFixaPct);
  if (!despesaFixaPctResultado.ok) erros.push("despesaFixaPct deve ser número ou null.");
  const markupPctResultado = numeroFinitoOuNulo(b.markupPct);
  if (!markupPctResultado.ok) erros.push("markupPct deve ser número ou null.");
  if (formulaTipo === "multiplicador" && despesaFixaPctResultado.ok && despesaFixaPctResultado.valor === null) {
    erros.push("despesaFixaPct é obrigatório quando formulaTipo é multiplicador.");
  }
  if (formulaTipo === "markup" && markupPctResultado.ok && markupPctResultado.valor === null) {
    erros.push("markupPct é obrigatório quando formulaTipo é markup.");
  }

  const margemAlvoPct = numeroFinito(b.margemAlvoPct);
  if (margemAlvoPct === undefined || margemAlvoPct < 0 || margemAlvoPct > 100) {
    erros.push("margemAlvoPct é obrigatório, entre 0 e 100.");
  }
  const margemMinimaPct = numeroFinito(b.margemMinimaPct);
  if (margemMinimaPct === undefined || margemMinimaPct < 0 || margemMinimaPct > 100) {
    erros.push("margemMinimaPct é obrigatório, entre 0 e 100.");
  }

  const tetoPracaMinResultado = numeroFinitoOuNulo(b.tetoPracaMin);
  if (!tetoPracaMinResultado.ok) erros.push("tetoPracaMin deve ser número ou null.");
  const tetoPracaMaxResultado = numeroFinitoOuNulo(b.tetoPracaMax);
  if (!tetoPracaMaxResultado.ok) erros.push("tetoPracaMax deve ser número ou null.");

  const prazoResultado = numeroFinitoOuNulo(b.prazoPagamentoFornecedorDias);
  if (!prazoResultado.ok || (prazoResultado.valor !== null && (!Number.isInteger(prazoResultado.valor) || prazoResultado.valor < 0))) {
    erros.push("prazoPagamentoFornecedorDias deve ser um inteiro maior ou igual a zero, ou null.");
  }

  // cenarios: objeto com exatamente as 3 chaves conhecidas, cada uma um array.
  const cenarios: Record<CenarioRepasse, ResultadoAno[]> = { integral: [], gradual: [], absorcao: [] };
  if (typeof b.cenarios !== "object" || b.cenarios === null) {
    erros.push("cenarios é obrigatório e deve ser um objeto.");
  } else {
    const c = b.cenarios as Record<string, unknown>;
    for (const cenario of CENARIOS_VALIDOS) {
      const lista = c[cenario];
      if (!Array.isArray(lista) || lista.length === 0) {
        erros.push(`cenarios.${cenario} é obrigatório e deve ser uma lista não vazia.`);
        continue;
      }
      if (lista.length > MAX_ANOS_POR_CENARIO) {
        erros.push(`cenarios.${cenario} excede o número máximo de anos permitido.`);
        continue;
      }
      const validados: ResultadoAno[] = [];
      lista.forEach((item, indice) => {
        const resultado = validarResultadoAno(item, `cenarios.${cenario}[${indice}]`, erros);
        if (resultado) validados.push(resultado);
      });
      cenarios[cenario] = validados;
    }
  }

  // impactoCaixa: opcional — array ou null.
  let impactoCaixa: ImpactoCaixaAno[] | null = null;
  if (b.impactoCaixa !== null && b.impactoCaixa !== undefined) {
    if (!Array.isArray(b.impactoCaixa)) {
      erros.push("impactoCaixa deve ser uma lista ou null.");
    } else if (b.impactoCaixa.length > MAX_ANOS_POR_CENARIO) {
      erros.push("impactoCaixa excede o número máximo de anos permitido.");
    } else {
      const validados: ImpactoCaixaAno[] = [];
      b.impactoCaixa.forEach((item, indice) => {
        const resultado = validarImpactoCaixaAno(item, `impactoCaixa[${indice}]`, erros);
        if (resultado) validados.push(resultado);
      });
      impactoCaixa = validados;
    }
  }

  if (erros.length > 0) return { ok: false, erros };

  return {
    ok: true,
    entrada: {
      ramoId: ramoId as string,
      ramoRotulo: ramoRotulo as string,
      ramoAliquotaSugerida: ramoAliquotaSugerida as number,
      formulaTipo: formulaTipo as FormulaTipo,
      custoCompra: custoCompra as number,
      despesaFixaPct: despesaFixaPctResultado.ok ? despesaFixaPctResultado.valor : null,
      markupPct: markupPctResultado.ok ? markupPctResultado.valor : null,
      margemAlvoPct: margemAlvoPct as number,
      margemMinimaPct: margemMinimaPct as number,
      tetoPracaMin: tetoPracaMinResultado.ok ? tetoPracaMinResultado.valor : null,
      tetoPracaMax: tetoPracaMaxResultado.ok ? tetoPracaMaxResultado.valor : null,
      prazoPagamentoFornecedorDias: prazoResultado.ok ? prazoResultado.valor : null,
      cenarios,
      impactoCaixa,
    },
  };
}
