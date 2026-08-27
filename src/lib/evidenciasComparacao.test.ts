import { describe, expect, it } from "vitest";
import type { CenarioRepasse, ResultadoAno } from "./motor";
import { construirEvidenciasComparacao } from "./evidenciasComparacao";

/** Constrói um `ResultadoAno` mínimo, mesma convenção de resumoCenario.test.ts. */
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

/** Caso C do prompt desta etapa: custo R$100, multiplicador, despesa fixa 15%, margem alvo 35%, margem mínima 22%, teto R$152. */
function construirCasoC(): Record<CenarioRepasse, ResultadoAno[]> {
  return {
    integral: [
      ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 }),
      ano({ ano: 2027, preco: 158, piso: 140, teto: 152, margemResultante: 0.35 }),
      ano({ ano: 2033, preco: 172, piso: 150, teto: 152, margemResultante: 0.35 }),
    ],
    gradual: [
      ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 }),
      ano({ ano: 2027, preco: 152, piso: 140, teto: 152, margemResultante: 0.33 }),
      ano({ ano: 2033, preco: 152, piso: 150, teto: 152, margemResultante: 0.3 }),
    ],
    absorcao: [
      ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 }),
      ano({ ano: 2027, preco: 150, piso: 140, teto: 152, margemResultante: 0.28 }),
      ano({ ano: 2033, preco: 150, piso: 150, teto: 152, margemResultante: 0.22 }),
    ],
  };
}

