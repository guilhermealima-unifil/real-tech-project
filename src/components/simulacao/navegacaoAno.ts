/**
 * Navegação entre os anos disponíveis no Resultado — puro, sem estado: dado
 * o ano atual e a lista de anos já ordenada (ver NavegacaoAnalise.tsx), diz
 * qual é o anterior/próximo. `null` quando não existe (2026 não tem
 * anterior, o último ano não tem próximo) — sem "dar a volta" (2033 →
 * 2026). O estado selecionado continua sendo sempre o mesmo
 * `anoSelecionado` de quem chama; este módulo só calcula, nunca guarda ano.
 */
export function anoAnterior(anos: number[], anoAtual: number): number | null {
  const indice = anos.indexOf(anoAtual);
  if (indice <= 0) return null;
  return anos[indice - 1];
}

export function anoProximo(anos: number[], anoAtual: number): number | null {
  const indice = anos.indexOf(anoAtual);
  if (indice === -1 || indice >= anos.length - 1) return null;
  return anos[indice + 1];
}
