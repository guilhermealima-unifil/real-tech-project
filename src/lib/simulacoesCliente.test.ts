import { describe, expect, it } from "vitest";
import {
  montarPayloadSimulacaoSalva,
  validarNomeProdutoSimulacao,
  NOME_PRODUTO_MAX_CARACTERES,
} from "./simulacoesCliente";
import type { SimulationResult } from "@/state/simulacaoReducer";

function baseResultado(overrides: Partial<SimulationResult> = {}): SimulationResult {
  return {
    cenarios: { integral: [], gradual: [], absorcao: [] },
    impactoCaixa: null,
    ramo: { id: "ramo-1", rotulo: "Eletrodomésticos e móveis", aliquotaSugerida: 18 },
    formulaTipo: "multiplicador",
    custoCompra: 100,
    entradaSnapshot: {
      despesaFixaPct: 20,
      markupPct: null,
      margemAlvoPct: 35,
      margemMinimaPct: 30,
      tetoPracaMin: null,
      tetoPracaMax: 200,
      prazoPagamentoFornecedorDias: 30,
    },
    ...overrides,
  };
}

describe("montarPayloadSimulacaoSalva", () => {
  it("inclui nomeProduto no payload, já aparado (trim)", () => {
    const payload = montarPayloadSimulacaoSalva(baseResultado(), "  Geladeira Electrolux 480L  ");
    expect(payload?.nomeProduto).toBe("Geladeira Electrolux 480L");
  });

  it("continua devolvendo null quando a simulação não tem ramo associado", () => {
    const payload = montarPayloadSimulacaoSalva(baseResultado({ ramo: null }), "Qualquer nome");
    expect(payload).toBeNull();
  });

  it("não toca em nenhum campo do snapshot além de nomeProduto", () => {
    const resultado = baseResultado();
    const payload = montarPayloadSimulacaoSalva(resultado, "Consultoria contábil mensal");
    expect(payload?.custoCompra).toBe(resultado.custoCompra);
    expect(payload?.despesaFixaPct).toBe(resultado.entradaSnapshot.despesaFixaPct);
    expect(payload?.margemAlvoPct).toBe(resultado.entradaSnapshot.margemAlvoPct);
  });
});

describe("validarNomeProdutoSimulacao", () => {
  it("aceita um nome válido", () => {
    expect(validarNomeProdutoSimulacao("Geladeira Electrolux 480L")).toBeNull();
  });

  it("rejeita nome vazio ou só espaços", () => {
    expect(validarNomeProdutoSimulacao("")).not.toBeNull();
    expect(validarNomeProdutoSimulacao("   ")).not.toBeNull();
  });

  it("rejeita nome acima do limite de caracteres", () => {
    const erro = validarNomeProdutoSimulacao("x".repeat(NOME_PRODUTO_MAX_CARACTERES + 1));
    expect(erro).not.toBeNull();
  });

  it("aceita nome exatamente no limite de caracteres", () => {
    expect(validarNomeProdutoSimulacao("x".repeat(NOME_PRODUTO_MAX_CARACTERES))).toBeNull();
  });
});
