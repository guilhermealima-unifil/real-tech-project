/**
 * Evidências estruturadas para "Comparar estratégias" — combina só o que
 * `ComparacaoCenarios.tsx` já calcula (via `resumirCenario` e
 * `classificarStatusPreco`, ambos determinísticos) num objeto único, para
 * alimentar tanto os alertas locais (Parte I do prompt da etapa) quanto o
 * payload enviado à IA (`leituraComparacaoPrompt.ts`) e o fallback
 * determinístico (`leituraComparacaoFallback.ts`). Não chama nem reimplementa
 * o motor — cada campo aqui é uma leitura direta de `ResultadoAno`/`ResumoCenario`.
 */

import { classificarStatusPreco, type StatusPreco } from "./analiseResultado";
import type { CenarioRepasse, ResultadoAno } from "./motor";
import { resumirCenario, type ResumoCenario } from "./resumoCenario";

/** Mesmos rótulos de src/components/simulacao/SeletorEstrategiaRepasse.tsx — duplicado aqui porque src/lib não deve depender de src/components. */
const ROTULOS_CENARIO: { valor: CenarioRepasse; rotulo: string }[] = [
  { valor: "integral", rotulo: "Repasse integral" },
  { valor: "gradual", rotulo: "Repasse gradual" },
  { valor: "absorcao", rotulo: "Absorção" },
];

export interface EvidenciaCenario {
  cenario: CenarioRepasse;
  rotulo: string;
  resumo: ResumoCenario;
  statusAnoSelecionado: StatusPreco;
  precoAnoSelecionado: number;
  margemAnoSelecionadoPct: number;
  /** Primeiro ano cronológico com `status === "acima_teto"`; `null` se nunca ocorre. */
  primeiroAnoAcimaTeto: number | null;
  /** Primeiro ano cronológico com margem abaixo da mínima; `null` se nunca ocorre. */
  primeiroAnoMargemAbaixoMinima: number | null;
}

export type TipoAlerta =
  | "margem_abaixo_minima"
  | "acima_teto"
  | "faixa_inviavel"
  | "sem_teto_informado"
  | "sem_reajuste"
  | "maior_reajuste"
  | "menor_folga_margem";

export interface AlertaAnalise {
  tipo: TipoAlerta;
  cenario: CenarioRepasse | null;
  rotulo: string;
  texto: string;
}

/**
 * Relações qualitativas entre as três estratégias, sem nenhum número de
 * negócio — só o `CenarioRepasse` (ou lista deles) que a relação aponta, ou
 * `null`/`[]` quando os fatos não sustentam uma resposta inequívoca. Serve
 * de base ao payload da IA (`leituraComparacaoPrompt.ts`): a IA nunca mais
 * recebe "35,00%" ou "R$ 4,25", só "integral" como resposta a
 * `maisPreservaMargem`.
 *
 * Cada campo é derivado de um único critério objetivo já calculado em
 * `ResumoCenario`/`EvidenciaCenario` — nunca decide por empate (ver
 * `unicoExtremo` abaixo): em caso de empate, o campo fica `null` em vez de
 * escolher arbitrariamente.
 */
export interface RelacoesComparacao {
  estrategiasEquivalentes: boolean;
  maisPreservaMargem: CenarioRepasse | null;
  menosPreservaMargem: CenarioRepasse | null;
  precoMaisEstavel: CenarioRepasse | null;
  maiorReajuste: CenarioRepasse | null;
  ultrapassaTetoMaisCedo: CenarioRepasse | null;
  ultrapassaTetoMaisTarde: CenarioRepasse | null;
  nuncaUltrapassaTeto: CenarioRepasse[];
  margemAbaixoMinima: CenarioRepasse[];
  faixaInviavel: CenarioRepasse[];
  /** Só demonstrável quando uma estratégia fica estritamente entre as outras duas tanto em margem quanto em estabilidade de preço — ver `derivarIntermediaria`. */
  intermediaria: CenarioRepasse | null;
}

export interface EvidenciasComparacao {
  anoSelecionado: number;
  margemMinimaFracao: number;
  cenarios: EvidenciaCenario[];
  alertas: AlertaAnalise[];
  relacoes: RelacoesComparacao;
}

/**
 * Monta as evidências dos três cenários para o ano selecionado — mesmos
 * dados que `ComparacaoCenarios.tsx` já usa (`resumirCenario` +
 * `classificarStatusPreco`), só reorganizados num objeto reutilizável por
 * outras camadas (alertas, prompt de IA, fallback).
 */
