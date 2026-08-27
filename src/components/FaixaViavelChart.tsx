"use client";

import { Fragment, useState } from "react";
import type { ResultadoAno } from "@/lib/motor";
import { formatarReais } from "@/lib/frases";
import {
  ancoragemHorizontalTooltip,
  calcularDominioY,
  escalaLinear,
  gerarTicksY,
  montarItensDadosAno,
  ROTULO_PRECO_SIMULACAO,
  type ItemDadosAno,
} from "./faixaViavelChart.helpers";

interface FaixaViavelChartProps {
  resultados: ResultadoAno[];
  anoSelecionado: number;
  onSelecionarAno: (ano: number) => void;
}

const LARGURA = 760;
const ALTURA = 320;
const PAD_ESQUERDA = 64;
const PAD_DIREITA = 24;
const PAD_TOPO = 24;
const PAD_BAIXO = 36;

/**
 * "Painel de instrumento de precisão" (Real Tech Identity): cores vêm só
 * dos tokens (`fill-*`/`stroke-*` gerados por `@theme inline` a partir das
 * mesmas variáveis de `globals.css` — nenhuma paleta duplicada aqui, sem
 * hex fixo). Cada série é identificável por MAIS de um canal — traço
 * (sólido/tracejado), espessura, forma de marcador e cor — nunca só cor
 * (ver legenda abaixo e CLAUDE.md desta etapa, Parte 2):
 *
 * - Piso: linha sólida fina, `success` (borda de baixo da zona viável).
 * - Teto da praça: linha tracejada fina, `warning` (decisão comercial, não
 *   estrutural — mesma leitura do status "acima do teto" em
 *   ResumoResultado). Só existe quando `teto` não é `null` em NENHUM ano
 *   (é constante por simulação, ver src/lib/motor.ts) — sem teto, não há
 *   linha nem área de faixa, para não inventar um limite que não existe.
 * - Preço da estratégia (`ResultadoAno.preco` — o preço que a fórmula
 *   escolhida produz para o ano/cenário, não um preço de mercado
 *   observado; ver `ROTULO_PRECO_SIMULACAO` em faixaViavelChart.helpers.ts
 *   para a semântica completa): linha sólida grossa, `text-primary` (a
 *   tinta — o dado mais "presente" visualmente), com um círculo cheio por
 *   ano.
 * - Faixa viável: preenchimento entre piso e teto, `success/10`, discreto
 *   de propósito.
 *
 * Não existe mais uma série separada de "Preço recomendado" (auditoria:
 * `calcularPrecoRecomendado`, src/lib/analiseResultado.ts — na maioria dos
 * estados esse valor só repetia `preco`; quando divergia, era literalmente
 * o próprio Piso, já desenhado como linha própria). Quando o preço cai
 * abaixo do piso, isso já é visível comparando as duas linhas — círculo do
 * preço abaixo da linha de piso — sem precisar de um terceiro marcador.
 *
 * Escala automática pela amplitude dos dados plotados (piso/teto/preço),
 * não a partir de zero — a faixa costuma ser estreita e uma escala fixa a
 * partir de zero a esconderia (ver `calcularDominioY`). Ticks do eixo Y
 * são "redondos" (`gerarTicksY`), não os extremos exatos — comparar entre
 * anos importa mais do que o valor cru nas pontas; o valor exato de cada
 * série sempre está disponível no tooltip/resumo abaixo.
 */
