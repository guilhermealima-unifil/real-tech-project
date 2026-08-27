import { describe, expect, it } from "vitest";
import type { ResultadoAno } from "./motor";
import { resumirCenario } from "./resumoCenario";

/** Constrói um `ResultadoAno` mínimo, só com os campos que `resumirCenario` lê. */
function ano(dados: {
  ano: number;
  preco: number;
  piso: number;
  teto?: number | null;
  margemResultante: number;
  descontoMaximoPct?: number | null;
}): ResultadoAno {
  return {
    ano: dados.ano,
    preco: dados.preco,
    piso: dados.piso,
    teto: dados.teto ?? null,
    margemResultante: dados.margemResultante,
    descontoMaximoPct: dados.descontoMaximoPct ?? null,
    tributoTotalPct: 0,
    alertaDisparado: false,
    mensagemRecomendacao: null,
  };
}

describe("resumirCenario", () => {
  it("cenário completamente saudável: sem anos críticos, agrega mínimos corretamente", () => {
    const resultados = [
      ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35, descontoMaximoPct: 0.032 }),
      ano({ ano: 2027, preco: 156, piso: 151, margemResultante: 0.35, descontoMaximoPct: 0.031 }),
      ano({ ano: 2028, preco: 157, piso: 152, margemResultante: 0.35, descontoMaximoPct: 0.03 }),
    ];

    const resumo = resumirCenario(resultados, 0.3);

    expect(resumo.menorMargemPct).toBe(0.35);
    expect(resumo.menorDescontoPct).toBe(0.03);
    expect(resumo.anosAbaixoMargemMinima).toBe(0);
    expect(resumo.anosAcimaTeto).toBe(0);
    expect(resumo.primeiroAnoCritico).toBeNull();
  });

  it("margem furada: conta o ano por comparação direta com margemMinimaFracao, não por alertaDisparado", () => {
    const resultados = [
      ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35 }),
      ano({ ano: 2029, preco: 155, piso: 158, margemResultante: 0.28 }),
      ano({ ano: 2033, preco: 155, piso: 157, margemResultante: 0.29 }),
    ];

    const resumo = resumirCenario(resultados, 0.3);

    expect(resumo.anosAbaixoMargemMinima).toBe(2);
    expect(resumo.menorMargemPct).toBe(0.28);
    expect(resumo.primeiroAnoCritico).toBe(2029);
  });

  it("preço acima do teto: conta em anosAcimaTeto e dispara primeiroAnoCritico", () => {
    const resultados = [
      ano({ ano: 2026, preco: 155, piso: 150, teto: 200, margemResultante: 0.35 }),
      ano({ ano: 2029, preco: 210, piso: 154, teto: 200, margemResultante: 0.35 }),
    ];

    const resumo = resumirCenario(resultados, 0.3);

    expect(resumo.anosAcimaTeto).toBe(1);
    expect(resumo.anosAbaixoMargemMinima).toBe(0);
    expect(resumo.primeiroAnoCritico).toBe(2029);
  });

  it("faixa inviável: é crítico, mas NÃO conta como acima_teto (classificarStatusPreco os diferencia)", () => {
    const resultados = [
      ano({ ano: 2026, preco: 155, piso: 150, teto: 200, margemResultante: 0.35 }),
      ano({ ano: 2033, preco: 205, piso: 210, teto: 200, margemResultante: 0.35 }),
    ];

    const resumo = resumirCenario(resultados, 0.3);

    expect(resumo.anosAcimaTeto).toBe(0);
    expect(resumo.primeiroAnoCritico).toBe(2033);
  });

  it("desconto ausente em todos os anos: menorDescontoPct fica null (fallback de apresentação decide o texto, não este helper)", () => {
    const resultados = [
      ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35, descontoMaximoPct: null }),
      ano({ ano: 2027, preco: 156, piso: 151, margemResultante: 0.35, descontoMaximoPct: null }),
    ];

    const resumo = resumirCenario(resultados, 0.3);

    expect(resumo.menorDescontoPct).toBeNull();
  });

  it("múltiplos anos críticos: primeiroAnoCritico é o primeiro em ordem crescente, mesmo com input fora de ordem", () => {
    const resultados = [
      ano({ ano: 2031, preco: 150, piso: 160, margemResultante: 0.2 }),
      ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35 }),
      ano({ ano: 2029, preco: 150, piso: 158, margemResultante: 0.25 }),
    ];

    const resumo = resumirCenario(resultados, 0.3);

    expect(resumo.primeiroAnoCritico).toBe(2029);
    expect(resumo.anosAbaixoMargemMinima).toBe(2);
  });

  it("cenário sem teto: nunca conta acima_teto/faixa_inviavel, só margem/abaixo_piso decidem o crítico", () => {
    const resultados = [
      ano({ ano: 2026, preco: 155, piso: 150, teto: null, margemResultante: 0.35 }),
      ano({ ano: 2029, preco: 150, piso: 158, teto: null, margemResultante: 0.25 }),
    ];

    const resumo = resumirCenario(resultados, 0.3);

    expect(resumo.anosAcimaTeto).toBe(0);
    expect(resumo.primeiroAnoCritico).toBe(2029);
  });

  it("integral/gradual/absorção com valores diferentes: agregações refletem cada trajetória", () => {
    const integral = [
      ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35, descontoMaximoPct: 0.032 }),
      ano({ ano: 2029, preco: 159.12, piso: 154.12, margemResultante: 0.35, descontoMaximoPct: 0.0314 }),
      ano({ ano: 2033, preco: 158.85, piso: 153.85, margemResultante: 0.35, descontoMaximoPct: 0.0315 }),
    ];
    const gradual = [
      ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35, descontoMaximoPct: 0.032 }),
      ano({ ano: 2029, preco: 156.77, piso: 154.12, margemResultante: 0.3265, descontoMaximoPct: 0.0169 }),
      ano({ ano: 2033, preco: 158.85, piso: 153.85, margemResultante: 0.35, descontoMaximoPct: 0.0315 }),
    ];
    const absorcao = [
      ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35, descontoMaximoPct: 0.032 }),
      ano({ ano: 2029, preco: 155, piso: 154.12, margemResultante: 0.3088, descontoMaximoPct: 0.0057 }),
      ano({ ano: 2033, preco: 155, piso: 153.85, margemResultante: 0.3115, descontoMaximoPct: 0.0074 }),
    ];

    const resumoIntegral = resumirCenario(integral, 0.3);
    const resumoGradual = resumirCenario(gradual, 0.3);
    const resumoAbsorcao = resumirCenario(absorcao, 0.3);

    expect(resumoIntegral.menorMargemPct).toBe(0.35);
    expect(resumoGradual.menorMargemPct).toBe(0.3265);
    expect(resumoAbsorcao.menorMargemPct).toBe(0.3088);

    expect(resumoIntegral.menorDescontoPct).toBeCloseTo(0.0314, 4);
    expect(resumoAbsorcao.menorDescontoPct).toBeCloseTo(0.0057, 4);

    expect(resumoIntegral.anosAbaixoMargemMinima).toBe(0);
    expect(resumoGradual.anosAbaixoMargemMinima).toBe(0);
    expect(resumoAbsorcao.anosAbaixoMargemMinima).toBe(0);
  });
});

