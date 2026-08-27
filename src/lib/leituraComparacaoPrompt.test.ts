import { describe, expect, it } from "vitest";
import type { CenarioRepasse, ResultadoAno } from "./motor";
import { construirEvidenciasComparacao } from "./evidenciasComparacao";
import {
  construirMensagemUsuario,
  construirPayloadIA,
  INSTRUCAO_SISTEMA_LEITURA_COMPARACAO,
} from "./leituraComparacaoPrompt";

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

function cenariosDeExemplo(): Record<CenarioRepasse, ResultadoAno[]> {
  return {
    integral: [ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 })],
    gradual: [ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 })],
    absorcao: [ano({ ano: 2026, preco: 150, piso: 137, teto: 152, margemResultante: 0.35 })],
  };
}

/** Fixture com todo o período 2026–2033, mesma usada na validação desta etapa: Integral cruza o teto em 2027 e tem a maior margem/reajuste, Gradual fica no meio, Absorção nunca cruza o teto e é a mais estável em preço. */
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

describe("construirPayloadIA — sem números de negócio", () => {
  it("contém somente haTetoInformado e relacoes — nenhum outro campo", () => {
    const evidencias = construirEvidenciasComparacao(cenariosDeExemplo(), 2026, 0.22);
    const payload = construirPayloadIA(evidencias);

    expect(Object.keys(payload).sort()).toEqual(["haTetoInformado", "relacoes"]);
  });

  it("Caso C (período completo): relações batem com o esperado — Integral preserva mais margem, Absorção é mais estável e nunca ultrapassa o teto", () => {
    const evidencias = construirEvidenciasComparacao(construirCasoCPeriodoCompleto(), 2027, 0.22);
    const payload = construirPayloadIA(evidencias);

    expect(payload.haTetoInformado).toBe(true);
    expect(payload.relacoes.maisPreservaMargem).toBe("integral");
    expect(payload.relacoes.precoMaisEstavel).toBe("absorcao");
    expect(payload.relacoes.ultrapassaTetoMaisCedo).toBe("integral");
    expect(payload.relacoes.nuncaUltrapassaTeto).toEqual(["absorcao"]);
  });

  it("payload serializado não contém nenhum número de negócio (%, R$, ou fração decimal de margem/preço)", () => {
    const evidencias = construirEvidenciasComparacao(construirCasoCPeriodoCompleto(), 2027, 0.22);
    const payload = construirPayloadIA(evidencias);
    const json = JSON.stringify(payload);

    expect(json).not.toContain("%");
    expect(json).not.toContain("R$");
    // IDs de estratégia contêm dígitos? não — mas garante que nenhum valor
    // numérico (preço, margem, reajuste) sobrevive no JSON.
    expect(json).not.toMatch(/\d/);
  });

  it("payload contém somente relações qualitativas permitidas (união de chaves de RelacoesComparacao)", () => {
    const evidencias = construirEvidenciasComparacao(construirCasoCPeriodoCompleto(), 2027, 0.22);
    const payload = construirPayloadIA(evidencias);

    expect(Object.keys(payload.relacoes).sort()).toEqual(
      [
        "estrategiasEquivalentes",
        "faixaInviavel",
        "intermediaria",
        "maiorReajuste",
        "maisPreservaMargem",
        "margemAbaixoMinima",
        "menosPreservaMargem",
        "nuncaUltrapassaTeto",
        "precoMaisEstavel",
        "ultrapassaTetoMaisCedo",
        "ultrapassaTetoMaisTarde",
      ].sort(),
    );
  });

  it("sem teto informado em nenhum cenário: haTetoInformado é false", () => {
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {
      integral: [ano({ ano: 2026, preco: 150, piso: 137, teto: null, margemResultante: 0.35 })],
      gradual: [ano({ ano: 2026, preco: 150, piso: 140, teto: null, margemResultante: 0.3 })],
      absorcao: [ano({ ano: 2026, preco: 150, piso: 145, teto: null, margemResultante: 0.22 })],
    };
    const evidencias = construirEvidenciasComparacao(cenarios, 2026, 0.2);
    const payload = construirPayloadIA(evidencias);

    expect(payload.haTetoInformado).toBe(false);
  });

  it("markup/estratégias equivalentes: relacoes.estrategiasEquivalentes é true e nenhuma outra relação aponta vencedor", () => {
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
    const payload = construirPayloadIA(evidencias);

    expect(payload.relacoes.estrategiasEquivalentes).toBe(true);
    expect(payload.relacoes.maisPreservaMargem).toBeNull();
    expect(payload.relacoes.precoMaisEstavel).toBeNull();
    expect(payload.relacoes.ultrapassaTetoMaisCedo).toBeNull();
    expect(payload.relacoes.intermediaria).toBeNull();
  });
});

describe("construirMensagemUsuario", () => {
  it("serializa o payload como JSON, sem prosa fora do JSON", () => {
    const evidencias = construirEvidenciasComparacao(cenariosDeExemplo(), 2026, 0.22);
    const payload = construirPayloadIA(evidencias);
    const mensagem = construirMensagemUsuario(payload);

    const jsonBruto = mensagem.slice(mensagem.indexOf("{"));
    expect(() => JSON.parse(jsonBruto)).not.toThrow();
  });
});

describe("INSTRUCAO_SISTEMA_LEITURA_COMPARACAO", () => {
  it("proíbe explicitamente declarar estratégia vencedora e inventar números", () => {
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/melhor/i);
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/nunca invente, estime ou mencione um número/i);
  });

  it("exige condicionalidade — formulação 'se sua prioridade é X'", () => {
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/se sua prioridade é/i);
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/condicional/i);
  });

  it('usa o vocabulário "teto da praça", nunca "teto competitivo" ou termos de mercado/demanda', () => {
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/teto da praça/i);
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).not.toMatch(/teto competitivo/i);
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/pressão competitiva/i);
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/perda de clientes/i);
  });

  it("permite indicar estratégia que mais atende uma prioridade, mas nunca uma vencedora absoluta", () => {
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/mais atende/i);
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/"vencedora"/i);
  });

  it("exige citar a limitação/contrapartida junto de qualquer orientação positiva", () => {
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/limitação qualitativa/i);
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(
      /nunca apresente uma estratégia como atendendo a uma prioridade sem essa contrapartida/i,
    );
  });

  it("restringe 'meio-termo' à relação intermediaria — nunca por suposição", () => {
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/meio-termo/i);
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/relacoes\.intermediaria/);
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/nunca por suposição/i);
  });

  it("dá precedência à faixa inviável sobre qualquer orientação positiva", () => {
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(
      /faixaInviavel[\s\S]*precedência|precedência[\s\S]*faixaInviavel/i,
    );
  });

  it("não conhece variáveis de demanda/mercado que justificariam decisão absoluta", () => {
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/elasticidade, concorrência, giro de estoque ou mix/i);
  });

  it("proíbe null/vazio ser tratado como vencedor arbitrário", () => {
    expect(INSTRUCAO_SISTEMA_LEITURA_COMPARACAO).toMatch(/nunca escolha uma estratégia por conta própria/i);
  });
});
