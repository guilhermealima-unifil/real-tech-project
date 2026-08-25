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
      <polyline points={pontosPreco} fill="none" stroke="#18181b" strokeWidth={2.5} />

      {resultados.map((r) => {
        const cx = x(r.ano);
        const cy = y(r.preco);
        const selecionado = r.ano === anoSelecionado;
        return (
          <g key={r.ano}>
            <line x1={cx} y1={PAD_TOPO} x2={cx} y2={ALTURA - PAD_BAIXO} stroke="#e4e4e7" strokeWidth={1} />
            <circle
              cx={cx}
              cy={cy}
              r={selecionado ? 7 : 5}
              fill={r.alertaDisparado ? "#dc2626" : "#18181b"}
              stroke="#fff"
              strokeWidth={selecionado ? 2 : 1}
              className="cursor-pointer"
              onClick={() => onSelecionarAno(r.ano)}
            />
            <text
              x={cx}
              y={ALTURA - PAD_BAIXO + 20}
              textAnchor="middle"
              fontSize={12}
              fill={selecionado ? "#18181b" : "#71717a"}
              fontWeight={selecionado ? 700 : 400}
              className="cursor-pointer"
              onClick={() => onSelecionarAno(r.ano)}
            >
              {r.ano}
            </text>
          </g>
        );
      })}

      <text x={PAD_ESQUERDA - 8} y={y(yDomainMax) + 4} textAnchor="end" fontSize={11} fill="#71717a">
        {formatarReais(yDomainMax)}
      </text>
      <text x={PAD_ESQUERDA - 8} y={y(yDomainMin) + 4} textAnchor="end" fontSize={11} fill="#71717a">
        {formatarReais(yDomainMin)}
      </text>
    </svg>
  );
}