describe("resumirCenario — trajetória e trade-off", () => {
  it("deriva preço inicial/final e variações mesmo com anos fora de ordem", () => {
    const resumo = resumirCenario(
      [
        ano({ ano: 2033, preco: 158.85, piso: 153.85, margemResultante: 0.35 }),
        ano({ ano: 2029, preco: 159.12, piso: 154.12, margemResultante: 0.35 }),
        ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35 }),
      ],
      0.3,
    );

    expect(resumo.precoInicial).toBe(155);
    expect(resumo.precoFinal).toBe(158.85);
    expect(resumo.variacaoPrecoAbsoluta).toBeCloseTo(3.85, 8);
    expect(resumo.variacaoPrecoPct).toBeCloseTo((3.85 / 155) * 100, 8);
  });

  it("protege defensivamente a variação percentual quando o preço inicial é zero", () => {
    const resumo = resumirCenario(
      [
        ano({ ano: 2026, preco: 0, piso: 0, margemResultante: 0.3 }),
        ano({ ano: 2027, preco: 10, piso: 0, margemResultante: 0.3 }),
      ],
      0.3,
    );

    expect(resumo.variacaoPrecoAbsoluta).toBe(10);
    expect(resumo.variacaoPrecoPct).toBeNull();
  });

  it("encontra somente o maior reajuste positivo e registra o ano de chegada", () => {
    const resumo = resumirCenario(
      [
        ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 159.25, piso: 154.25, margemResultante: 0.35 }),
        ano({ ano: 2028, preco: 158, piso: 153, margemResultante: 0.35 }),
        ano({ ano: 2029, preco: 160, piso: 155, margemResultante: 0.35 }),
      ],
      0.3,
    );

    expect(resumo.maiorReajusteAnual).toBeCloseTo(4.25, 8);
    expect(resumo.anoMaiorReajuste).toBe(2027);
  });

  it("retorna reajuste zero e ano nulo quando só há estabilidade ou queda", () => {
    const resumo = resumirCenario(
      [
        ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 155, piso: 150, margemResultante: 0.35 }),
        ano({ ano: 2028, preco: 154, piso: 150, margemResultante: 0.34 }),
      ],
      0.3,
    );

    expect(resumo.maiorReajusteAnual).toBe(0);
    expect(resumo.anoMaiorReajuste).toBeNull();
  });

  it("encontra menor margem e menor folga positiva com seu ano", () => {
    const resumo = resumirCenario(
      [
        ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 156, piso: 154, margemResultante: 0.3136 }),
        ano({ ano: 2028, preco: 157, piso: 154, margemResultante: 0.32 }),
      ],
      0.3,
    );

    expect(resumo.menorMargemPct).toBe(0.3136);
    expect(resumo.menorFolgaMargemPct).toBeCloseTo(0.0136, 8);
    expect(resumo.anoMenorFolgaMargem).toBe(2027);
  });

  it("preserva folga negativa e conta todos os anos abaixo da margem", () => {
    const resumo = resumirCenario(
      [
        ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 150, piso: 154, margemResultante: 0.26 }),
        ano({ ano: 2028, preco: 151, piso: 154, margemResultante: 0.28 }),
      ],
      0.3,
    );

    expect(resumo.menorFolgaMargemPct).toBeCloseTo(-0.04, 8);
    expect(resumo.anoMenorFolgaMargem).toBe(2027);
    expect(resumo.anosAbaixoMargemMinima).toBe(2);
  });

  it("encontra a menor distância para o teto, inclusive quando o preço o ultrapassa", () => {
    const resumo = resumirCenario(
      [
        ano({ ano: 2026, preco: 155, piso: 150, teto: 160, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 159.25, piso: 154.25, teto: 160, margemResultante: 0.35 }),
        ano({ ano: 2028, preco: 161, piso: 154.25, teto: 160, margemResultante: 0.35 }),
      ],
      0.3,
    );

    expect(resumo.menorDistanciaTeto).toBe(-1);
    expect(resumo.anoMenorDistanciaTeto).toBe(2028);
    expect(resumo.anosAcimaTeto).toBe(1);
    expect(resumo.primeiroAnoCritico).toBe(2028);
  });

  it("retorna distância e ano nulos quando o teto não foi informado", () => {
    const resumo = resumirCenario(
      [ano({ ano: 2026, preco: 155, piso: 150, teto: null, margemResultante: 0.35 })],
      0.3,
    );

    expect(resumo.menorDistanciaTeto).toBeNull();
    expect(resumo.anoMenorDistanciaTeto).toBeNull();
  });

  it("separa margem, preço acima do teto e faixa inviável e mantém o primeiro crítico", () => {
    const resumo = resumirCenario(
      [
        ano({ ano: 2030, preco: 180, piso: 170, teto: 160, margemResultante: 0.29 }),
        ano({ ano: 2028, preco: 161, piso: 155, teto: 160, margemResultante: 0.35 }),
        ano({ ano: 2026, preco: 155, piso: 150, teto: 160, margemResultante: 0.35 }),
        ano({ ano: 2029, preco: 159, piso: 165, teto: 160, margemResultante: 0.28 }),
      ],
      0.3,
    );

    expect(resumo.anosAbaixoMargemMinima).toBe(2);
    expect(resumo.anosAcimaTeto).toBe(1);
    expect(resumo.anosFaixaInviavel).toBe(2);
    expect(resumo.primeiroAnoCritico).toBe(2028);
  });

  it("mantém trajetórias distintas de Integral, Gradual e Absorção", () => {
    const integral = resumirCenario(
      [
        ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 159.25, piso: 154.25, margemResultante: 0.35 }),
        ano({ ano: 2033, preco: 158.85, piso: 153.85, margemResultante: 0.35 }),
      ],
      0.3,
    );
    const gradual = resumirCenario(
      [
        ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 155.61, piso: 154.25, margemResultante: 0.3136 }),
        ano({ ano: 2033, preco: 158.85, piso: 153.85, margemResultante: 0.35 }),
      ],
      0.3,
    );
    const absorcao = resumirCenario(
      [
        ano({ ano: 2026, preco: 155, piso: 150, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 155, piso: 154.25, margemResultante: 0.3075 }),
        ano({ ano: 2033, preco: 155, piso: 153.85, margemResultante: 0.3115 }),
      ],
      0.3,
    );

    expect(integral.maiorReajusteAnual).toBeCloseTo(4.25, 8);
    expect(gradual.maiorReajusteAnual).toBeLessThan(integral.maiorReajusteAnual);
    expect(absorcao.maiorReajusteAnual).toBe(0);
    expect(integral.menorMargemPct).toBeGreaterThan(gradual.menorMargemPct);
    expect(gradual.menorMargemPct).toBeGreaterThan(absorcao.menorMargemPct);
  });
});
