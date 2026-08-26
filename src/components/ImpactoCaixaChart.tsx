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
 * Barras empilhadas via tokens semânticos — `success` (protegido pelo
 * split payment) e `warning` (ainda depende do fornecedor recolher).
 * Verde/âmbar aqui têm significado de negócio real (não é "onde está o
 * foco", como o `primary` da marca) — por isso continuam `success`/
 * `warning`, nunca `primary`, mesmo migrando para tokens.
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
      className="h-auto w-full"
      role="img"
      aria-label="Impacto no caixa: valor protegido pelo split payment vs. em risco, ano a ano"
    >
      {resultados.map((r) => {
        const alturaProtegido = alturaFrac(r.valorProtegido);
        const alturaRisco = alturaFrac(r.valorEmRisco);
        const baseY = ALTURA - PAD_BAIXO;
        const barX = x(r.ano);
        const selecionado = r.ano === anoSelecionado;
        // Coluna de toque bem mais larga que a barra visível (LARGURA_BARRA
        // fica pequena demais em mobile depois da escala do viewBox).
        const larguraColuna = resultados.length > 1 ? plotWidth / resultados.length : plotWidth;
        const centroBarra = barX + LARGURA_BARRA / 2;

        return (
          <g
            key={r.ano}
            role="button"
            tabIndex={0}
            aria-pressed={selecionado}
            aria-label={`Selecionar ano ${r.ano}: R$ ${formatarReais(r.valorProtegido)} protegido, R$ ${formatarReais(
              r.valorEmRisco,
            )} em risco`}
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
              x={centroBarra - larguraColuna / 2}
              y={PAD_TOPO}
              width={larguraColuna}
              height={plotHeight}
              fill="transparent"
            />
            <rect
              x={barX}
              y={baseY - alturaProtegido}
              width={LARGURA_BARRA}
              height={alturaProtegido}
              className="fill-success"
              opacity={selecionado ? 1 : 0.65}
            />
            <rect
              x={barX}
              y={baseY - alturaProtegido - alturaRisco}
              width={LARGURA_BARRA}
              height={alturaRisco}
              className="fill-warning"
              opacity={selecionado ? 1 : 0.65}
            />
            {selecionado && (
              <rect
                x={barX - 2}
                y={baseY - alturaProtegido - alturaRisco - 2}
                width={LARGURA_BARRA + 4}
                height={alturaProtegido + alturaRisco + 4}
                fill="none"
                className="stroke-text-primary"
                strokeWidth={1.5}
              />
            )}
            <text
              x={centroBarra}
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

      <text
        x={PAD_ESQUERDA - 8}
        y={PAD_TOPO + 4}
        textAnchor="end"
        fontSize={13}
        className="font-figures fill-text-secondary"
      >
        {formatarReais(yMax)}
      </text>
      <text
        x={PAD_ESQUERDA - 8}
        y={ALTURA - PAD_BAIXO}
        textAnchor="end"
        fontSize={13}
        className="font-figures fill-text-secondary"
      >
        0
      </text>
    </svg>
  );
}