export function FaixaViavelChart({ resultados, anoSelecionado, onSelecionarAno }: FaixaViavelChartProps) {
  const [anoInspecionado, setAnoInspecionado] = useState<number | null>(null);

  const anos = resultados.map((r) => r.ano);
  const anoMin = Math.min(...anos);
  const anoMax = Math.max(...anos);

  const dominioY = calcularDominioY(resultados);
  const plotWidth = LARGURA - PAD_ESQUERDA - PAD_DIREITA;
  const plotHeight = ALTURA - PAD_TOPO - PAD_BAIXO;

  const escalaX = escalaLinear({ min: anoMin, max: anoMax }, PAD_ESQUERDA, PAD_ESQUERDA + plotWidth);
  const escalaY = escalaLinear(dominioY, PAD_TOPO + plotHeight, PAD_TOPO);

  const larguraColuna = resultados.length > 1 ? plotWidth / resultados.length : plotWidth;
  const ticksY = gerarTicksY(dominioY, 4);

  // `teto` é constante por simulação (ver src/lib/motor.ts) — hoje é sempre
  // "todos os anos" ou "nenhum", nunca uma mistura. Filtrar por ano (em vez
  // de assumir isso com um cast) mantém o código correto mesmo se isso
  // deixar de ser verdade, e evita depender de `as number`.
  const resultadosComTeto = resultados.filter(
    (r): r is ResultadoAno & { teto: number } => r.teto !== null,
  );
  const temTeto = resultadosComTeto.length > 0;

  const pontosPiso = resultados.map((r) => `${escalaX(r.ano)},${escalaY(r.piso)}`).join(" ");
  const pontosPreco = resultados.map((r) => `${escalaX(r.ano)},${escalaY(r.preco)}`).join(" ");
  const pontosTeto = resultadosComTeto.map((r) => `${escalaX(r.ano)},${escalaY(r.teto)}`).join(" ");
  const areaFaixa = temTeto
    ? [
        ...resultadosComTeto.map((r) => `${escalaX(r.ano)},${escalaY(r.teto)}`),
        ...resultadosComTeto
          .slice()
          .reverse()
          .map((r) => `${escalaX(r.ano)},${escalaY(r.piso)}`),
      ].join(" ")
    : "";

  const resultadoInspecionado = resultados.find((r) => r.ano === anoInspecionado) ?? null;
  const resultadoSelecionado = resultados.find((r) => r.ano === anoSelecionado) ?? null;

  return (
    <div className="flex flex-col gap-3">
      <Legenda temTeto={temTeto} />

      <div className="relative">
        <svg
          viewBox={`0 0 ${LARGURA} ${ALTURA}`}
          className="h-auto w-full"
          role="img"
          aria-label="Faixa viável de preço, ano a ano"
          aria-describedby="faixa-viavel-desc"
        >
          {/*
            Sem <title> de propósito: um <title> como filho de <svg> faz o
            navegador desenhar um tooltip NATIVO (a mesma caixinha cinza do
            atributo HTML `title`) ao passar o mouse sobre o gráfico inteiro
            — a "caixa visual estranha" relatada nesta etapa. `aria-label`
            dá o nome acessível sem esse efeito colateral; `<desc>` (que
            navegadores NUNCA renderizam visualmente) continua cobrindo a
            descrição mais longa, referenciada por `aria-describedby`.
          */}
          <desc id="faixa-viavel-desc">
            Piso, {temTeto ? "teto da praça e " : ""}
            {ROTULO_PRECO_SIMULACAO.toLowerCase()}, de {anoMin} a {anoMax}.
            Selecione um ano para ver os valores exatos.
          </desc>

          {/* Coluna do ano selecionado — destaque de fundo, não só cor no marcador (Parte 6). */}
          {resultadoSelecionado && (
            <rect
              x={escalaX(anoSelecionado) - larguraColuna / 2}
              y={PAD_TOPO}
              width={larguraColuna}
              height={plotHeight}
              className="fill-primary/5"
            />
          )}

          {/* Grade horizontal + rótulos do eixo Y — poucos ticks redondos, não os extremos exatos (Parte 7). */}
          {ticksY.map((tick) => (
            <g key={tick}>
              <line
                x1={PAD_ESQUERDA}
                x2={LARGURA - PAD_DIREITA}
                y1={escalaY(tick)}
                y2={escalaY(tick)}
                className="stroke-border/40"
                strokeWidth={1}
              />
              <text
                x={PAD_ESQUERDA - 8}
                y={escalaY(tick) + 4}
                textAnchor="end"
                fontSize={12}
                className="font-figures fill-text-secondary"
              >
                {formatarReais(tick)}
              </text>
            </g>
          ))}

          {/* Faixa viável — "onde o preço pode viver", discreta de propósito. Só existe com teto conhecido. */}
          {temTeto && <polygon points={areaFaixa} className="fill-success/10" />}

          <polyline points={pontosPiso} fill="none" strokeWidth={1.5} className="stroke-success" />
          {temTeto && (
            <polyline
              points={pontosTeto}
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="6 4"
              className="stroke-warning"
            />
          )}
          <polyline points={pontosPreco} fill="none" strokeWidth={2.5} className="stroke-text-primary" />

          {resultados.map((r) => {
            const cx = escalaX(r.ano);
            const cyPreco = escalaY(r.preco);
            const selecionado = r.ano === anoSelecionado;
            const inspecionado = r.ano === anoInspecionado;
            const itensAria = montarItensDadosAno(r);
            const rotuloAria =
              `Ano ${r.ano}: ` +
              itensAria.map((i) => `${i.rotulo} ${i.valor}`).join(", ") +
              (r.alertaDisparado ? ", alerta ativo" : "") +
              (selecionado ? " (ano selecionado)" : "");

            return (
              <g
                key={r.ano}
                role="button"
                tabIndex={0}
                aria-pressed={selecionado}
                aria-label={rotuloAria}
                className="cursor-pointer outline-none focus-visible:opacity-80"
                onClick={() => onSelecionarAno(r.ano)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelecionarAno(r.ano);
                  }
                }}
                onMouseEnter={() => setAnoInspecionado(r.ano)}
                onMouseLeave={() => setAnoInspecionado((atual) => (atual === r.ano ? null : atual))}
                onFocus={() => setAnoInspecionado(r.ano)}
                onBlur={() => setAnoInspecionado((atual) => (atual === r.ano ? null : atual))}
              >
                {/* Coluna de toque bem mais larga que os marcadores visíveis — em mobile, o
                    marcador sozinho fica pequeno demais pra toque depois da escala do viewBox. */}
                <rect
                  x={cx - larguraColuna / 2}
                  y={PAD_TOPO}
                  width={larguraColuna}
                  height={plotHeight}
                  fill="transparent"
                />
                <line
                  x1={cx}
                  y1={PAD_TOPO}
                  x2={cx}
                  y2={ALTURA - PAD_BAIXO}
                  className={selecionado ? "stroke-primary/40" : "stroke-border/70"}
                  strokeWidth={selecionado ? 1.5 : 1}
                />

                <circle
                  cx={cx}
                  cy={cyPreco}
                  r={selecionado ? 7 : inspecionado ? 6 : 5}
                  className={(r.alertaDisparado ? "fill-danger" : "fill-text-primary") + " stroke-surface"}
                  strokeWidth={selecionado ? 2 : 1}
                />

                <text
                  x={cx}
                  y={ALTURA - PAD_BAIXO + 20}
                  textAnchor="middle"
                  fontSize={15}
                  fontWeight={selecionado ? 700 : 400}
                  className={"font-figures " + (selecionado ? "fill-text-primary" : "fill-text-secondary")}
                >
                  {r.ano}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip flutuante — só decorativo (aria-hidden): a mesma informação já está no
            aria-label de cada ponto e no resumo abaixo do gráfico (Parte 11 — tooltip nunca é a
            única forma de obter o dado). Posição horizontal em % da largura renderizada do SVG
            (a div "relative" tem exatamente o tamanho renderizado do svg, que é w-full/h-auto);
            `ancoragemHorizontalTooltip` evita cortar nas bordas sem precisar medir o tooltip. */}
        {resultadoInspecionado && (
          <TooltipAno
            resultado={resultadoInspecionado}
            xPercent={(escalaX(resultadoInspecionado.ano) / LARGURA) * 100}
          />
        )}
      </div>

      {resultadoSelecionado && <ResumoAnoSelecionado resultado={resultadoSelecionado} />}
    </div>
  );
}

interface LegendaProps {
  temTeto: boolean;
}

function Legenda({ temTeto }: LegendaProps) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-text-secondary">
      <li className="flex items-center gap-1.5">
        <span
          aria-hidden="true"
          className="inline-block h-0.5 w-4 shrink-0 rounded-full bg-text-primary"
        />
        {ROTULO_PRECO_SIMULACAO}
      </li>
      <li className="flex items-center gap-1.5">
        <span aria-hidden="true" className="inline-block h-0.5 w-4 shrink-0 rounded-full bg-success" />
        Piso
      </li>
      {temTeto && (
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block w-4 shrink-0 border-t-2 border-dashed border-warning" />
          Teto da praça
        </li>
      )}
      {temTeto && (
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm bg-success/20" />
          Faixa viável
        </li>
      )}
    </ul>
  );
}

