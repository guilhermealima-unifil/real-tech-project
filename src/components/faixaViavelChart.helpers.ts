/**
 * Helpers puros do `FaixaViavelChart` — escala, ticks, geometria e os
 * dados de tooltip/resumo por ano. Nenhuma regra tributária nova: tudo
 * aqui só lê campos que `ResultadoAno` já expõe (ver src/lib/motor.ts).
 *
 * Específico deste gráfico (não é uma lib de charts genérica): assume o
 * formato de dados do Real Tech (ano/preco/piso/teto) e a estética já
 * estabelecida (tokens de cor, formatação pt-BR).
 *
 * Auditoria de `calcularPrecoRecomendado` (src/lib/analiseResultado.ts):
 * "Preço recomendado" não é uma recomendação comercial independente — na
 * maioria dos estados repete `preco`, e só difere dele quando `preco < piso`
 * (nesse caso, é literalmente o próprio `piso`). Como o gráfico já desenha
 * a linha de Piso, uma segunda série "Preço recomendado" só duplicava
 * informação já visível (preço abaixo da linha de piso = mesma leitura, sem
 * precisar de um terceiro valor). Por isso este módulo não usa mais
 * `calcularPrecoRecomendado` — "preço da estratégia" (`ResultadoAno.preco`)
 * e "piso" bastam para o gráfico comunicar os mesmos fatos.
 */

import type { ResultadoAno } from "@/lib/motor";
import { formatarPct, formatarReais } from "@/lib/frases";

export interface DominioEscala {
  min: number;
  max: number;
}

/**
 * Domínio vertical (Y), a partir de TODOS os valores plotados — piso, preço
 * da estratégia e teto (quando existe) — nunca a partir de zero: a faixa
 * costuma ser estreita, e uma escala fixa em zero a esconderia (ver
 * comentário original do componente). Padding proporcional (20% da
 * amplitude); para faixas quase planas (amplitude ~0), 5% do próprio
 * valor, com piso de 1 para não colapsar a escala em domínios muito
 * pequenos.
 */
export function calcularDominioY(resultados: ResultadoAno[]): DominioEscala {
  const valores = resultados.flatMap((r) => [r.piso, r.preco, ...(r.teto !== null ? [r.teto] : [])]);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const folga = (max - min) * 0.2 || max * 0.05 || 1;
  return { min: Math.max(0, min - folga), max: max + folga };
}

/** Mapeamento linear de um domínio de dados para um intervalo de pixels (ou o inverso, para o eixo Y, passando `alcanceMin > alcanceMax`). */
export function escalaLinear(dominio: DominioEscala, alcanceMin: number, alcanceMax: number) {
  const amplitudeDominio = dominio.max - dominio.min || 1;
  const amplitudeAlcance = alcanceMax - alcanceMin;
  return (valor: number) => alcanceMin + ((valor - dominio.min) / amplitudeDominio) * amplitudeAlcance;
}

/**
 * Ticks "redondos" (1/2/5 × potência de 10) dentro do domínio — não os
 * valores exatos de min/max (específicos demais para servir de
 * referência), mas números fáceis de comparar entre anos (ex.: 150, 155,
 * 160), mesma ideia do algoritmo clássico de "nice ticks" de bibliotecas
 * de gráfico, sem depender de nenhuma. `quantidadeAlvo` é uma meta, não uma
 * garantia — o passo arredondado pode gerar um a mais ou a menos.
 */
