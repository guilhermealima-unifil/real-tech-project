import { describe, expect, it } from "vitest";
import { formStateAPartirDoHistorico } from "./novaAPartirDoHistorico";
import type { SimulacaoDetalhe } from "@/lib/historico";

function baseSimulacao(overrides: Partial<SimulacaoDetalhe> = {}): SimulacaoDetalhe {
  return {
    id: "sim-antiga-1",
    createdAt: "2026-01-10T12:00:00.000Z",
    nomeProduto: "Geladeira Electrolux 480L",
    ramoId: "ramo-eletro",
    ramoRotulo: "Eletrodomésticos e móveis",
    ramoAliquotaSugerida: 18,
    formulaTipo: "multiplicador",
    custoCompra: 100,
    despesaFixaPct: 20,
    markupPct: null,
    margemAlvoPct: 35,
    margemMinimaPct: 30,
    tetoPracaMin: 140,
    tetoPracaMax: 160,
    prazoPagamentoFornecedorDias: 30,
    cenarios: { integral: [], gradual: [], absorcao: [] },
    impactoCaixa: null,
    ...overrides,
  };
}

describe("formStateAPartirDoHistorico", () => {
  it("reconstrói o form do modelo multiplicador com todos os inputs preenchidos", () => {
    const form = formStateAPartirDoHistorico(baseSimulacao());

    expect(form).toEqual({
      ramoId: "ramo-eletro",
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

  it("reconstrói o form do modelo markup, preservando quais inputs opcionais ficam vazios", () => {
    const form = formStateAPartirDoHistorico(
      baseSimulacao({
        formulaTipo: "markup",
        despesaFixaPct: null,
        markupPct: 30,
        margemAlvoPct: 30,
        tetoPracaMin: null,
        tetoPracaMax: null,
        prazoPagamentoFornecedorDias: null,
      }),
    );

    expect(form.formulaTipo).toBe("markup");
    expect(form.markupPct).toBe("30");
    expect(form.despesaFixaPct).toBe("");
    expect(form.tetoPracaMin).toBe("");
    expect(form.tetoPracaMax).toBe("");
    expect(form.prazoPagamentoFornecedorDias).toBe("");
  });

  it("reutiliza o ramoId real da simulação salva, não só o rótulo de exibição", () => {
    const form = formStateAPartirDoHistorico(baseSimulacao({ ramoId: "ramo-vestuario" }));
    expect(form.ramoId).toBe("ramo-vestuario");
  });

  it("nunca inclui identidade da simulação antiga (id/createdAt) nem outputs derivados (cenarios/impactoCaixa) no form reconstruído", () => {
    const form = formStateAPartirDoHistorico(baseSimulacao());
    const chaves = Object.keys(form);

    expect(chaves).not.toContain("id");
    expect(chaves).not.toContain("createdAt");
    expect(chaves).not.toContain("cenarios");
    expect(chaves).not.toContain("impactoCaixa");
    expect(chaves.sort()).toEqual(
      [
        "ramoId",
        "custoCompra",
        "formulaTipo",
        "despesaFixaPct",
        "markupPct",
        "margemAlvoPct",
        "margemMinimaPct",
        "tetoPracaMin",
        "tetoPracaMax",
        "prazoPagamentoFornecedorDias",
      ].sort(),
    );
  });
});