interface TooltipAnoProps {
  resultado: ResultadoAno;
  xPercent: number;
}

function TooltipAno({ resultado, xPercent }: TooltipAnoProps) {
  const ancora = ancoragemHorizontalTooltip(xPercent);
  const transformX = ancora === 0 ? "0%" : ancora === 1 ? "-100%" : "-50%";

  return (
    <div
      aria-hidden="true"
      className="shadow-elevated pointer-events-none absolute top-1 z-10 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-surface-elevated px-3.5 py-3 text-xs"
      style={{ left: `${xPercent}%`, transform: `translateX(${transformX})` }}
    >
      <p className="font-figures text-sm font-semibold text-text-primary">{resultado.ano}</p>
      <ListaItensDados itens={montarItensDadosAno(resultado)} />
    </div>
  );
}

function ResumoAnoSelecionado({ resultado }: { resultado: ResultadoAno }) {
  return (
    <div className="rounded-lg bg-background p-3 text-xs">
      <p className="font-figures mb-1.5 font-semibold text-text-primary">
        Ano selecionado — {resultado.ano}
      </p>
      <ListaItensDados itens={montarItensDadosAno(resultado)} />
    </div>
  );
}

/**
 * Grid de 2 colunas (label / valor), não flex+justify-between: a coluna do
 * label (`auto`) tem a MESMA largura em toda a lista (a do rótulo mais
 * comprido, ex.: "Margem resultante"), então nenhuma linha quebra o label
 * em duas linhas mesmo em larguras estreitas — o `whitespace-nowrap`
 * garante isso; a coluna do valor (`1fr`) absorve o espaço restante e
 * alinha à direita. Compartilhada pelo tooltip flutuante e pelo resumo
 * persistente abaixo do gráfico — mesmo dado, mesmo layout.
 */
function ListaItensDados({ itens }: { itens: ItemDadosAno[] }) {
  return (
    <dl className="mt-1.5 grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1">
      {itens.map((item) => (
        <Fragment key={item.rotulo}>
          <dt className="whitespace-nowrap text-text-secondary">{item.rotulo}</dt>
          <dd className="font-figures text-right font-medium text-text-primary">{item.valor}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