export function construirEvidenciasComparacao(
  cenarios: Record<CenarioRepasse, ResultadoAno[]>,
  anoSelecionado: number,
  margemMinimaFracao: number,
): EvidenciasComparacao {
  const evidenciasCenarios: EvidenciaCenario[] = ROTULOS_CENARIO.flatMap(({ valor, rotulo }) => {
    const resultados = [...cenarios[valor]].sort((a, b) => a.ano - b.ano);
    const resultadoAno = resultados.find((resultado) => resultado.ano === anoSelecionado);
    if (!resultadoAno) return [];

    const primeiroAcimaTeto = resultados.find(
      (r) => classificarStatusPreco(r.preco, r.piso, r.teto) === "acima_teto",
    );
    const primeiroAbaixoMinima = resultados.find((r) => r.margemResultante < margemMinimaFracao);

    return [
      {
        cenario: valor,
        rotulo,
        resumo: resumirCenario(resultados, margemMinimaFracao),
        statusAnoSelecionado: classificarStatusPreco(
          resultadoAno.preco,
          resultadoAno.piso,
          resultadoAno.teto,
        ),
        precoAnoSelecionado: resultadoAno.preco,
        margemAnoSelecionadoPct: resultadoAno.margemResultante,
        primeiroAnoAcimaTeto: primeiroAcimaTeto?.ano ?? null,
        primeiroAnoMargemAbaixoMinima: primeiroAbaixoMinima?.ano ?? null,
      },
    ];
  });

  return {
    anoSelecionado,
    margemMinimaFracao,
    cenarios: evidenciasCenarios,
    alertas: derivarAlertas(evidenciasCenarios),
    relacoes: derivarRelacoes(evidenciasCenarios),
  };
}

/**
 * Único cenário com o valor extremo (máximo ou mínimo) de `chave` — `null`
 * se houver empate no extremo ou se `cenarios` estiver vazio. Base de todo
 * campo de `RelacoesComparacao` que aponta um único vencedor: nunca escolhe
 * arbitrariamente entre empatados.
 */
function unicoExtremo(
  cenarios: EvidenciaCenario[],
  chave: (c: EvidenciaCenario) => number,
  direcao: "maximo" | "minimo",
): CenarioRepasse | null {
  if (cenarios.length === 0) return null;
  const valores = cenarios.map(chave);
  const alvo = direcao === "maximo" ? Math.max(...valores) : Math.min(...valores);
  const vencedores = cenarios.filter((c) => chave(c) === alvo);
  return vencedores.length === 1 ? vencedores[0].cenario : null;
}

/**
 * Posição intermediária (Parte 2 do prompt desta etapa): só existe quando um
 * cenário fica estritamente entre os outros dois nos dois eixos relevantes —
 * proteção de margem (`menorMargemPct`, maior é melhor) e estabilidade de
 * preço (`|variacaoPrecoAbsoluta|`, menor é mais estável) — e a ordenação é
 * a MESMA nos dois eixos (o do meio em margem também é o do meio em
 * estabilidade). Não usa "gradual" como padrão: com 3 estratégias, calcula a
 * ordenação real e só aceita quando ela é total (sem empate em nenhum dos
 * dois eixos) e concorda entre os dois eixos.
 */
function derivarIntermediaria(cenarios: EvidenciaCenario[]): CenarioRepasse | null {
  if (cenarios.length !== 3) return null;

  const porMargem = [...cenarios].sort((a, b) => a.resumo.menorMargemPct - b.resumo.menorMargemPct);
  const semEmpateMargem = new Set(porMargem.map((c) => c.resumo.menorMargemPct)).size === 3;
  if (!semEmpateMargem) return null;

  const porEstabilidade = [...cenarios].sort(
    (a, b) => Math.abs(a.resumo.variacaoPrecoAbsoluta) - Math.abs(b.resumo.variacaoPrecoAbsoluta),
  );
  const semEmpateEstabilidade =
    new Set(porEstabilidade.map((c) => Math.abs(c.resumo.variacaoPrecoAbsoluta))).size === 3;
  if (!semEmpateEstabilidade) return null;

  const meioMargem = porMargem[1].cenario;
  const meioEstabilidade = porEstabilidade[1].cenario;
  return meioMargem === meioEstabilidade ? meioMargem : null;
}

/**
 * Relações qualitativas (Parte 1/3 do prompt desta etapa) — cada campo é uma
 * comparação determinística entre os cenários já resumidos, nunca um novo
 * cálculo sobre `ResultadoAno`. `estrategiasEquivalentes` reaproveita o mesmo
 * critério (preço final + menor margem idênticos) usado em
 * `leituraComparacaoFallback.ts` para "os dados não diferenciam as
 * estratégias" — quando true, todo campo relacional fica null/[] (não há
 * vencedor a apontar).
 */
