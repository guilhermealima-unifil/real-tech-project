import { describe, expect, it } from "vitest";
import { montarDraftDeResultado, validarDraftEdicaoRapida } from "./edicaoRapida";
import type { SimulationResult } from "./simulacaoReducer";

function baseResultado(overrides: Partial<SimulationResult> = {}): SimulationResult {
  return {
    cenarios: { integral: [], gradual: [], absorcao: [] },
    impactoCaixa: null,
    ramo: { id: "ramo-1", rotulo: "Eletro", aliquotaSugerida: 18 },
    formulaTipo: "multiplicador",
    custoCompra: 100,
    entradaSnapshot: {
      despesaFixaPct: 20,
      markupPct: null,
      margemAlvoPct: 35,
      margemMinimaPct: 30,
      tetoPracaMin: 140,
      tetoPracaMax: 160,
      prazoPagamentoFornecedorDias: 30,
    },
    ...overrides,
  };
}

describe("montarDraftDeResultado", () => {
  it("reconstrói o draft do modelo multiplicador com todos os campos preenchidos", () => {
    const draft = montarDraftDeResultado(baseResultado());

    expect(draft).toEqual({
      ramoId: "ramo-1",
      custoCompra: "100",
      formulaTipo: "multiplicador",
      despesaFixaPct: "20",
      markupPct: "",
      margemAlvoPct: "35",
      margemMinimaPct: "30",
      tetoPracaMin: "140",
      tetoPracaMax: "160",
      prazoPagamentoFornecedorDias: "30",
    });
  });

  it("reconstrói o draft do modelo markup, preservando quais campos opcionais ficam vazios", () => {
    const draft = montarDraftDeResultado(
      baseResultado({
        formulaTipo: "markup",
        entradaSnapshot: {
          despesaFixaPct: null,
          markupPct: 30,
          margemAlvoPct: 30,
          margemMinimaPct: 30,
          tetoPracaMin: null,
          tetoPracaMax: null,
          prazoPagamentoFornecedorDias: null,
        },
      }),
    );

    expect(draft.formulaTipo).toBe("markup");
    expect(draft.markupPct).toBe("30");
    expect(draft.despesaFixaPct).toBe("");
    expect(draft.tetoPracaMin).toBe("");
    expect(draft.tetoPracaMax).toBe("");
    expect(draft.prazoPagamentoFornecedorDias).toBe("");
  });

  it("usa ramoId vazio quando o snapshot não tem ramo associado", () => {
    const draft = montarDraftDeResultado(baseResultado({ ramo: null }));
    expect(draft.ramoId).toBe("");
  });
});

describe("validarDraftEdicaoRapida", () => {
  const draftValido = montarDraftDeResultado(baseResultado());

  it("não reporta erro para um draft completo e consistente", () => {
    expect(validarDraftEdicaoRapida(draftValido)).toEqual([]);
  });

  it("reporta erro quando o custo de compra está vazio", () => {
    const erros = validarDraftEdicaoRapida({ ...draftValido, custoCompra: "" });
    expect(erros.some((e) => e.startsWith("custoCompra"))).toBe(true);
  });

  it("reporta erro quando a margem mínima é maior que a margem-alvo", () => {
    const erros = validarDraftEdicaoRapida({
      ...draftValido,
      margemAlvoPct: "20",
      margemMinimaPct: "30",
    });
    expect(erros.some((e) => e.includes("margemMinimaPct"))).toBe(true);
  });

  it("reporta erro quando o prazo de pagamento ao fornecedor está vazio", () => {
    const erros = validarDraftEdicaoRapida({ ...draftValido, prazoPagamentoFornecedorDias: "" });
    expect(erros).toContain("Informe o prazo de pagamento ao fornecedor, em dias.");
  });
});
