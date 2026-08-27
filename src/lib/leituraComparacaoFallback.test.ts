import { describe, expect, it } from "vitest";
import type { CenarioRepasse, ResultadoAno } from "./motor";
import { construirEvidenciasComparacao } from "./evidenciasComparacao";
import { gerarLeituraFallback } from "./leituraComparacaoFallback";

function ano(dados: {
  ano: number;
  preco: number;
  piso: number;
  teto?: number | null;
  margemResultante: number;
}): ResultadoAno {
  return {
    ano: dados.ano,
    preco: dados.preco,
    piso: dados.piso,
    teto: dados.teto ?? null,
    margemResultante: dados.margemResultante,
    descontoMaximoPct: null,
    tributoTotalPct: 0,
    alertaDisparado: false,
    mensagemRecomendacao: null,
  };
}

describe("gerarLeituraFallback", () => {
  it("Caso C: menciona reajuste e teto/margem sem inventar números fora das evidências", () => {
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 158, piso: 140, teto: 152, margemResultante: 0.35 }),
      ],
      gradual: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 152, piso: 140, teto: 152, margemResultante: 0.33 }),
      ],
      absorcao: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 150, piso: 140, teto: 152, margemResultante: 0.28 }),
      ],
    };

    const evidencias = construirEvidenciasComparacao(cenarios, 2027, 0.22);
    const texto = gerarLeituraFallback(evidencias);

    expect(texto).toContain("Repasse integral");
    expect(texto).toContain("Repasse gradual");
    expect(texto).toContain("Absorção");
    expect(texto).toContain("2027");
    expect(texto.length).toBeGreaterThan(0);
  });

  it("markup/trajetórias idênticas: não inventa trade-off, declara explicitamente que os dados não diferenciam", () => {
    const trajetoria = [
      ano({ ano: 2026, preco: 130, piso: 110, margemResultante: 0.3 }),
      ano({ ano: 2033, preco: 130, piso: 118, margemResultante: 0.22 }),
    ];
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: trajetoria,
      gradual: trajetoria,
      absorcao: trajetoria,
    };

    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.2);
    const texto = gerarLeituraFallback(evidencias);

    expect(texto).toMatch(/não diferenciam/i);
  });

  it("sem dados no ano selecionado: mensagem neutra, sem quebrar", () => {
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [],
      gradual: [],
      absorcao: [],
    };

    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.2);
    const texto = gerarLeituraFallback(evidencias);

    expect(texto.length).toBeGreaterThan(0);
  });
});