describe("construirEvidenciasComparacao", () => {
  it("Caso C: Integral ultrapassa o teto primeiro, Absorção mantém preço estável com menor folga", () => {
    const evidencias = construirEvidenciasComparacao(construirCasoC(), 2027, 0.22);

    const integral = evidencias.cenarios.find((c) => c.cenario === "integral")!;
    const gradual = evidencias.cenarios.find((c) => c.cenario === "gradual")!;
    const absorcao = evidencias.cenarios.find((c) => c.cenario === "absorcao")!;

    expect(integral.primeiroAnoAcimaTeto).toBe(2027);
    expect(gradual.primeiroAnoAcimaTeto).toBeNull();
    expect(absorcao.primeiroAnoAcimaTeto).toBeNull();

    expect(integral.resumo.menorMargemPct).toBe(0.35);
    expect(absorcao.resumo.menorMargemPct).toBeLessThan(integral.resumo.menorMargemPct);

    // Absorção tem a menor folga de margem entre os três (0.0 — margem chega exatamente ao mínimo).
    expect(absorcao.resumo.menorFolgaMargemPct).toBeLessThan(gradual.resumo.menorFolgaMargemPct);
    expect(gradual.resumo.menorFolgaMargemPct).toBeLessThan(integral.resumo.menorFolgaMargemPct);

    // O alerta de teto (crítico) tem prioridade sobre o comparativo de folga
    // quando os 3 alertas de maior prioridade já preenchem o limite (Parte I: no máximo 3).
    expect(evidencias.alertas.length).toBeLessThanOrEqual(3);
    expect(evidencias.alertas.some((a) => a.tipo === "acima_teto" && a.cenario === "integral")).toBe(
      true,
    );
  });

  it("quando há vaga sob o limite de 3 alertas, o comparativo de menor folga de margem aparece", () => {
    // Teto bem acima do preço em todos os cenários (evita
    // "sem_teto_informado"), reajuste real em todos (evita "sem_reajuste") e
    // só um cenário (absorção) furando a margem mínima (1 alerta de
    // prioridade alta) — sobra vaga no top 3 para o comparativo de folga.
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 300, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 155, piso: 140, teto: 300, margemResultante: 0.35 }),
      ],
      gradual: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 300, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 153, piso: 140, teto: 300, margemResultante: 0.3 }),
      ],
      absorcao: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 300, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 151, piso: 145, teto: 300, margemResultante: 0.15 }),
      ],
    };

    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.22);
    const alertaFolga = evidencias.alertas.find((a) => a.tipo === "menor_folga_margem");

    expect(alertaFolga?.cenario).toBe("absorcao");
  });

  it("faixa inviável: piso > teto gera alerta faixa_inviavel e não gera alerta acima_teto duplicado", () => {
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [ano({ ano: 2026, preco: 100, piso: 160, teto: 150, margemResultante: 0.35 })],
      gradual: [ano({ ano: 2026, preco: 100, piso: 120, teto: 150, margemResultante: 0.3 })],
      absorcao: [ano({ ano: 2026, preco: 100, piso: 120, teto: 150, margemResultante: 0.3 })],
    };

    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.3);
    const alertasIntegral = evidencias.alertas.filter((a) => a.cenario === "integral");

    expect(alertasIntegral.some((a) => a.tipo === "faixa_inviavel")).toBe(true);
    expect(alertasIntegral.some((a) => a.tipo === "acima_teto")).toBe(false);
  });

  it("teto ausente em todos os cenários: gera alerta sem_teto_informado", () => {
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [ano({ ano: 2026, preco: 100, piso: 90, teto: null, margemResultante: 0.3 })],
      gradual: [ano({ ano: 2026, preco: 100, piso: 90, teto: null, margemResultante: 0.3 })],
      absorcao: [ano({ ano: 2026, preco: 100, piso: 90, teto: null, margemResultante: 0.3 })],
    };

    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.25);

    expect(evidencias.alertas.some((a) => a.tipo === "sem_teto_informado")).toBe(true);
  });

  it("margem abaixo da mínima: primeiroAnoMargemAbaixoMinima aponta o primeiro ano cronológico furado", () => {
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [
        ano({ ano: 2026, preco: 150, piso: 130, margemResultante: 0.35 }),
        ano({ ano: 2029, preco: 150, piso: 155, margemResultante: 0.2 }),
        ano({ ano: 2033, preco: 150, piso: 152, margemResultante: 0.22 }),
      ],
      gradual: [ano({ ano: 2026, preco: 150, piso: 130, margemResultante: 0.35 })],
      absorcao: [ano({ ano: 2026, preco: 150, piso: 130, margemResultante: 0.35 })],
    };

    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.3);
    const integral = evidencias.cenarios.find((c) => c.cenario === "integral")!;

    expect(integral.primeiroAnoMargemAbaixoMinima).toBe(2029);
  });

  it("markup/estratégias iguais: nenhum alerta comparativo (maior_reajuste/menor_folga_margem) é gerado quando há empate", () => {
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

    expect(evidencias.alertas.some((a) => a.tipo === "maior_reajuste")).toBe(false);
    expect(evidencias.alertas.some((a) => a.tipo === "menor_folga_margem")).toBe(false);
  });

  it("sem reajuste: cenário com preço constante no período gera alerta sem_reajuste", () => {
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [
        ano({ ano: 2026, preco: 130, piso: 110, margemResultante: 0.3 }),
        ano({ ano: 2033, preco: 130, piso: 110, margemResultante: 0.3 }),
      ],
      gradual: [
        ano({ ano: 2026, preco: 130, piso: 110, margemResultante: 0.3 }),
        ano({ ano: 2033, preco: 140, piso: 115, margemResultante: 0.3 }),
      ],
      absorcao: [
        ano({ ano: 2026, preco: 130, piso: 110, margemResultante: 0.3 }),
        ano({ ano: 2033, preco: 135, piso: 112, margemResultante: 0.3 }),
      ],
    };

    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.2);

    expect(
      evidencias.alertas.some((a) => a.tipo === "sem_reajuste" && a.cenario === "integral"),
    ).toBe(true);
  });

  it("limita a no máximo 3 alertas mesmo quando vários critérios disparam", () => {
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 140, margemResultante: 0.1 }),
        ano({ ano: 2033, preco: 200, piso: 190, teto: 140, margemResultante: 0.05 }),
      ],
      gradual: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 140, margemResultante: 0.15 }),
        ano({ ano: 2033, preco: 155, piso: 145, teto: 140, margemResultante: 0.1 }),
      ],
      absorcao: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 140, margemResultante: 0.2 }),
        ano({ ano: 2033, preco: 150, piso: 147, teto: 140, margemResultante: 0.05 }),
      ],
    };

    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.22);

    expect(evidencias.alertas.length).toBeLessThanOrEqual(3);
  });
});