export function gerarTicksY(dominio: DominioEscala, quantidadeAlvo = 4): number[] {
  const { min, max } = dominio;
  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) return [min];

  const amplitude = max - min;
  const passoBruto = amplitude / Math.max(1, quantidadeAlvo);
  const potencia = Math.pow(10, Math.floor(Math.log10(passoBruto)));
  const normalizado = passoBruto / potencia;

  let passoUnitario: number;
  if (normalizado < 1.5) passoUnitario = 1;
  else if (normalizado < 3) passoUnitario = 2;
  else if (normalizado < 7) passoUnitario = 5;
  else passoUnitario = 10;
  const passo = passoUnitario * potencia;

  const primeiro = Math.ceil(min / passo) * passo;
  const ticks: number[] = [];
  // Tolerância pequena (passo × 1e-6) para o último tick não sumir por
  // erro de ponto flutuante quando `max` cai exatamente sobre um múltiplo
  // do passo.
  for (let valor = primeiro; valor <= max + passo * 1e-6; valor += passo) {
    ticks.push(Math.round(valor * 100) / 100);
  }
  return ticks;
}

export interface ItemDadosAno {
  rotulo: string;
  valor: string;
}

/**
 * Rótulo do preço que `simular()` calcula por ano a partir do custo e da
 * fórmula escolhida (despesa fixa + margem-alvo, ou markup), já ajustado
 * pelo cenário de repasse selecionado — não é um preço observado no
 * mercado nem um "preço atual" que o usuário digita diretamente; é o preço
 * que a ESTRATÉGIA SELECIONADA produz para o ano/cenário em questão (ver
 * src/lib/motor.ts, `ResultadoAno.preco`). Mesmo nome usado em
 * ResumoResultado.tsx ("Preço da estratégia · {ano}") — um único conceito,
 * uma única palavra em toda a UI. Rótulo usado só dentro deste gráfico
 * (legenda/tooltip/resumo/aria-label).
 */
export const ROTULO_PRECO_SIMULACAO = "Preço da estratégia";

/**
 * Linhas de dado de um ano para o tooltip/resumo (ver FaixaViavelChart.tsx)
 * — só leitura e formatação do que `ResultadoAno` já traz. Nenhum cálculo
 * novo, nenhuma regra tributária. Omite teto/desconto quando `null` (nunca
 * mostra "zero falso" — ver CLAUDE.md deste projeto).
 *
 * Não lista mais um "Preço recomendado" separado (auditoria:
 * `calcularPrecoRecomendado`, src/lib/analiseResultado.ts — na maioria dos
 * estados esse valor só repetia `preco`; a única informação nova que
 * carregava, quando `preco < piso`, já é o próprio Piso, que este tooltip
 * já lista). Preço da estratégia + Piso (+ Teto, quando existe) bastam para
 * o usuário perceber "abaixo do piso" comparando os dois valores.
 */
export function montarItensDadosAno(resultado: ResultadoAno): ItemDadosAno[] {
  const itens: ItemDadosAno[] = [
    { rotulo: ROTULO_PRECO_SIMULACAO, valor: `R$ ${formatarReais(resultado.preco)}` },
    { rotulo: "Piso", valor: `R$ ${formatarReais(resultado.piso)}` },
  ];

  if (resultado.teto !== null) {
    itens.push({ rotulo: "Teto da praça", valor: `R$ ${formatarReais(resultado.teto)}` });
  }

  itens.push({ rotulo: "Margem resultante", valor: `${formatarPct(resultado.margemResultante)}%` });

  if (resultado.descontoMaximoPct !== null) {
    itens.push({ rotulo: "Limite seguro", valor: `${formatarPct(resultado.descontoMaximoPct)}%` });
  }

  return itens;
}

/**
 * Âncora horizontal do tooltip flutuante (0 = alinhado pela esquerda do
 * ponto, 0.5 = centralizado, 1 = alinhado pela direita), a partir de QUÃO
 * perto da borda o ponto está (`xPercent`, 0–100, a posição do ano no eixo
 * X em porcentagem da largura do gráfico) — evita o tooltip cortar na
 * borda (ver CLAUDE.md desta etapa, Parte 10) sem precisar medir a largura
 * real renderizada do tooltip (o componente só usa isso para escolher a
 * `transform` CSS certa).
 */
export function ancoragemHorizontalTooltip(xPercent: number): 0 | 0.5 | 1 {
  if (xPercent < 20) return 0;
  if (xPercent > 80) return 1;
  return 0.5;
}
