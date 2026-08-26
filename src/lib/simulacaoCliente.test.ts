import { describe, expect, it } from "vitest";
import { simular, type ParametroTributarioAno } from "./motor";
import { simularTresCenarios } from "./simulacaoCliente";

/**
 * Mesmo fixture ilustrativo de motor.test.ts — não são valores reais da
 * transição (docs/00, seção 10).
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

describe("simularTresCenarios — orquestração client-side", () => {
  it("entrada válida (EletroLondrina): cenário integral 2026 bate com chamar simular() direto", () => {
    const resultado = simularTresCenarios(
      {
        ramoId: "ramo-1",
        custoCompra: 100,
        formulaTipo: "multiplicador",
        despesaFixaPct: 20,
        margemAlvoPct: 35,
        margemMinimaPct: 30,
      },
      PARAMETROS_TESTE,
    );

    expect(resultado.ok).toBe(true);
    if (!resultado.ok) return;

    const esperado = simular(
      {
        custoCompra: 100,
        formulaTipo: "multiplicador",
        despesaFixaPct: 0.2,
        margemAlvoPct: 0.35,
        margemMinimaPct: 0.3,
        cenarioRepasse: "integral",
      },
      PARAMETROS_TESTE,
    );

    expect(resultado.cenarios.integral.find((r) => r.ano === 2026)?.preco).toBe(
      esperado.find((r) => r.ano === 2026)?.preco,
    );
    expect(Object.keys(resultado.cenarios).sort()).toEqual(["absorcao", "gradual", "integral"]);
  });

  it("entrada inválida (margemMinimaPct > margemAlvoPct): retorna ok:false com erros, sem chamar o motor", () => {
    const resultado = simularTresCenarios(
      {
        ramoId: "ramo-1",
        custoCompra: 100,
        formulaTipo: "multiplicador",
        despesaFixaPct: 20,
        margemAlvoPct: 30,
        margemMinimaPct: 40,
      },
      PARAMETROS_TESTE,
    );

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.erros).toContain("margemMinimaPct não pode ser maior que margemAlvoPct.");
  });

  it("parâmetros sem o ano-base (2026): exceção lançada por simular() vira ok:false, não propaga", () => {
    const resultado = simularTresCenarios(
      {
        ramoId: "ramo-1",
        custoCompra: 100,
        formulaTipo: "markup",
        markupPct: 30,
        margemAlvoPct: 30,
        margemMinimaPct: 25,
      },
      PARAMETROS_TESTE.filter((p) => p.ano !== 2026),
    );

    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.erros[0]).toMatch(/ano-base/i);
  });
});
