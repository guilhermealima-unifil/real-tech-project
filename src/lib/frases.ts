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
