/**
 * Cálculos derivados de apresentação para a área de Resultado — puramente
 * matemáticos (subtração, divisão, comparação), sem nenhuma regra
 * tributária ou de margem: essas continuam vivendo só em src/lib/motor.ts.
 * Cada função aqui só combina valores que `simular()` já devolveu (mais,
 * quando indicado, `custoCompra` — dado bruto do formulário, não um valor
 * calculado).
 */

import type { ResultadoAno } from "./motor";

export type StatusPreco = "abaixo_piso" | "dentro_da_faixa" | "acima_teto" | "faixa_inviavel";

/**
 * Classifica o preço analisado usando só `preco`/`piso`/`teto`, já
 * devolvidos por simular(). `faixa_inviavel` (piso > teto) é checado
 * primeiro e é mutuamente exclusivo dos outros — mesma condição que
 * `calcularPrecoRecomendado` já usa para não recomendar preço nenhum;
 * antes essa classificação caía sem distinção dentro de `acima_teto`.
 */
export function classificarStatusPreco(
  preco: number,
  piso: number,
  teto: number | null,
): StatusPreco {
  if (teto !== null && piso > teto) return "faixa_inviavel";
  if (preco < piso) return "abaixo_piso";
  if (teto !== null && preco > teto) return "acima_teto";
  return "dentro_da_faixa";
}

/**
 * Preço recomendado — regra objetiva derivada do que já existe, sem
 * inventar estratégia comercial nova:
 * - faixa inviável (`piso > teto`): não existe preço que sirva as duas
 *   restrições ao mesmo tempo — sem recomendação (`null`).
 * - preço abaixo do piso: recomenda o piso. Isso já é a leitura implícita
 *   da mensagem de alerta existente em frases.ts ("é hora de reajustar")
 *   quando a margem está furada — piso é literalmente o preço mínimo que
 *   restaura a margem mínima configurada.
 * - preço dentro do piso, mesmo que acima do teto: mantém o preço atual.
 *   NÃO fazemos cap automático no teto da praça — ver PENDÊNCIA no
 *   relatório da etapa: nada no produto hoje estabelece "nunca cobrar
 *   acima da praça" como regra (o próprio `alertaDisparado` do motor não
 *   considera `preco > teto` um problema, só `piso > teto`), então essa
 *   ação não é assumida automaticamente aqui.
 */
export function calcularPrecoRecomendado(resultado: ResultadoAno): number | null {
  const faixaInviavel = resultado.teto !== null && resultado.piso > resultado.teto;
  if (faixaInviavel) return null;
  if (resultado.preco < resultado.piso) return resultado.piso;
  return resultado.preco;
}

export interface DiferencaPreco {
  valor: number;
  percentual: number | null;
}

/** `precoRecomendado - precoAtual`, em reais e em fração — subtração e divisão puras. */
export function calcularDiferencaPreco(precoRecomendado: number, precoAtual: number): DiferencaPreco {
  const valor = precoRecomendado - precoAtual;
  return { valor, percentual: precoAtual > 0 ? valor / precoAtual : null };
}

export interface AnaliseDescontoResultado {
  descontoPedidoFracao: number;
  valorDescontoPedidoReais: number;
  precoFinal: number;
  descontoMaximoPct: number | null;
  valorDescontoMaximoReais: number;
  /** `valorDescontoPedidoReais - valorDescontoMaximoReais`. Positivo = ultrapassa o limite seguro. */
  excedenteReais: number;
  dentroDoLimite: boolean;
  margemAposDesconto: number | null;
}

/**
 * `margemAposDesconto` usa uma identidade contábil, não uma regra
 * tributária nova: a custo fixo, cada real a menos de preço é um real a
 * menos de margem. `margemResultante`, do jeito que `simular()` já a
 * define, é sempre uma fração de `custoCompra` — então
 * `margemResultante + (precoFinal - preco) / custoCompra` é só reler essa
 * mesma fração no novo preço, sem recalcular despesa/markup/delta
 * tributário. Verificado matematicamente (e testado em
 * analiseResultado.test.ts, nos dois modelos e com repasse parcial): em
 * `precoFinal === piso`, essa fórmula sempre devolve `margemMinimaPct` —
 * exatamente a garantia que `piso` já representa por definição no motor.
 */
export function analisarDesconto(
  resultado: ResultadoAno,
  custoCompra: number,
  descontoPedidoPct: number,
): AnaliseDescontoResultado {
  const descontoPedidoFracao = descontoPedidoPct / 100;
  const valorDescontoPedidoReais = resultado.preco * descontoPedidoFracao;
  const precoFinal = resultado.preco - valorDescontoPedidoReais;
  const valorDescontoMaximoReais = resultado.preco - resultado.piso;
  const excedenteReais = valorDescontoPedidoReais - valorDescontoMaximoReais;

  return {
    descontoPedidoFracao,
    valorDescontoPedidoReais,
    precoFinal,
    descontoMaximoPct: resultado.descontoMaximoPct,
    valorDescontoMaximoReais,
    excedenteReais,
    dentroDoLimite: excedenteReais <= 0,
    margemAposDesconto:
      custoCompra > 0
        ? resultado.margemResultante + (precoFinal - resultado.preco) / custoCompra
        : null,
  };
}
