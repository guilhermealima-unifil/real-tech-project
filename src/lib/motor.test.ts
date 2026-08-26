import { describe, expect, it } from "vitest";
import { calcularImpactoCaixa, simular, type ParametroTributarioAno } from "./motor";

/**
 * Parâmetros ILUSTRATIVOS só para testar o motor — não são os valores reais
 * da transição (esses ainda precisam ser validados com o contador, ver
 * docs/00-plano-implementacao.md seção 10). 2027 tem +1,00 p.p. exato sobre
 * 2026 de propósito, para os Testes 3 e 4.
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

function resultadoDoAno(resultados: ReturnType<typeof simular>, ano: number) {
  const resultado = resultados.find((r) => r.ano === ano);
  if (!resultado) throw new Error(`Ano ${ano} não encontrado no resultado.`);
  return resultado;
}

describe("simular — motor de cálculo tributário", () => {
  it("Teste 1: EletroLondrina, multiplicador — custo 100, despesa 20%, margem 35% → preço R$ 155,00", () => {
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
    expect(resultadoDoAno(resultados, 2026).preco).toBe(155);
  });

  it("Teste 2: In-Pacto, markup — custo 100, markup 30% → preço R$ 130,00", () => {
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
    expect(resultadoDoAno(resultados, 2026).preco).toBe(130);
  });

  it("Teste 3: aumento de carga (+1 p.p.), multiplicador — preço sobe, margem-alvo em reais preservada", () => {
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
    const base = resultadoDoAno(resultados, 2026);
    const comAumento = resultadoDoAno(resultados, 2027);

    expect(comAumento.preco).toBe(base.preco + 1);
    expect(comAumento.margemResultante).toBe(base.margemResultante);
    expect(comAumento.margemResultante).toBe(0.35);
  });

  it("Teste 4: aumento de carga (+1 p.p.), markup — preço não muda, lucro cai", () => {
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
    const base = resultadoDoAno(resultados, 2026);
    const comAumento = resultadoDoAno(resultados, 2027);

    expect(comAumento.preco).toBe(base.preco);
    expect(comAumento.margemResultante).toBeLessThan(base.margemResultante);
    expect(base.margemResultante).toBe(0.3);
    expect(comAumento.margemResultante).toBe(0.29);
  });

  it("Teste 5: desconto no piso — preço praticado = piso → desconto máximo = 0%", () => {
    const resultados = simular(
      {
        custoCompra: 100,
        formulaTipo: "multiplicador",
        despesaFixaPct: 0.2,
        margemAlvoPct: 0.35,
        margemMinimaPct: 0.35, // igual à margem-alvo → preço calculado = piso
      },
      PARAMETROS_TESTE,
    );
    const resultado = resultadoDoAno(resultados, 2026);
    expect(resultado.preco).toBe(resultado.piso);
    expect(resultado.descontoMaximoPct).toBe(0);
  });

  it("Teste 6: piso acima do teto — faixa negativa e alerta disparado", () => {
    const resultados = simular(
      {
        custoCompra: 100,
        formulaTipo: "multiplicador",
        despesaFixaPct: 0.2,
        margemAlvoPct: 0.35,
        margemMinimaPct: 0.35,
        tetoPracaMax: 150, // abaixo do piso (155)
      },
      PARAMETROS_TESTE,
    );
    const resultado = resultadoDoAno(resultados, 2026);
    expect(resultado.piso).toBeGreaterThan(resultado.teto as number);
    expect(resultado.alertaDisparado).toBe(true);
  });

  it("Teste 7: continuidade da transição 2026→2033 — nenhum salto não explicado pelos parâmetros", () => {
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

    for (let i = 1; i < resultados.length; i++) {
      const anterior = resultados[i - 1];
      const atual = resultados[i];
      const paramAnterior = PARAMETROS_TESTE.find((p) => p.ano === anterior.ano)!;
      const paramAtual = PARAMETROS_TESTE.find((p) => p.ano === atual.ano)!;

      const deltaTributoEsperado =
        (paramAtual.cbsPct +
          paramAtual.ibsPct +
          paramAtual.pisCofinsPct +
          paramAtual.icmsIssPct -
          (paramAnterior.cbsPct +
            paramAnterior.ibsPct +
            paramAnterior.pisCofinsPct +
            paramAnterior.icmsIssPct)) /
        100;

      const deltaPrecoEsperado = 100 * deltaTributoEsperado;
      expect(atual.preco - anterior.preco).toBeCloseTo(deltaPrecoEsperado, 2);
    }
  });

  it("Teste 8: faixa estreita legível — piso 155, teto 160 (3% de folga), desconto máximo correto", () => {
    const resultados = simular(
      {
        custoCompra: 100,
        formulaTipo: "multiplicador",
        despesaFixaPct: 0.2,
        margemAlvoPct: 0.38,
        margemMinimaPct: 0.35,
        tetoPracaMax: 160,
      },
      PARAMETROS_TESTE,
    );
    const resultado = resultadoDoAno(resultados, 2026);

    expect(resultado.piso).toBe(155);
    expect(resultado.teto).toBe(160);
    expect(resultado.alertaDisparado).toBe(false);
    expect(resultado.descontoMaximoPct).toBeCloseTo(
      (resultado.preco - resultado.piso) / resultado.preco,
      4,
    );
    expect(resultado.descontoMaximoPct).toBeGreaterThan(0);
  });

  // Cenários de repasse gradual/absorção — Fase 3. Ver CLAUDE.md, seção
  // "Desenho do motor", para a fórmula e o porquê de não afetarem o markup.
  describe("cenários de repasse (Fase 3)", () => {
    it("gradual, multiplicador — preço sobe menos que o integral nos anos intermediários e converge no último ano", () => {
      const entradaBase = {
        custoCompra: 100,
        formulaTipo: "multiplicador" as const,
        despesaFixaPct: 0.2,
        margemAlvoPct: 0.35,
        margemMinimaPct: 0.3,
      };

      const integral = simular(entradaBase, PARAMETROS_TESTE);
      const gradual = simular(
        { ...entradaBase, cenarioRepasse: "gradual" },
        PARAMETROS_TESTE,
      );

      // 2027 é o segundo ano (índice 1 de 7) — só uma fração do delta é repassada.
      expect(resultadoDoAno(gradual, 2027).preco).toBeLessThan(
        resultadoDoAno(integral, 2027).preco,
      );
      expect(resultadoDoAno(gradual, 2027).margemResultante).toBeLessThan(0.35);

      // No último ano de parametros, gradual converge para o mesmo preço do integral.
      expect(resultadoDoAno(gradual, 2033).preco).toBeCloseTo(
        resultadoDoAno(integral, 2033).preco,
        2,
      );
      expect(resultadoDoAno(gradual, 2033).margemResultante).toBeCloseTo(0.35, 4);
    });

    it("absorção, multiplicador — preço nunca sobe além do ano-base, margem cai com o delta", () => {
      const resultados = simular(
        {
          custoCompra: 100,
          formulaTipo: "multiplicador",
          despesaFixaPct: 0.2,
          margemAlvoPct: 0.35,
          // Alto o bastante para o delta de 2033 (3,85 p.p., ver PARAMETROS_TESTE)
          // furar o mínimo, provando que o alerta dispara sob absorção total.
          margemMinimaPct: 0.32,
          cenarioRepasse: "absorcao",
        },
        PARAMETROS_TESTE,
      );

      const base = resultadoDoAno(resultados, 2026);
      for (const resultado of resultados) {
        expect(resultado.preco).toBe(base.preco);
      }

      const ultimo = resultadoDoAno(resultados, 2033);
      expect(ultimo.margemResultante).toBeCloseTo(0.3115, 4);
      expect(ultimo.margemResultante).toBeLessThan(0.32);
      expect(ultimo.alertaDisparado).toBe(true);
    });

    it("markup — cenarioRepasse não muda o preço (a fórmula já não repassa tributo, por definição)", () => {
      const entradaBase = {
        custoCompra: 100,
        formulaTipo: "markup" as const,
        markupPct: 0.3,
        margemAlvoPct: 0.3,
        margemMinimaPct: 0.25,
      };

      const integral = simular(entradaBase, PARAMETROS_TESTE);
      const gradual = simular({ ...entradaBase, cenarioRepasse: "gradual" }, PARAMETROS_TESTE);
      const absorcao = simular({ ...entradaBase, cenarioRepasse: "absorcao" }, PARAMETROS_TESTE);

      for (const ano of [2026, 2029, 2033]) {
        expect(resultadoDoAno(gradual, ano).preco).toBe(resultadoDoAno(integral, ano).preco);
        expect(resultadoDoAno(absorcao, ano).preco).toBe(resultadoDoAno(integral, ano).preco);
        expect(resultadoDoAno(gradual, ano).margemResultante).toBe(
          resultadoDoAno(integral, ano).margemResultante,
        );
      }
    });
  });

  // Impacto no caixa (Fase 5) — ver CLAUDE.md, seção "Desenho do motor", e
  // docs/05 para o porquê de não modelar um prazo em dias para a fatia em
  // risco (é indeterminada por definição, não um número que dá pra estimar).
  describe("calcularImpactoCaixa — Fase 5", () => {
    it("2026 (fase de teste do split payment): quase todo o imposto da compra está em risco, não protegido", () => {
      const resultados = calcularImpactoCaixa(100, 30, PARAMETROS_TESTE);
      const ano2026 = resultados.find((r) => r.ano === 2026)!;

      // cbsPct 0,9 + ibsPct 0,1 = 1,0% protegido; pisCofinsPct 3,65 + icmsIssPct 18 = 21,65% em risco.
      expect(ano2026.valorProtegido).toBe(1);
      expect(ano2026.valorEmRisco).toBe(21.65);
      expect(ano2026.valorEmRisco).toBeGreaterThan(ano2026.valorProtegido);
    });

    it("2033 (fim da transição): todo o imposto da compra já está protegido pelo split payment", () => {
      const resultados = calcularImpactoCaixa(100, 30, PARAMETROS_TESTE);
      const ano2033 = resultados.find((r) => r.ano === 2033)!;

      expect(ano2033.valorEmRisco).toBe(0);
      expect(ano2033.valorProtegido).toBe(26.5);
      expect(ano2033.mensagemRecomendacao).toContain("totalmente");
    });

    it("valorProtegido + valorEmRisco bate com o total tributário do ano, aplicado sobre o custo", () => {
      const resultados = calcularImpactoCaixa(200, 30, PARAMETROS_TESTE);
      for (const resultado of resultados) {
        const parametro = PARAMETROS_TESTE.find((p) => p.ano === resultado.ano)!;
        const totalEsperado =
          (200 * (parametro.cbsPct + parametro.ibsPct + parametro.pisCofinsPct + parametro.icmsIssPct)) / 100;
        expect(resultado.valorProtegido + resultado.valorEmRisco).toBeCloseTo(totalEsperado, 2);
      }
    });

    it("custoCompra inválido lança erro", () => {
      expect(() => calcularImpactoCaixa(0, 30, PARAMETROS_TESTE)).toThrow();
    });
  });
});