function derivarRelacoes(cenarios: EvidenciaCenario[]): RelacoesComparacao {
  const vazio: RelacoesComparacao = {
    estrategiasEquivalentes: false,
    maisPreservaMargem: null,
    menosPreservaMargem: null,
    precoMaisEstavel: null,
    maiorReajuste: null,
    ultrapassaTetoMaisCedo: null,
    ultrapassaTetoMaisTarde: null,
    nuncaUltrapassaTeto: [],
    margemAbaixoMinima: [],
    faixaInviavel: [],
    intermediaria: null,
  };
  if (cenarios.length === 0) return vazio;

  const margemAbaixoMinima = cenarios
    .filter((c) => c.resumo.anosAbaixoMargemMinima > 0)
    .map((c) => c.cenario);
  const faixaInviavel = cenarios.filter((c) => c.resumo.anosFaixaInviavel > 0).map((c) => c.cenario);

  const primeiro = cenarios[0];
  const estrategiasEquivalentes =
    cenarios.length > 1 &&
    cenarios.every(
      (c) =>
        c.resumo.precoFinal === primeiro.resumo.precoFinal &&
        c.resumo.menorMargemPct === primeiro.resumo.menorMargemPct,
    );

  if (estrategiasEquivalentes) {
    return { ...vazio, estrategiasEquivalentes: true, margemAbaixoMinima, faixaInviavel };
  }

  const comTeto = cenarios.filter((c) => c.primeiroAnoAcimaTeto !== null);
  // Faixa inviável (piso > teto) nunca conta como "nunca ultrapassa o teto"
  // — o preço está estruturalmente impossível ali, não "dentro do teto com
  // segurança" (mesma separação de `classificarStatusPreco`: acima_teto e
  // faixa_inviavel são status distintos).
  const nuncaUltrapassaTeto = cenarios
    .filter(
      (c) =>
        c.resumo.menorDistanciaTeto !== null &&
        c.primeiroAnoAcimaTeto === null &&
        c.resumo.anosFaixaInviavel === 0,
    )
    .map((c) => c.cenario);

  return {
    estrategiasEquivalentes: false,
    maisPreservaMargem: unicoExtremo(cenarios, (c) => c.resumo.menorMargemPct, "maximo"),
    menosPreservaMargem: unicoExtremo(cenarios, (c) => c.resumo.menorMargemPct, "minimo"),
    precoMaisEstavel: unicoExtremo(cenarios, (c) => Math.abs(c.resumo.variacaoPrecoAbsoluta), "minimo"),
    maiorReajuste: unicoExtremo(cenarios, (c) => c.resumo.maiorReajusteAnual, "maximo"),
    ultrapassaTetoMaisCedo:
      comTeto.length > 0 ? unicoExtremo(comTeto, (c) => c.primeiroAnoAcimaTeto!, "minimo") : null,
    ultrapassaTetoMaisTarde:
      comTeto.length > 0 ? unicoExtremo(comTeto, (c) => c.primeiroAnoAcimaTeto!, "maximo") : null,
    nuncaUltrapassaTeto,
    margemAbaixoMinima,
    faixaInviavel,
    intermediaria: derivarIntermediaria(cenarios),
  };
}

/**
 * Alertas objetivos derivados só das evidências — nenhum deles declara
 * "melhor estratégia" (ver instruções desta etapa, Parte J): cada alerta
 * descreve um único fato observado (margem furada, teto ultrapassado, sem
 * reajuste, etc.), nunca uma comparação de preferência entre cenários.
 *
 * "Maior reajuste" e "menor folga de margem" só aparecem quando o valor
 * realmente diferencia os cenários entre si (senão, no markup ou em
 * trajetórias idênticas, todo mundo empataria e o alerta seria ruído — ver
 * Parte B do prompt: "não invente trade-off" se os dados não mostram um).
 *
 * Limita a 3 alertas (Parte I: "no máximo 1–3 alertas mais relevantes").
 * Alertas críticos (faixa inviável, teto ultrapassado, margem furada, sem
 * teto informado) entram numa lista de prioridade alta; alertas neutros
 * ("permanece acima da margem mínima", "sem reajuste") e comparativos
 * (maior reajuste/menor folga) entram numa lista de prioridade baixa — só
 * preenchem as vagas que sobrarem, para um alerta cross-cutting como
 * "teto não informado" nunca ser descartado por três avisos redundantes de
 * "está tudo bem".
 *
 * A reassurance "permanece acima da margem mínima" só aparece quando TODOS
 * os cenários estão saudáveis (nenhum alerta de prioridade alta) — é aí que
 * "está tudo bem" é a leitura relevante do período. Quando algum cenário já
 * está em alerta, dizer que outro está "tudo bem" é redundante (a ausência
 * de alerta para ele já comunica isso) e só disputaria vaga no limite de 3
 * com um alerta comparativo mais informativo.
 */
