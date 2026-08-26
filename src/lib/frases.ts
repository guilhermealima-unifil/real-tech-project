/**
 * Frases fixas de recomendação — escritas junto do motor (docs/00-plano-implementacao.md,
 * seção 3.6): o motor de regras decide qual alerta disparar, a frase é fixa.
 * Uma camada de IA opcional pode redigir/refinar isso depois — não é dependência
 * do caminho crítico.
 */

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

export interface DadosPrecoRecomendado {
  precoAtual: number;
  /** `null` quando não existe preço recomendado (faixa inviável — ver src/lib/analiseResultado.ts). */
  precoRecomendado: number | null;
  /** `precoRecomendado - precoAtual`, de src/lib/analiseResultado.ts. */
  diferencaValor: number | null;
  diferencaPercentual: number | null;
}

/**
 * A frase que acompanha o preço recomendado — decide entre três formas,
 * pra nunca repetir o mesmo número duas vezes sem dizer nada novo:
 * sem recomendação, preço já no valor certo, ou reajuste necessário.
 */
export function mensagemPrecoRecomendado(dados: DadosPrecoRecomendado): string {
  if (dados.precoRecomendado === null) {
    return "Não existe preço que atenda sua margem mínima e o teto da praça ao mesmo tempo.";
  }

  if (dados.diferencaValor === 0) {
    return `Seu preço atual (R$ ${formatarReais(dados.precoAtual)}) já está no valor recomendado.`;
  }

  const sinal = dados.diferencaValor !== null && dados.diferencaValor > 0 ? "+" : "";
  const percentual =
    dados.diferencaPercentual !== null
      ? ` (${sinal}${formatarPct(dados.diferencaPercentual)}%)`
      : "";

  return (
    `Reajuste recomendado: ${sinal}R$ ${formatarReais(dados.diferencaValor as number)}${percentual}.`
  );
}
