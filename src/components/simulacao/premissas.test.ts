import { describe, expect, it } from "vitest";
import { formatarFaixaPraca, rotuloModelo } from "./premissas";

describe("rotuloModelo", () => {
  it("markup vira 'Markup único'", () => {
    expect(rotuloModelo("markup")).toBe("Markup único");
  });

  it("multiplicador vira 'Despesa + margem'", () => {
    expect(rotuloModelo("multiplicador")).toBe("Despesa + margem");
  });
});

describe("formatarFaixaPraca", () => {
  it("mínimo e máximo informados vira faixa", () => {
    expect(formatarFaixaPraca(150, 160)).toBe("R$ 150,00 – R$ 160,00");
  });

  it("só o mínimo informado", () => {
    expect(formatarFaixaPraca(150, null)).toBe("a partir de R$ 150,00");
  });

  it("só o máximo informado", () => {
    expect(formatarFaixaPraca(null, 160)).toBe("até R$ 160,00");
  });

  it("nenhum informado", () => {
    expect(formatarFaixaPraca(null, null)).toBe("Não informado");
  });
});
