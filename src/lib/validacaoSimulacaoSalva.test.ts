import { describe, expect, it } from "vitest";
import { validarEntradaSimulacaoSalva } from "./validacaoSimulacaoSalva";

function resultadoAnoValido(ano = 2026) {
  return {
    ano,
    preco: 155,
    margemResultante: 0.35,
    tributoTotalPct: 26.5,
    piso: 150,
    teto: 200,
    descontoMaximoPct: 0.05,
    alertaDisparado: false,
    mensagemRecomendacao: "Preço dentro da faixa viável.",
  };
}

function payloadValido() {
  return {
    ramoId: "ramo-1",
    ramoRotulo: "Eletrodomésticos e móveis",
    ramoAliquotaSugerida: 26.5,
    formulaTipo: "multiplicador",
    custoCompra: 100,
    despesaFixaPct: 20,
    markupPct: null,
    margemAlvoPct: 35,
    margemMinimaPct: 30,
    tetoPracaMin: null,
    tetoPracaMax: 200,
    prazoPagamentoFornecedorDias: 30,
    cenarios: {
      integral: [resultadoAnoValido()],
      gradual: [resultadoAnoValido()],
      absorcao: [resultadoAnoValido()],
    },
    impactoCaixa: null,
  };
}

describe("validarEntradaSimulacaoSalva", () => {
  it("aceita um payload válido completo", () => {
    const resultado = validarEntradaSimulacaoSalva(payloadValido());
    expect(resultado.ok).toBe(true);
  });

  it("aceita impactoCaixa preenchido, com mensagemRecomendacao obrigatória (não nula)", () => {
    const payload = payloadValido();
    payload.impactoCaixa = [
      { ano: 2026, valorProtegido: 10, valorEmRisco: 5, mensagemRecomendacao: "Metade protegida." },
    ] as never;
    const resultado = validarEntradaSimulacaoSalva(payload);
    expect(resultado.ok).toBe(true);
  });

  it("rejeita corpo que não é objeto", () => {
    expect(validarEntradaSimulacaoSalva(null).ok).toBe(false);
    expect(validarEntradaSimulacaoSalva("string").ok).toBe(false);
    expect(validarEntradaSimulacaoSalva(42).ok).toBe(false);
  });

  it("rejeita ramoId ausente ou vazio", () => {
    const payload = payloadValido();
    // @ts-expect-error -- teste de payload inválido
    delete payload.ramoId;
    expect(validarEntradaSimulacaoSalva(payload).ok).toBe(false);

    const payload2 = { ...payloadValido(), ramoId: "" };
    expect(validarEntradaSimulacaoSalva(payload2).ok).toBe(false);
  });

  it("rejeita formulaTipo fora do enum conhecido", () => {
    const payload = { ...payloadValido(), formulaTipo: "outra-coisa" };
    expect(validarEntradaSimulacaoSalva(payload).ok).toBe(false);
  });

  it("rejeita custoCompra zero ou negativo", () => {
    expect(validarEntradaSimulacaoSalva({ ...payloadValido(), custoCompra: 0 }).ok).toBe(false);
    expect(validarEntradaSimulacaoSalva({ ...payloadValido(), custoCompra: -10 }).ok).toBe(false);
  });

  it("rejeita margemMinimaPct/margemAlvoPct fora de 0-100", () => {
    expect(validarEntradaSimulacaoSalva({ ...payloadValido(), margemAlvoPct: 150 }).ok).toBe(false);
    expect(validarEntradaSimulacaoSalva({ ...payloadValido(), margemMinimaPct: -1 }).ok).toBe(false);
  });

  it("rejeita cenarios faltando uma das três chaves", () => {
    const payload = payloadValido();
    const cenarios = payload.cenarios as Record<string, unknown>;
    delete cenarios.absorcao;
    expect(validarEntradaSimulacaoSalva(payload).ok).toBe(false);
  });

  it("rejeita cenarios com array vazio", () => {
    const payload = payloadValido();
    payload.cenarios.integral = [];
    expect(validarEntradaSimulacaoSalva(payload).ok).toBe(false);
  });

  it("rejeita item de resultado com campo numérico inválido (NaN/Infinity)", () => {
    const payload = payloadValido();
    payload.cenarios.integral = [{ ...resultadoAnoValido(), preco: Number.NaN }];
    expect(validarEntradaSimulacaoSalva(payload).ok).toBe(false);

    const payload2 = payloadValido();
    payload2.cenarios.integral = [{ ...resultadoAnoValido(), piso: Number.POSITIVE_INFINITY }];
    expect(validarEntradaSimulacaoSalva(payload2).ok).toBe(false);
  });

  it("rejeita ano fora da faixa plausível", () => {
    const payload = payloadValido();
    payload.cenarios.integral = [{ ...resultadoAnoValido(), ano: 1500 }];
    expect(validarEntradaSimulacaoSalva(payload).ok).toBe(false);
  });

  it("rejeita alertaDisparado que não é booleano", () => {
    const payload = payloadValido();
    // @ts-expect-error -- teste de payload inválido
    payload.cenarios.integral = [{ ...resultadoAnoValido(), alertaDisparado: "sim" }];
    expect(validarEntradaSimulacaoSalva(payload).ok).toBe(false);
  });

  it("rejeita mensagemRecomendacao absurdamente grande (defesa contra payload gigante)", () => {
    const payload = payloadValido();
    payload.cenarios.integral = [
      { ...resultadoAnoValido(), mensagemRecomendacao: "x".repeat(3000) },
    ];
    expect(validarEntradaSimulacaoSalva(payload).ok).toBe(false);
  });

  it("rejeita teto/descontoMaximoPct que não são número nem null", () => {
    const payload = payloadValido();
    // @ts-expect-error -- teste de payload inválido
    payload.cenarios.integral = [{ ...resultadoAnoValido(), teto: "200" }];
    expect(validarEntradaSimulacaoSalva(payload).ok).toBe(false);
  });

  it("rejeita despesaFixaPct ausente quando formulaTipo é multiplicador", () => {
    const payload = { ...payloadValido(), despesaFixaPct: null };
    expect(validarEntradaSimulacaoSalva(payload).ok).toBe(false);
  });

  it("rejeita markupPct ausente quando formulaTipo é markup", () => {
    const payload = { ...payloadValido(), formulaTipo: "markup", markupPct: null };
    expect(validarEntradaSimulacaoSalva(payload).ok).toBe(false);
  });

  it("rejeita prazoPagamentoFornecedorDias negativo ou não-inteiro", () => {
    expect(
      validarEntradaSimulacaoSalva({ ...payloadValido(), prazoPagamentoFornecedorDias: -1 }).ok,
    ).toBe(false);
    expect(
      validarEntradaSimulacaoSalva({ ...payloadValido(), prazoPagamentoFornecedorDias: 2.5 }).ok,
    ).toBe(false);
  });

  it("aceita prazoPagamentoFornecedorDias null", () => {
    const resultado = validarEntradaSimulacaoSalva({
      ...payloadValido(),
      prazoPagamentoFornecedorDias: null,
    });
    expect(resultado.ok).toBe(true);
  });
});
