"use client";

import type { ImpactoCaixaAno } from "@/lib/motor";
import { formatarReais } from "@/lib/frases";

interface ImpactoCaixaChartProps {
  resultados: ImpactoCaixaAno[];
  anoSelecionado: number;
  onSelecionarAno: (ano: number) => void;
}

const LARGURA = 760;
const ALTURA = 260;
const PAD_ESQUERDA = 64;
const PAD_DIREITA = 24;
const PAD_TOPO = 24;
const PAD_BAIXO = 36;
const LARGURA_BARRA = 36;

/**
 * Barras empilhadas: R$ protegido pelo split payment (crédito ~imediato) em
 * baixo, R$ ainda em risco (regime antigo, prazo indeterminado) em cima —
 * ver CLAUDE.md, seção "Desenho do motor" (Fase 5), para o porquê de não
 * haver eixo em dias.
 */
export function ImpactoCaixaChart({ resultados, anoSelecionado, onSelecionarAno }: ImpactoCaixaChartProps) {
  const anos = resultados.map((r) => r.ano);
  const anoMin = Math.min(...anos);
  const anoMax = Math.max(...anos);

  const totais = resultados.map((r) => r.valorProtegido + r.valorEmRisco);
  const yMax = Math.max(...totais, 1) * 1.1;

  const plotWidth = LARGURA - PAD_ESQUERDA - PAD_DIREITA;
  const plotHeight = ALTURA - PAD_TOPO - PAD_BAIXO;

  const x = (ano: number) =>
    PAD_ESQUERDA + ((ano - anoMin) / (anoMax - anoMin || 1)) * plotWidth - LARGURA_BARRA / 2;
  const alturaFrac = (valor: number) => (valor / yMax) * plotHeight;

  return (
    <svg
      viewBox={`0 0 ${LARGURA} ${ALTURA}`}
      className="w-full h-auto"
      role="img"
      aria-label="Impacto no caixa: valor protegido pelo split payment vs. em risco, ano a ano"
    >
      {resultados.map((r) => {
        const alturaProtegido = alturaFrac(r.valorProtegido);
        const alturaRisco = alturaFrac(r.valorEmRisco);
        const baseY = ALTURA - PAD_BAIXO;
        const barX = x(r.ano);
        const selecionado = r.ano === anoSelecionado;

        return (
          <g key={r.ano} className="cursor-pointer" onClick={() => onSelecionarAno(r.ano)}>
            <rect
              x={barX}
              y={baseY - alturaProtegido}
              width={LARGURA_BARRA}
              height={alturaProtegido}
              fill="#059669"
              opacity={selecionado ? 1 : 0.65}
            />
            <rect
              x={barX}
              y={baseY - alturaProtegido - alturaRisco}
              width={LARGURA_BARRA}
              height={alturaRisco}
              fill="#d97706"
              opacity={selecionado ? 1 : 0.65}
            />
            {selecionado && (
              <rect
                x={barX - 2}
                y={baseY - alturaProtegido - alturaRisco - 2}
                width={LARGURA_BARRA + 4}
                height={alturaProtegido + alturaRisco + 4}
                fill="none"
                stroke="#18181b"
                strokeWidth={1.5}
              />
            )}
            <text
              x={barX + LARGURA_BARRA / 2}
              y={ALTURA - PAD_BAIXO + 20}
              textAnchor="middle"
              fontSize={12}
              fill={selecionado ? "#18181b" : "#71717a"}
              fontWeight={selecionado ? 700 : 400}
            >
              {r.ano}
            </text>
          </g>
        );
      })}

      <text x={PAD_ESQUERDA - 8} y={PAD_TOPO + 4} textAnchor="end" fontSize={11} fill="#71717a">
        {formatarReais(yMax)}
      </text>
      <text x={PAD_ESQUERDA - 8} y={ALTURA - PAD_BAIXO} textAnchor="end" fontSize={11} fill="#71717a">
        0
      </text>
    </svg>
  );
}