function derivarAlertas(cenarios: EvidenciaCenario[]): AlertaAnalise[] {
  const prioridadeAlta: AlertaAnalise[] = [];
  const prioridadeBaixa: AlertaAnalise[] = [];
  const reassurancesMargem: AlertaAnalise[] = [];
  if (cenarios.length === 0) return prioridadeAlta;

  for (const evidencia of cenarios) {
    const { resumo, rotulo, cenario } = evidencia;

    if (resumo.anosFaixaInviavel > 0) {
      prioridadeAlta.push({
        tipo: "faixa_inviavel",
        cenario,
        rotulo,
        texto: `${rotulo} entra em faixa inviável (piso acima do teto) a partir de ${resumo.primeiroAnoCritico}.`,
      });
      continue;
    }

    if (evidencia.primeiroAnoAcimaTeto !== null) {
      prioridadeAlta.push({
        tipo: "acima_teto",
        cenario,
        rotulo,
        texto: `${rotulo} ultrapassa o teto a partir de ${evidencia.primeiroAnoAcimaTeto}.`,
      });
    }

    if (evidencia.primeiroAnoMargemAbaixoMinima !== null) {
      prioridadeAlta.push({
        tipo: "margem_abaixo_minima",
        cenario,
        rotulo,
        texto: `${rotulo} fica abaixo da margem mínima a partir de ${evidencia.primeiroAnoMargemAbaixoMinima}.`,
      });
    } else if (evidencia.primeiroAnoAcimaTeto === null) {
      reassurancesMargem.push({
        tipo: "margem_abaixo_minima",
        cenario,
        rotulo,
        texto: `${rotulo} permanece acima da margem mínima em todo o período.`,
      });
    }

    if (resumo.anoMaiorReajuste === null && resumo.variacaoPrecoAbsoluta === 0) {
      prioridadeBaixa.push({
        tipo: "sem_reajuste",
        cenario,
        rotulo,
        texto: `${rotulo} não tem reajuste de preço no período.`,
      });
    }
  }

  if (prioridadeAlta.length === 0) {
    prioridadeBaixa.push(...reassurancesMargem);
  }

  if (cenarios.every((c) => c.resumo.menorDistanciaTeto === null)) {
    prioridadeAlta.push({
      tipo: "sem_teto_informado",
      cenario: null,
      rotulo: "Todas as estratégias",
      texto: "Teto da praça não informado — não é possível avaliar pressão competitiva contra o teto.",
    });
  }

  adicionarAlertaComparativo(
    prioridadeBaixa,
    cenarios,
    "maior_reajuste",
    (c) => c.resumo.maiorReajusteAnual,
    (c, rotulo) =>
      `${rotulo} tem o maior reajuste anual do período (R$ ${c.resumo.maiorReajusteAnual.toFixed(2)}${
        c.resumo.anoMaiorReajuste !== null ? `, em ${c.resumo.anoMaiorReajuste}` : ""
      }).`,
    { exigirPositivo: true },
  );

  adicionarAlertaComparativo(
    prioridadeBaixa,
    cenarios,
    "menor_folga_margem",
    (c) => -c.resumo.menorFolgaMargemPct,
    (c, rotulo) => `${rotulo} tem a menor folga de margem do período.`,
  );

  return [...prioridadeAlta, ...prioridadeBaixa].slice(0, 3);
}

/**
 * Só adiciona um alerta "maior/menor X" quando o valor realmente diferencia
 * os cenários (não há empate no topo) — evita afirmar um trade-off que os
 * números não sustentam (ex.: markup, onde os três cenários são idênticos).
 *
 * `exigirPositivo` só se aplica a "maior reajuste": reajuste zero em todos
 * os cenários não é uma diferença real. "Menor folga de margem" não usa essa
 * trava — folga exatamente 0 (margem no piso mínimo) é um fato relevante,
 * não um valor a ignorar.
 */
function adicionarAlertaComparativo(
  alertas: AlertaAnalise[],
  cenarios: EvidenciaCenario[],
  tipo: TipoAlerta,
  chave: (c: EvidenciaCenario) => number,
  texto: (c: EvidenciaCenario, rotulo: string) => string,
  opcoes?: { exigirPositivo?: boolean },
): void {
  if (cenarios.length < 2) return;
  const valores = cenarios.map(chave);
  const maximo = Math.max(...valores);
  if (opcoes?.exigirPositivo && maximo <= 0) return;

  const vencedores = cenarios.filter((c) => chave(c) === maximo);
  if (vencedores.length !== 1) return;

  const vencedor = vencedores[0];
  alertas.push({
    tipo,
    cenario: vencedor.cenario,
    rotulo: vencedor.rotulo,
    texto: texto(vencedor, vencedor.rotulo),
  });
}
