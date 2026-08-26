"use client";

import type { ResultadoAno } from "@/lib/motor";
import { formatarReais } from "@/lib/frases";

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
 * Escala automática pela faixa (piso/teto/preço), não a partir de zero —
 * a faixa costuma ser estreita (docs/02, seção 3, item 2) e uma escala
 * fixa a partir de zero a esconderia.
 */
export function FaixaViavelChart({ resultados, anoSelecionado, onSelecionarAno }: FaixaViavelChartProps) {
  const anos = resultados.map((r) => r.ano);
  const anoMin = Math.min(...anos);
  const anoMax = Math.max(...anos);

  const valoresY = resultados.flatMap((r) => [r.piso, r.preco, ...(r.teto !== null ? [r.teto] : [])]);
  const yMin = Math.min(...valoresY);
  const yMax = Math.max(...valoresY);
  const folga = (yMax - yMin) * 0.2 || yMax * 0.05 || 1;
  const yDomainMin = Math.max(0, yMin - folga);
  const yDomainMax = yMax + folga;

  const plotWidth = LARGURA - PAD_ESQUERDA - PAD_DIREITA;
  const plotHeight = ALTURA - PAD_TOPO - PAD_BAIXO;

  const x = (ano: number) =>
    PAD_ESQUERDA + ((ano - anoMin) / (anoMax - anoMin || 1)) * plotWidth;
  const y = (valor: number) =>
    PAD_TOPO + (1 - (valor - yDomainMin) / (yDomainMax - yDomainMin || 1)) * plotHeight;

  const temTeto = resultados.some((r) => r.teto !== null);
  const linhaAlvoSuperior = (r: ResultadoAno) => (r.teto !== null ? r.teto : r.preco);

  const pontosPiso = resultados.map((r) => `${x(r.ano)},${y(r.piso)}`).join(" ");
  const pontosTopo = resultados.map((r) => `${x(r.ano)},${y(linhaAlvoSuperior(r))}`).join(" ");
  const pontosPreco = resultados.map((r) => `${x(r.ano)},${y(r.preco)}`).join(" ");

  const areaFaixa = [
    ...resultados.map((r) => `${x(r.ano)},${y(linhaAlvoSuperior(r))}`),
    ...resultados.slice().reverse().map((r) => `${x(r.ano)},${y(r.piso)}`),
  ].join(" ");

  return (
    <svg
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      className="w-full h-auto"
      role="img"
      aria-label="Faixa viável de preço ano a ano"
    >
      <polygon points={areaFaixa} fill="rgb(16 185 129 / 0.12)" />

      <polyline points={pontosPiso} fill="none" stroke="#059669" strokeWidth={2} />
      {temTeto && (
        <polyline points={pontosTopo} fill="none" stroke="#b91c1c" strokeWidth={2} strokeDasharray="6 4" />
      )}
      <polyline
        points={pontosPreco}
        fill="none"
        strokeWidth={2.5}
        className="stroke-zinc-900 dark:stroke-zinc-50"
      />

      {resultados.map((r) => {
        const cx = x(r.ano);
        const cy = y(r.preco);
        const selecionado = r.ano === anoSelecionado;
        // Coluna de toque bem mais larga que o ponto visível — o ponto
        // (r=5/7) fica pequeno demais para toque em mobile depois da
        // escala do viewBox; a faixa inteira da coluna do ano é clicável.
        const larguraColuna = resultados.length > 1 ? plotWidth / resultados.length : plotWidth;

        return (
          <g
            key={r.ano}
            role="button"
            tabIndex={0}
            aria-pressed={selecionado}
            aria-label={`Selecionar ano ${r.ano}, preço R$ ${formatarReais(r.preco)}${
              r.alertaDisparado ? ", alerta ativo" : ""
            }`}
            className="cursor-pointer outline-none focus-visible:opacity-80"
            onClick={() => onSelecionarAno(r.ano)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelecionarAno(r.ano);
              }
            }}
          >
            <rect
              x={cx - larguraColuna / 2}
              y={PAD_TOPO}
              width={larguraColuna}
              height={ALTURA - PAD_TOPO - PAD_BAIXO}
              fill="transparent"
            />
            <line
              x1={cx}
              y1={PAD_TOPO}
              x2={cx}
              y2={ALTURA - PAD_BAIXO}
              className="stroke-zinc-200 dark:stroke-zinc-800"
              strokeWidth={1}
            />
            <circle
              cx={cx}
              cy={cy}
              r={selecionado ? 7 : 5}
              className={
                (r.alertaDisparado ? "fill-red-600" : "fill-zinc-900 dark:fill-zinc-50") +
                " stroke-white dark:stroke-zinc-950"
              }
              strokeWidth={selecionado ? 2 : 1}
            />
            <text
              x={cx}
              y={ALTURA - PAD_BAIXO + 20}
              textAnchor="middle"
              fontSize={15}
              fontWeight={selecionado ? 700 : 400}
              className={selecionado ? "fill-zinc-900 dark:fill-zinc-50" : "fill-zinc-500 dark:fill-zinc-400"}
            >
              {r.ano}
            </text>
          </g>
        );
      })}

      <text
        x={PAD_ESQUERDA - 8}
        y={y(yDomainMax) + 4}
        textAnchor="end"
        fontSize={13}
        className="fill-zinc-500 dark:fill-zinc-400"
      >
        {formatarReais(yDomainMax)}
      </text>
      <text
        x={PAD_ESQUERDA - 8}
        y={y(yDomainMin) + 4}
        textAnchor="end"
        fontSize={13}
        className="fill-zinc-500 dark:fill-zinc-400"
      >
        {formatarReais(yDomainMin)}
      </text>
    </svg>
  );
}
