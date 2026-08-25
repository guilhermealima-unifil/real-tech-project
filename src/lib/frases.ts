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
