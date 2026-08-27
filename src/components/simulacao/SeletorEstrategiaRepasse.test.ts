import { describe, expect, it } from "vitest";
import { CENARIOS } from "./SeletorEstrategiaRepasse";

describe("CENARIOS — estratégias de repasse exibidas no seletor", () => {
  it("expõe as três estratégias, na ordem Integral / Gradual / Absorção", () => {
    expect(CENARIOS.map((c) => c.valor)).toEqual(["integral", "gradual", "absorcao"]);
  });

  it("usa o vocabulário de estratégia de repasse, não de cenário, nos rótulos visíveis", () => {
    const rotulos = CENARIOS.map((c) => c.rotulo);
    expect(rotulos).toEqual(["Repasse integral", "Repasse gradual", "Absorção"]);
    for (const rotulo of rotulos) {
      expect(rotulo.toLowerCase()).not.toContain("cenário");
    }
  });
});