/** Mesma fixture de leituraComparacaoPrompt.test.ts: período completo 2026–2033, Integral cruza o teto primeiro e preserva mais margem, Absorção nunca cruza e é mais estável, Gradual fica no meio nos dois eixos. */
function construirCasoCPeriodoCompleto(): Record<CenarioRepasse, ResultadoAno[]> {
  const anosIntegral = [
    { ano: 2026, preco: 150, margemResultante: 0.35 },
    { ano: 2027, preco: 154.25, margemResultante: 0.35 },
    { ano: 2028, preco: 158, margemResultante: 0.35 },
    { ano: 2029, preco: 162, margemResultante: 0.35 },
    { ano: 2030, preco: 165, margemResultante: 0.35 },
    { ano: 2031, preco: 167, margemResultante: 0.35 },
    { ano: 2032, preco: 169, margemResultante: 0.35 },
    { ano: 2033, preco: 172, margemResultante: 0.35 },
  ];
  const anosGradual = [
    { ano: 2026, preco: 150, margemResultante: 0.35 },
    { ano: 2027, preco: 150.61, margemResultante: 0.3136 },
    { ano: 2028, preco: 151, margemResultante: 0.33 },
    { ano: 2029, preco: 152, margemResultante: 0.325 },
    { ano: 2030, preco: 153, margemResultante: 0.32 },
    { ano: 2031, preco: 155, margemResultante: 0.318 },
    { ano: 2032, preco: 158, margemResultante: 0.315 },
    { ano: 2033, preco: 161, margemResultante: 0.31 },
  ];
  const anosAbsorcao = [
    { ano: 2026, preco: 150, margemResultante: 0.35 },
    { ano: 2027, preco: 150, margemResultante: 0.3075 },
    { ano: 2028, preco: 150, margemResultante: 0.305 },
    { ano: 2029, preco: 150, margemResultante: 0.303 },
    { ano: 2030, preco: 150, margemResultante: 0.302 },
    { ano: 2031, preco: 150, margemResultante: 0.301 },
    { ano: 2032, preco: 150, margemResultante: 0.3005 },
    { ano: 2033, preco: 150, margemResultante: 0.3 },
  ];
  const piso = (a: { ano: number }) => 130 + (a.ano - 2026) * 2;
  return {
    integral: anosIntegral.map((a) => ano({ ...a, piso: piso(a), teto: 152 })),
    gradual: anosGradual.map((a) => ano({ ...a, piso: piso(a), teto: 152 })),
    absorcao: anosAbsorcao.map((a) => ano({ ...a, piso: piso(a), teto: 152 })),
  };
}

