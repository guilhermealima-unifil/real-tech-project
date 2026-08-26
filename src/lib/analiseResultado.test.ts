import { describe, expect, it } from "vitest";
import { simular, type ParametroTributarioAno, type ResultadoAno } from "./motor";
import {
  analisarDesconto,
  calcularDiferencaPreco,
  calcularPrecoRecomendado,
  classificarStatusPreco,
} from "./analiseResultado";

/**
 * Mesmo fixture ilustrativo de motor.test.ts — não são valores reais da
 * transição (docs/00, seção 10). 2027 tem repasse parcial em "gradual",
 * usado para validar analisarDesconto fora do ano-base.
 */
const PARAMETROS_TESTE: ParametroTributarioAno[] = [
  { ano: 2026, cbsPct: 0.9, ibsPct: 0.1, pisCofinsPct: 3.65, icmsIssPct: 18 },
  { ano: 2027, cbsPct: 0.9, ibsPct: 0.1, pisCofinsPct: 3.65, icmsIssPct: 19 },
  { ano: 2028, cbsPct: 3, ibsPct: 3, pisCofinsPct: 2.5, icmsIssPct: 17 },
  { ano: 2029, cbsPct: 6, ibsPct: 6, pisCofinsPct: 1.5, icmsIssPct: 13 },
  { ano: 2030, cbsPct: 9, ibsPct: 9, pisCofinsPct: 1, icmsIssPct: 8 },
  { ano: 2031, cbsPct: 12, ibsPct: 12, pisCofinsPct: 0.5, icmsIssPct: 3 },
  { ano: 2032, cbsPct: 13, ibsPct: 13, pisCofinsPct: 0.25, icmsIssPct: 1.25 },
  { ano: 2033, cbsPct: 13.25, ibsPct: 13.25, pisCofinsPct: 0, icmsIssPct: 0 },
];

function resultadoDoAno(resultados: ResultadoAno[], ano: number): ResultadoAno {
  const r = resultados.find((x) => x.ano === ano);
  if (!r) throw new Error(`Ano ${ano} não encontrado.`);
  return r;
}

const BASE: Omit<ResultadoAno, "preco" | "piso" | "teto" | "descontoMaximoPct"> = {
  ano: 2026,
  margemResultante: 0.3,
  tributoTotalPct: 20,
  alertaDisparado: false,
  mensagemRecomendacao: null,
};

describe("classificarStatusPreco", () => {
  it("abaixo do piso", () => {
    expect(classificarStatusPreco(90, 100, 200)).toBe("abaixo_piso");
  });
  it("dentro da faixa", () => {
    expect(classificarStatusPreco(150, 100, 200)).toBe("dentro_da_faixa");
  });
  it("dentro da faixa quando não há teto informado", () => {
    expect(classificarStatusPreco(150, 100, null)).toBe("dentro_da_faixa");
  });
  it("acima do teto", () => {
    expect(classificarStatusPreco(250, 100, 200)).toBe("acima_teto");
  });
  it("preço igual ao piso conta como dentro da faixa, não abaixo", () => {
    expect(classificarStatusPreco(100, 100, 200)).toBe("dentro_da_faixa");
  });
});

describe("calcularPrecoRecomendado", () => {
  it("recomenda o piso quando o preço está abaixo dele", () => {
    const r: ResultadoAno = { ...BASE, preco: 90, piso: 100, teto: null, descontoMaximoPct: null };
    expect(calcularPrecoRecomendado(r)).toBe(100);
  });

  it("mantém o preço quando já está dentro da faixa", () => {
    const r: ResultadoAno = { ...BASE, preco: 150, piso: 100, teto: 200, descontoMaximoPct: 0.1 };
    expect(calcularPrecoRecomendado(r)).toBe(150);
  });

  it("mantém o preço quando está acima do teto — não faz cap automático (ver PENDÊNCIA)", () => {
    const r: ResultadoAno = { ...BASE, preco: 250, piso: 100, teto: 200, descontoMaximoPct: 0.1 };
    expect(calcularPrecoRecomendado(r)).toBe(250);
  });

  it("não recomenda preço quando a faixa é inviável (piso > teto)", () => {
    const r: ResultadoAno = { ...BASE, preco: 250, piso: 220, teto: 200, descontoMaximoPct: null };
    expect(calcularPrecoRecomendado(r)).toBeNull();
  });
});

describe("calcularDiferencaPreco", () => {
  it("calcula valor e percentual quando o recomendado é maior", () => {
    const d = calcularDiferencaPreco(110, 100);
    expect(d.valor).toBe(10);
    expect(d.percentual).toBeCloseTo(0.1);
  });

  it("percentual negativo quando o recomendado é menor", () => {
    const d = calcularDiferencaPreco(90, 100);
    expect(d.valor).toBe(-10);
    expect(d.percentual).toBeCloseTo(-0.1);
  });
});

