/**
 * Frases fixas de recomendação — escritas junto do motor (docs/00-plano-implementacao.md,
 * seção 3.6): o motor de regras decide qual alerta disparar, a frase é fixa.
 * Uma camada de IA opcional pode redigir/refinar isso depois — não é dependência
 * do caminho crítico.
 */

import type { StatusPreco } from "./analiseResultado";

export interface DadosParaRecomendacao {
  ano: number;
  preco: number;
  piso: number;
  teto: number | null;
  margemResultante: number;
  margemMinimaPct: number;
  descontoMaximoPct: number | null;
}

export function formatarReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatarPct(fracao: number): string {
  return (fracao * 100).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

/**
 * Prioridade quando mais de uma condição é verdadeira: faixa inviável (piso >
 * teto) vence margem furada — se a praça nem aceita o piso, ajustar só a
 * margem não resolve o problema estrutural.
 */
export function recomendacaoParaAno(dados: DadosParaRecomendacao): string {
  const margemFurada = dados.margemResultante < dados.margemMinimaPct;
  const faixaInviavel = dados.teto !== null && dados.piso > dados.teto;

  if (faixaInviavel) {
    return (
      `Em ${dados.ano}, mesmo vendendo no seu piso de R$ ${formatarReais(dados.piso)}, ` +
      `o preço fica acima do que a praça pratica (até R$ ${formatarReais(dados.teto as number)}) ` +
      `— pode ser hora de rever custo, despesas ou margem.`
    );
  }

  if (margemFurada) {
    return (
      `Em ${dados.ano}, mantendo o preço de R$ ${formatarReais(dados.preco)}, sua margem cai para ` +
      `${formatarPct(dados.margemResultante)}% — abaixo do mínimo de ${formatarPct(dados.margemMinimaPct)}% ` +
      `que você definiu. É hora de reajustar.`
    );
  }

  if (dados.descontoMaximoPct !== null && dados.descontoMaximoPct > 0) {
    return (
      `Em ${dados.ano}, seu preço de R$ ${formatarReais(dados.preco)} está dentro da faixa viável ` +
      `— você pode dar até ${formatarPct(dados.descontoMaximoPct)}% de desconto antes de furar sua ` +
      `margem mínima de ${formatarPct(dados.margemMinimaPct)}%.`
    );
  }

  return (
    `Em ${dados.ano}, seu preço de R$ ${formatarReais(dados.preco)} já está no seu piso de margem ` +
    `— qualquer desconto fura o mínimo de ${formatarPct(dados.margemMinimaPct)}% que você definiu.`
  );
}

export interface DadosLeituraFaixa {
  status: StatusPreco;
  preco: number;
  piso: number;
  teto: number | null;
  descontoMaximoPct: number | null;
}

export interface LeituraFaixaTexto {
  titulo: string;
  /** `null` quando o título já é auto-suficiente (estados "dentro da faixa"). */
  complemento: string | null;
}

/**
 * Leitura NEUTRA da faixa viável (aba "Faixa viável", perto do seletor de
 * estratégia — ver LeituraFaixa.tsx) — não é recomendação nem decisão:
 * interpreta só os fatos que `ResultadoAno` já sustenta (status, piso, teto,
 * preço, desconto disponível), sem conhecer prioridade do empresário,
 * elasticidade ou reação de mercado. Reaproveita `status`
 * (`classificarStatusPreco`, src/lib/analiseResultado.ts) como autoridade de
 * precedência — não reimplementa a comparação piso/teto/preço aqui.
 *
 * Substitui a antiga "Ação recomendada" do header (`resumoRecomendacao`,
 * removida): aquela colapsava "acima do teto" dentro da mesma frase de
 * "mantenha o preço atual" — esta função trata os quatro status como
 * branches distintas, então um preço acima do teto nunca é lido como "tudo
 * bem, mantenha".
 *
 * O número de desconto disponível (`descontoMaximoPct`) só decide QUAL
 * mensagem mostrar (com folga vs. no piso) — o valor em si não é repetido
 * aqui: já aparece em `ResumoResultado` ("Limite seguro"), logo abaixo
 * desta leitura na mesma tela.
 */
export function leituraFaixa(dados: DadosLeituraFaixa): LeituraFaixaTexto {
  if (dados.status === "faixa_inviavel") {
    return {
      titulo: "Não há faixa viável neste ano.",
      complemento:
        "O piso necessário para proteger sua margem está acima do teto informado pela praça.",
    };
  }

  if (dados.status === "abaixo_piso") {
    return {
      titulo: "O preço está abaixo do piso necessário para preservar a margem mínima.",
      complemento: `Faltam R$ ${formatarReais(dados.piso - dados.preco)} para alcançar o piso.`,
    };
  }

  if (dados.status === "acima_teto") {
    return {
      titulo: "O preço está acima do teto informado pela praça.",
      complemento:
        "A estratégia protege a margem, mas excede a referência máxima de preço informada.",
    };
  }

  // dentro_da_faixa: com folga (desconto disponível > 0) ou exatamente no piso.
  if (dados.descontoMaximoPct !== null && dados.descontoMaximoPct > 0) {
    return {
      titulo: "O preço está acima do piso, com folga até a margem mínima.",
      complemento: null,
    };
  }

  return {
    titulo: "O preço está no piso da margem mínima.",
    complemento: null,
  };
}

export interface DadosParaRecomendacaoCaixa {
  ano: number;
  valorProtegido: number;
  valorEmRisco: number;
  prazoPagamentoFornecedorDias: number;
}

/**
 * Fase 5 — impacto no caixa. Ver CLAUDE.md, seção "Desenho do motor": não
 * cita prazo em dias para a fatia em risco porque esse prazo é
 * indeterminado por definição (a dor relatada pelo contador na entrevista,
 * docs/04) — só quantifica o valor em R$ de cada lado.
 */
export function recomendacaoCaixaParaAno(dados: DadosParaRecomendacaoCaixa): string {
  const total = dados.valorProtegido + dados.valorEmRisco;

  if (dados.valorEmRisco <= 0) {
    return (
      `Em ${dados.ano}, os R$ ${formatarReais(total)} de imposto da sua compra já estão totalmente ` +
      `protegidos pelo split payment — o crédito fica disponível assim que você paga o fornecedor, ` +
      `sem depender de mais ninguém recolher nada.`
    );
  }

  if (dados.valorProtegido <= 0) {
    return (
      `Em ${dados.ano}, você paga seu fornecedor em ${dados.prazoPagamentoFornecedorDias} dias, mas os ` +
      `R$ ${formatarReais(total)} de imposto dessa compra ainda dependem inteiramente do fornecedor ` +
      `recolher — sem prazo garantido para você usar esse crédito.`
    );
  }

  return (
    `Em ${dados.ano}, você paga seu fornecedor em ${dados.prazoPagamentoFornecedorDias} dias. Desse ` +
    `pagamento, R$ ${formatarReais(dados.valorProtegido)} de imposto já está protegido pelo split ` +
    `payment (crédito disponível assim que você paga); R$ ${formatarReais(dados.valorEmRisco)} ainda ` +
    `depende do fornecedor recolher, sem prazo garantido.`
  );
}

export interface DadosStatusPreco {
  ano: number;
  /** Já classificado por src/lib/analiseResultado.ts — esta função só formata o texto, não decide a categoria. */
  status: "abaixo_piso" | "dentro_da_faixa" | "acima_teto" | "faixa_inviavel";
  preco: number;
  piso: number;
  teto: number | null;
}

/**
 * Resumo executivo do Resultado (evolução pós-wizard) — mesma convenção de
 * `recomendacaoParaAno`: recebe dados já calculados, só decide a frase.
 */
export function mensagemStatusPreco(dados: DadosStatusPreco): string {
  if (dados.status === "faixa_inviavel") {
    return (
      `Mesmo no piso de R$ ${formatarReais(dados.piso)}, o preço fica acima do que a praça pratica ` +
      `(até R$ ${formatarReais(dados.teto as number)}) em ${dados.ano} — não há preço que atenda a ` +
      `margem mínima e a praça ao mesmo tempo. Vale rever custo, despesa ou margem.`
    );
  }

  if (dados.status === "abaixo_piso") {
    return (
      `Seu preço atual está R$ ${formatarReais(dados.piso - dados.preco)} abaixo do piso ` +
      `necessário para ${dados.ano}.`
    );
  }

  if (dados.status === "acima_teto") {
    return (
      `Seu preço atual está R$ ${formatarReais(dados.preco - (dados.teto as number))} acima do que ` +
      `a praça pratica em ${dados.ano} — isso é uma decisão comercial, não um problema estrutural.`
    );
  }

  return `Seu preço atual está dentro da faixa viável para ${dados.ano}.`;
}

export interface DadosAnaliseDesconto {
  /** `valorDescontoPedidoReais - valorDescontoMaximoReais`, de src/lib/analiseResultado.ts. Positivo = ultrapassa. */
  excedenteReais: number;
}

/** Mesma convenção das outras: recebe o número já calculado, só formata a frase. */
export function mensagemAnaliseDesconto(dados: DadosAnaliseDesconto): string {
  if (dados.excedenteReais > 0) {
    return `Esse desconto ultrapassa o limite seguro em R$ ${formatarReais(dados.excedenteReais)}.`;
  }

  if (dados.excedenteReais < 0) {
    return (
      `Esse desconto cabe dentro do limite seguro, com folga de ` +
      `R$ ${formatarReais(-dados.excedenteReais)}.`
    );
  }

  return `Esse desconto usa exatamente o limite seguro, no piso da sua margem mínima.`;
}

export interface DadosPrecoEstrategia {
  /** `resultado.preco` — o preço que a fórmula/estratégia produz, sem nenhuma correção de piso. */
  precoEstrategia: number;
  /** Já classificado por src/lib/analiseResultado.ts — decide qual das quatro frases mostrar. */
  status: StatusPreco;
}

/**
 * Frase factual que acompanha o preço da estratégia no card principal —
 * NUNCA usa "recomendado"/"reajuste recomendado" (auditoria: `preco` que a
 * estratégia produz não é uma recomendação comercial independente, ver
 * `calcularPrecoRecomendado` em src/lib/analiseResultado.ts). Descreve só o
 * que o status já garante, sem prescrever o que o empresário "deve" cobrar:
 *
 * - `abaixo_piso`: não é tratado aqui — o card mostra o bloco "Para
 *   preservar sua margem mínima" à parte (ver `mensagemReajusteNecessario`
 *   abaixo), então esta função não precisa de uma frase própria para esse
 *   status.
 * - `acima_teto`: reconhece o teto explicitamente — o preço já preserva a
 *   margem, mas ultrapassa a referência de mercado (Caso C, Integral, 2027).
 * - `faixa_inviavel`: nenhum preço comercial fictício — descreve a
 *   inviabilidade estrutural (piso > teto).
 * - `dentro_da_faixa`: frase neutra, sem repetir o número (já é o valor em
 *   destaque do card).
 */
export function mensagemPrecoEstrategia(dados: DadosPrecoEstrategia): string {
  if (dados.status === "faixa_inviavel") {
    return "Não existe preço que atenda sua margem mínima e o teto da praça ao mesmo tempo.";
  }

  if (dados.status === "acima_teto") {
    return "Este preço preserva sua margem, mas está acima do teto informado pela praça.";
  }

  if (dados.status === "abaixo_piso") {
    return `Este preço, de R$ ${formatarReais(dados.precoEstrategia)}, fica abaixo do piso da sua margem mínima.`;
  }

  return "Este preço preserva sua margem mínima.";
}

export interface DadosReajusteNecessario {
  /** `piso - preco`, de `calcularDiferencaPreco(piso, preco)` (src/lib/analiseResultado.ts) — nenhum cálculo novo aqui. */
  diferencaValor: number;
  diferencaPercentual: number | null;
}

/**
 * Frase factual para o bloco "Para preservar sua margem mínima" (só
 * renderizado quando `status === "abaixo_piso"`, ver ResumoResultado.tsx) —
 * descreve o valor necessário, não prescreve uma decisão comercial: nunca
 * diz que o empresário "deve" cobrar esse preço.
 */
export function mensagemReajusteNecessario(dados: DadosReajusteNecessario): string {
  const percentual =
    dados.diferencaPercentual !== null ? ` (${formatarPct(dados.diferencaPercentual)}%)` : "";
  return `É necessário elevar o preço em R$ ${formatarReais(dados.diferencaValor)}${percentual} para atingir o piso.`;
}
