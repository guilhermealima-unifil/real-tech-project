import { describe, expect, it } from "vitest";
import { anoAnterior, anoProximo } from "./navegacaoAno";

const ANOS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033];

describe("navegacaoAno — seletor compacto de ano do Resultado", () => {
  it("anterior de 2026 (primeiro ano) é indisponível", () => {
    expect(anoAnterior(ANOS, 2026)).toBeNull();
  });

  it("próximo de 2026 é 2027", () => {
    expect(anoProximo(ANOS, 2026)).toBe(2027);
  });

  it("anterior de 2033 (último ano) é 2032", () => {
    expect(anoAnterior(ANOS, 2033)).toBe(2032);
  });

  it("próximo de 2033 (último ano) é indisponível — sem dar a volta para 2026", () => {
    expect(anoProximo(ANOS, 2033)).toBeNull();
  });

  it("seleção direta no meio da lista continua correta para os dois lados", () => {
    expect(anoAnterior(ANOS, 2029)).toBe(2028);
    expect(anoProximo(ANOS, 2029)).toBe(2030);
  });
});