describe("analisarDesconto — validado contra simular() real", () => {
  it("sem desconto pedido: preço final = preço, margem após desconto = margem atual", () => {
    const resultados = simular(
      {
        custoCompra: 100,
        formulaTipo: "multiplicador",
        despesaFixaPct: 0.2,
        margemAlvoPct: 0.35,
        margemMinimaPct: 0.3,
      },
      PARAMETROS_TESTE,
    );
    const r2026 = resultadoDoAno(resultados, 2026);
    const analise = analisarDesconto(r2026, 100, 0);

    expect(analise.precoFinal).toBe(r2026.preco);
    expect(analise.margemAposDesconto).toBeCloseTo(r2026.margemResultante, 6);
    expect(analise.dentroDoLimite).toBe(true);
  });

  it("desconto exatamente no limite máximo: preço final ≈ piso, margem após desconto ≈ margem mínima (0.30)", () => {
    const resultados = simular(
      {
        custoCompra: 100,
        formulaTipo: "multiplicador",
        despesaFixaPct: 0.2,
        margemAlvoPct: 0.35,
        margemMinimaPct: 0.3,
      },
      PARAMETROS_TESTE,
    );
    const r2026 = resultadoDoAno(resultados, 2026);
    const descontoMaximoPct = r2026.descontoMaximoPct as number;
    const analise = analisarDesconto(r2026, 100, descontoMaximoPct * 100);

    expect(analise.precoFinal).toBeCloseTo(r2026.piso, 1);
    expect(analise.margemAposDesconto).toBeCloseTo(0.3, 2);
    // No limite exato, `descontoMaximoPct` (arredondado a 4 casas pelo motor)
    // e `preco - piso` (dois valores arredondados a 2 casas cada) podem
    // divergir por uma fração de centavo — por isso a tolerância, em vez de
    // `dentroDoLimite` estrito, que é sensível a esse arredondamento na
    // fronteira exata.
    expect(Math.abs(analise.excedenteReais)).toBeLessThanOrEqual(0.01);
  });

  it("desconto acima do limite: excedenteReais positivo, fora do limite", () => {
    const resultados = simular(
      {
        custoCompra: 100,
        formulaTipo: "multiplicador",
        despesaFixaPct: 0.2,
        margemAlvoPct: 0.35,
        margemMinimaPct: 0.3,
      },
      PARAMETROS_TESTE,
    );
    const r2026 = resultadoDoAno(resultados, 2026);
    // desconto máximo real é ~3,2% — 10% estoura o limite de propósito.
    const analise = analisarDesconto(r2026, 100, 10);

    expect(analise.dentroDoLimite).toBe(false);
    expect(analise.excedenteReais).toBeGreaterThan(0);
  });

  it("a identidade margem-após-desconto vale no modelo markup também", () => {
    const resultados = simular(
      {
        custoCompra: 100,
        formulaTipo: "markup",
        markupPct: 0.3,
        margemAlvoPct: 0.3,
        margemMinimaPct: 0.25,
      },
      PARAMETROS_TESTE,
    );
    const r2026 = resultadoDoAno(resultados, 2026);
    const descontoMaximoPct = r2026.descontoMaximoPct as number;
    const analise = analisarDesconto(r2026, 100, descontoMaximoPct * 100);

    expect(analise.precoFinal).toBeCloseTo(r2026.piso, 1);
    expect(analise.margemAposDesconto).toBeCloseTo(0.25, 2);
  });

  it("a identidade margem-após-desconto vale com repasse parcial (gradual, ano não-base, markup)", () => {
    const resultados = simular(
      {
        custoCompra: 100,
        formulaTipo: "markup",
        markupPct: 0.3,
        margemAlvoPct: 0.3,
        margemMinimaPct: 0.25,
        cenarioRepasse: "gradual",
      },
      PARAMETROS_TESTE,
    );
    const r2027 = resultadoDoAno(resultados, 2027);
    const descontoMaximoPct = r2027.descontoMaximoPct as number;
    const analise = analisarDesconto(r2027, 100, descontoMaximoPct * 100);

    expect(analise.precoFinal).toBeCloseTo(r2027.piso, 1);
    expect(analise.margemAposDesconto).toBeCloseTo(0.25, 2);
  });

  it("a identidade margem-após-desconto vale com repasse parcial (gradual, ano não-base, multiplicador)", () => {
    const resultados = simular(
      {
        custoCompra: 100,
        formulaTipo: "multiplicador",
        despesaFixaPct: 0.2,
        margemAlvoPct: 0.35,
        margemMinimaPct: 0.3,
        cenarioRepasse: "gradual",
      },
      PARAMETROS_TESTE,
    );
    const r2027 = resultadoDoAno(resultados, 2027);
    const descontoMaximoPct = r2027.descontoMaximoPct as number;
    const analise = analisarDesconto(r2027, 100, descontoMaximoPct * 100);

    expect(analise.precoFinal).toBeCloseTo(r2027.piso, 1);
    expect(analise.margemAposDesconto).toBeCloseTo(0.3, 2);
  });
});