describe("relacoes — RelacoesComparacao (payload sem números para a IA)", () => {
  it("Caso C: maisPreservaMargem=integral, precoMaisEstavel=absorcao, ultrapassaTetoMaisCedo=integral, intermediaria=gradual", () => {
    const evidencias = construirEvidenciasComparacao(construirCasoCPeriodoCompleto(), 2027, 0.22);
    const { relacoes } = evidencias;

    expect(relacoes.maisPreservaMargem).toBe("integral");
    expect(relacoes.menosPreservaMargem).toBe("absorcao");
    expect(relacoes.precoMaisEstavel).toBe("absorcao");
    expect(relacoes.maiorReajuste).toBe("integral");
    expect(relacoes.ultrapassaTetoMaisCedo).toBe("integral");
    expect(relacoes.nuncaUltrapassaTeto).toEqual(["absorcao"]);
    // Gradual fica estritamente entre Integral e Absorção tanto em margem
    // quanto em estabilidade de preço — a regra da Parte 2 é satisfeita.
    expect(relacoes.intermediaria).toBe("gradual");
  });

  it("sem teto informado em nenhum cenário: nenhuma relação de teto é inventada", () => {
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [ano({ ano: 2026, preco: 150, piso: 137, teto: null, margemResultante: 0.35 })],
      gradual: [ano({ ano: 2026, preco: 150, piso: 140, teto: null, margemResultante: 0.3 })],
      absorcao: [ano({ ano: 2026, preco: 150, piso: 145, teto: null, margemResultante: 0.22 })],
    };
    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.2);
    const { relacoes } = evidencias;

    expect(relacoes.ultrapassaTetoMaisCedo).toBeNull();
    expect(relacoes.ultrapassaTetoMaisTarde).toBeNull();
    expect(relacoes.nuncaUltrapassaTeto).toEqual([]);
  });

  it("markup/estratégias equivalentes: estrategiasEquivalentes=true e nenhum vencedor relacional artificial", () => {
    const trajetoria = [
      ano({ ano: 2026, preco: 130, piso: 110, teto: 152, margemResultante: 0.2575 }),
      ano({ ano: 2033, preco: 130, piso: 118, teto: 152, margemResultante: 0.2575 }),
    ];
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: trajetoria,
      gradual: trajetoria,
      absorcao: trajetoria,
    };
    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.22);
    const { relacoes } = evidencias;

    expect(relacoes.estrategiasEquivalentes).toBe(true);
    expect(relacoes.maisPreservaMargem).toBeNull();
    expect(relacoes.menosPreservaMargem).toBeNull();
    expect(relacoes.precoMaisEstavel).toBeNull();
    expect(relacoes.maiorReajuste).toBeNull();
    expect(relacoes.ultrapassaTetoMaisCedo).toBeNull();
    expect(relacoes.ultrapassaTetoMaisTarde).toBeNull();
    expect(relacoes.nuncaUltrapassaTeto).toEqual([]);
    expect(relacoes.intermediaria).toBeNull();
  });

  it("empate na menor margem entre dois cenários: maisPreservaMargem fica null, não escolhe um vencedor arbitrário", () => {
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 })],
      gradual: [ano({ ano: 2026, preco: 151, piso: 137, teto: 152, margemResultante: 0.35 })],
      absorcao: [ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.3 })],
    };
    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.22);

    expect(evidencias.relacoes.maisPreservaMargem).toBeNull();
  });

  it("empate na estabilidade de preço entre dois cenários: precoMaisEstavel fica null", () => {
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 150, piso: 140, teto: 152, margemResultante: 0.35 }),
      ],
      gradual: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 150, piso: 140, teto: 152, margemResultante: 0.3 }),
      ],
      absorcao: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 155, piso: 140, teto: 152, margemResultante: 0.28 }),
      ],
    };
    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.22);

    // Integral e Gradual têm variação de preço 0 (empate) — Absorção é a
    // única com variação real, mas o empate no mínimo ainda impede um
    // vencedor único.
    expect(evidencias.relacoes.precoMaisEstavel).toBeNull();
  });

  it("intermediaria: quando o cenário do meio em margem não é o mesmo do meio em estabilidade, fica null (não escolhe um dos dois eixos arbitrariamente)", () => {
    // Margem (menorMargemPct, maior é melhor): Gradual(0.32) > Integral(0.30) > Absorção(0.25) — meio é Integral.
    // Estabilidade (|variação de preço|, menor é mais estável): Gradual(0) < Absorção(5) < Integral(10) — meio é Absorção.
    // Os dois eixos discordam sobre quem é o "meio" — não há posição intermediária demonstrável.
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 160, piso: 140, teto: 152, margemResultante: 0.3 }),
      ],
      gradual: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 150, piso: 140, teto: 152, margemResultante: 0.32 }),
      ],
      absorcao: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 }),
        ano({ ano: 2027, preco: 155, piso: 140, teto: 152, margemResultante: 0.25 }),
      ],
    };
    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.22);

    expect(evidencias.relacoes.intermediaria).toBeNull();
  });

  it("margem furada: cenários com anosAbaixoMargemMinima > 0 aparecem em relacoes.margemAbaixoMinima", () => {
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [
        ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 }),
        ano({ ano: 2029, preco: 150, piso: 155, teto: 152, margemResultante: 0.2 }),
      ],
      gradual: [ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 })],
      absorcao: [ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 })],
    };
    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.3);

    expect(evidencias.relacoes.margemAbaixoMinima).toEqual(["integral"]);
  });

  it("faixa inviável: cenário com piso > teto aparece em relacoes.faixaInviavel e não recebe orientação positiva de teto", () => {
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [ano({ ano: 2026, preco: 100, piso: 160, teto: 150, margemResultante: 0.35 })],
      gradual: [ano({ ano: 2026, preco: 100, piso: 120, teto: 150, margemResultante: 0.3 })],
      absorcao: [ano({ ano: 2026, preco: 100, piso: 120, teto: 150, margemResultante: 0.3 })],
    };
    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.3);
    const { relacoes } = evidencias;

    expect(relacoes.faixaInviavel).toEqual(["integral"]);
    // Faixa inviável não é "acima do teto" no sentido de ultrapassagem
    // normal — classificarStatusPreco separa os dois; a estratégia inviável
    // não deve aparecer em nuncaUltrapassaTeto (não tem status saudável).
    expect(relacoes.nuncaUltrapassaTeto).not.toContain("integral");
  });
});
