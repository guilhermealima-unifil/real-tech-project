import { describe, expect, it } from "vitest";
import type { ResultadoAno } from "@/lib/motor";
import {
  ancoragemHorizontalTooltip,
  calcularDominioY,
  escalaLinear,
  gerarTicksY,
  montarItensDadosAno,
} from "./faixaViavelChart.helpers";

const BASE: Omit<ResultadoAno, "preco" | "piso" | "teto" | "descontoMaximoPct"> = {
  ano: 2026,
  margemResultante: 0.3,
  tributoTotalPct: 20,
  alertaDisparado: false,
  mensagemRecomendacao: null,
};

function resultado(overrides: Partial<ResultadoAno>): ResultadoAno {
  return { ...BASE, preco: 150, piso: 140, teto: 200, descontoMaximoPct: 0.06, ...overrides };
}

describe("calcularDominioY", () => {
  it("cobre piso, preço e teto, com folga de 20% acima/abaixo", () => {
    const r = resultado({ preco: 150, piso: 140, teto: 200 });
    const dominio = calcularDominioY([r]);
    // amplitude bruta (140 a 200) = 60; folga = 60*0.2 = 12
    expect(dominio.min).toBeCloseTo(140 - 12, 5);
    expect(dominio.max).toBeCloseTo(200 + 12, 5);
  });

  it("nunca desce abaixo de zero mesmo com folga grande", () => {
    const r = resultado({ preco: 5, piso: 4, teto: null, descontoMaximoPct: null });
    const dominio = calcularDominioY([r]);
    expect(dominio.min).toBeGreaterThanOrEqual(0);
  });

  it("sem teto informado, domínio considera só piso/preço", () => {
    const r = resultado({ preco: 150, piso: 140, teto: null, descontoMaximoPct: 0.06 });
    const dominio = calcularDominioY([r]);
    expect(dominio.max).toBeLessThan(200); // não "vaza" um teto que não existe
  });

  it("domínio quase plano (todos os valores iguais) não colapsa a escala", () => {
    const r = resultado({ preco: 150, piso: 150, teto: 150, descontoMaximoPct: 0 });
    const dominio = calcularDominioY([r]);
    expect(dominio.max).toBeGreaterThan(dominio.min);
  });

  it("faixa inviável (piso > teto) não quebra o domínio", () => {
    const r = resultado({ preco: 150, piso: 220, teto: 200, descontoMaximoPct: 0 });
    const dominio = calcularDominioY([r]);
    expect(Number.isFinite(dominio.min)).toBe(true);
    expect(Number.isFinite(dominio.max)).toBe(true);
  });
});

describe("escalaLinear", () => {
  it("mapeia o domínio para o alcance de pixels, extremos inclusive", () => {
    const escala = escalaLinear({ min: 100, max: 200 }, 0, 500);
    expect(escala(100)).toBeCloseTo(0, 5);
    expect(escala(200)).toBeCloseTo(500, 5);
    expect(escala(150)).toBeCloseTo(250, 5);
  });

  it("inverte corretamente quando alcanceMin > alcanceMax (eixo Y, origem no topo)", () => {
    const escala = escalaLinear({ min: 100, max: 200 }, 300, 0);
    expect(escala(100)).toBeCloseTo(300, 5);
    expect(escala(200)).toBeCloseTo(0, 5);
  });

  it("domínio degenerado (min === max) não gera NaN/Infinity", () => {
    const escala = escalaLinear({ min: 150, max: 150 }, 0, 500);
    expect(Number.isFinite(escala(150))).toBe(true);
  });
});

describe("gerarTicksY", () => {
  it("gera ticks redondos dentro do domínio, em ordem crescente", () => {
    const ticks = gerarTicksY({ min: 140, max: 200 }, 4);
    expect(ticks.length).toBeGreaterThan(1);
    for (const t of ticks) {
      expect(t).toBeGreaterThanOrEqual(140);
      expect(t).toBeLessThanOrEqual(200);
    }
    expect([...ticks].sort((a, b) => a - b)).toEqual(ticks);
  });

  it("domínio degenerado (min === max) devolve um único tick, sem loop infinito", () => {
    expect(gerarTicksY({ min: 150, max: 150 })).toEqual([150]);
  });

  it("domínio muito pequeno ainda produz um passo positivo (sem travar)", () => {
    const ticks = gerarTicksY({ min: 149.9, max: 150.1 }, 4);
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks.length).toBeLessThan(50);
  });
});

describe("montarItensDadosAno", () => {
  it("mostra preço da estratégia, piso, teto, margem e desconto quando todos existem — sem 'Preço recomendado' separado", () => {
    const itens = montarItensDadosAno(
      resultado({ preco: 150, piso: 140, teto: 200, margemResultante: 0.312, descontoMaximoPct: 0.06 }),
    );
    const rotulos = itens.map((i) => i.rotulo);
    expect(rotulos).toEqual(["Preço da estratégia", "Piso", "Teto da praça", "Margem resultante", "Limite seguro"]);
    expect(itens.find((i) => i.rotulo === "Margem resultante")?.valor).toBe("31,2%");
  });

  it("omite teto quando ausente — nunca mostra um teto que não existe", () => {
    const itens = montarItensDadosAno(resultado({ teto: null }));
    expect(itens.some((i) => i.rotulo === "Teto da praça")).toBe(false);
  });

  it("omite limite seguro quando null", () => {
    const itens = montarItensDadosAno(resultado({ descontoMaximoPct: null }));
    expect(itens.some((i) => i.rotulo === "Limite seguro")).toBe(false);
  });

  it("faixa inviável (piso > teto): não inventa um preço comercial — mostra só preço/piso/teto reais", () => {
    const itens = montarItensDadosAno(resultado({ preco: 150, piso: 220, teto: 200 }));
    expect(itens.some((i) => i.rotulo === "Preço recomendado")).toBe(false);
    expect(itens.find((i) => i.rotulo === "Preço da estratégia")?.valor).toBe("R$ 150,00");
    expect(itens.find((i) => i.rotulo === "Piso")?.valor).toBe("R$ 220,00");
  });

  it("preço abaixo do piso: as duas linhas (estratégia e piso) já deixam a diferença explícita, sem terceiro valor", () => {
    const itens = montarItensDadosAno(resultado({ preco: 130, piso: 140, teto: 200 }));
    expect(itens.find((i) => i.rotulo === "Preço da estratégia")?.valor).toBe("R$ 130,00");
    expect(itens.find((i) => i.rotulo === "Piso")?.valor).toBe("R$ 140,00");
    expect(itens.some((i) => i.rotulo === "Preço recomendado")).toBe(false);
  });
});

describe("ancoragemHorizontalTooltip", () => {
  it("perto da borda esquerda, ancora pela esquerda (0)", () => {
    expect(ancoragemHorizontalTooltip(5)).toBe(0);
  });

  it("perto da borda direita, ancora pela direita (1)", () => {
    expect(ancoragemHorizontalTooltip(95)).toBe(1);
  });

  it("no meio, centraliza (0.5)", () => {
    expect(ancoragemHorizontalTooltip(50)).toBe(0.5);
  });
});
