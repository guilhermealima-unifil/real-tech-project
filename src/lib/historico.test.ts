import { describe, expect, it } from "vitest";
import { derivarAlertasSimulacao, nomeExibicaoSimulacao, type SimulacaoResumo } from "./historico";

describe("nomeExibicaoSimulacao", () => {
  it("usa o nome do produto quando presente", () => {
    expect(nomeExibicaoSimulacao("Geladeira Electrolux 480L", "Eletrodomésticos e móveis")).toBe(
      "Geladeira Electrolux 480L",
    );
  });

  it("cai para um fallback derivado do ramo quando nomeProduto é null", () => {
    expect(nomeExibicaoSimulacao(null, "Eletrodomésticos e móveis")).toBe(
      "Simulação de Eletrodomésticos e móveis",
    );
  });

  it("cai para um fallback derivado do ramo quando nomeProduto é string vazia ou só espaços", () => {
    expect(nomeExibicaoSimulacao("", "Material elétrico e construção")).toBe(
      "Simulação de Material elétrico e construção",
    );
    expect(nomeExibicaoSimulacao("   ", "Material elétrico e construção")).toBe(
      "Simulação de Material elétrico e construção",
    );
  });

  it("cai para um texto genérico quando nem nomeProduto nem ramoRotulo existem", () => {
    expect(nomeExibicaoSimulacao(null, null)).toBe("Simulação salva");
  });

  it("nunca devolve string vazia ou 'null' como texto", () => {
    const resultado = nomeExibicaoSimulacao(null, null);
    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado).not.toContain("null");
  });
});

function itemResumo(overrides: Partial<SimulacaoResumo> = {}): SimulacaoResumo {
  return {
    id: "sim-1",
    createdAt: "2026-08-27T00:00:00.000Z",
    nomeProduto: "Geladeira Electrolux 480L",
    ramoRotulo: "Eletrodomésticos e móveis",
    formulaTipo: "multiplicador",
    custoCompra: 100,
    cenarioPrincipal: "integral",
    anoPrincipal: 2026,
    precoAnalisado: 155,
    precoRecomendado: 155,
    status: "dentro_da_faixa",
    alertaDisparado: false,
    ...overrides,
  };
}

describe("derivarAlertasSimulacao", () => {
  it("não gera alerta quando o preço está dentro da faixa e alertaDisparado é false", () => {
    expect(derivarAlertasSimulacao(itemResumo())).toEqual([]);
  });

  it("gera alerta de faixa inviável quando status é 'faixa_inviavel'", () => {
    const alertas = derivarAlertasSimulacao(
      itemResumo({ status: "faixa_inviavel", alertaDisparado: true }),
    );
    expect(alertas).toHaveLength(1);
    expect(alertas[0].tipo).toBe("faixa_inviavel");
    expect(alertas[0].simulacaoId).toBe("sim-1");
    expect(alertas[0].nomeExibicao).toBe("Geladeira Electrolux 480L");
    expect(alertas[0].mensagem).toContain("2026");
  });

  it("gera alerta de preço abaixo do piso quando status é 'abaixo_piso'", () => {
    const alertas = derivarAlertasSimulacao(
      itemResumo({ status: "abaixo_piso", alertaDisparado: true, anoPrincipal: 2029 }),
    );
    expect(alertas).toHaveLength(1);
    expect(alertas[0].tipo).toBe("abaixo_piso");
    expect(alertas[0].mensagem).toBe("Preço abaixo do piso em 2029.");
  });

  it("gera alerta de margem abaixo do mínimo quando alertaDisparado é true mas o preço está dentro da faixa (caso markup)", () => {
    const alertas = derivarAlertasSimulacao(
      itemResumo({ status: "dentro_da_faixa", alertaDisparado: true }),
    );
    expect(alertas).toHaveLength(1);
    expect(alertas[0].tipo).toBe("margem_abaixo_minima");
  });

  it("faixa_inviavel tem prioridade sobre alertaDisparado — só 1 alerta por simulação", () => {
    const alertas = derivarAlertasSimulacao(
      itemResumo({ status: "faixa_inviavel", alertaDisparado: true }),
    );
    expect(alertas).toHaveLength(1);
    expect(alertas[0].tipo).toBe("faixa_inviavel");
  });

  it("não gera alerta quando não há ano-base salvo (anoPrincipal null)", () => {
    expect(
      derivarAlertasSimulacao(itemResumo({ anoPrincipal: null, status: null, alertaDisparado: true })),
    ).toEqual([]);
  });

  it("usa o fallback derivado do ramo quando a simulação não tem nomeProduto", () => {
    const alertas = derivarAlertasSimulacao(
      itemResumo({ nomeProduto: null, status: "abaixo_piso" }),
    );
    expect(alertas[0].nomeExibicao).toBe("Simulação de Eletrodomésticos e móveis");
  });
});
