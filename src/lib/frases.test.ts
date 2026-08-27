import { describe, expect, it } from "vitest";
import { leituraFaixa, mensagemPrecoEstrategia, mensagemReajusteNecessario } from "./frases";
import { calcularDiferencaPreco, classificarStatusPreco } from "./analiseResultado";
import { simular, type ParametroTributarioAno } from "./motor";

// Mesma curva de 8 anos do seed (prisma/seed.ts) — "gradual" depende do
// ÚLTIMO ano da lista para calcular a fração repassada (ver motor.ts,
// fracaoRepasse), então truncar para só 2026/2027 mudaria o resultado do
// cenário gradual: com só 2 anos, 2027 já seria o "último ano" e a fração
// repassada viraria 1 (igual a integral), não o valor real do caso.
const PARAMETROS_TRANSICAO: ParametroTributarioAno[] = [
  { ano: 2026, cbsPct: 0.9, ibsPct: 0.1, pisCofinsPct: 3.65, icmsIssPct: 18 },
  { ano: 2027, cbsPct: 8.8, ibsPct: 0.1, pisCofinsPct: 0, icmsIssPct: 18 },
  { ano: 2028, cbsPct: 8.8, ibsPct: 0.1, pisCofinsPct: 0, icmsIssPct: 18 },
  { ano: 2029, cbsPct: 8.8, ibsPct: 1.77, pisCofinsPct: 0, icmsIssPct: 16.2 },
  { ano: 2030, cbsPct: 8.8, ibsPct: 3.54, pisCofinsPct: 0, icmsIssPct: 14.4 },
  { ano: 2031, cbsPct: 8.8, ibsPct: 5.31, pisCofinsPct: 0, icmsIssPct: 12.6 },
  { ano: 2032, cbsPct: 8.8, ibsPct: 7.08, pisCofinsPct: 0, icmsIssPct: 10.8 },
  { ano: 2033, cbsPct: 8.8, ibsPct: 17.7, pisCofinsPct: 0, icmsIssPct: 0 },
];

describe("leituraFaixa", () => {
  it("faixa inviável (piso > teto) não fala em manter/reajustar preço — descreve a inviabilidade estrutural", () => {
    const leitura = leituraFaixa({
      status: classificarStatusPreco(150, 220, 200),
      preco: 150,
      piso: 220,
      teto: 200,
      descontoMaximoPct: 0,
    });
    expect(leitura.titulo).toBe("Não há faixa viável neste ano.");
    expect(leitura.complemento).toContain("piso");
    expect(leitura.complemento).toContain("teto");
  });

  it("preço abaixo do piso pede reajuste e mostra a diferença objetiva, mesmo com teto null", () => {
    const leitura = leituraFaixa({
      status: classificarStatusPreco(90, 100, null),
      preco: 90,
      piso: 100,
      teto: null,
      descontoMaximoPct: null,
    });
    expect(leitura.titulo).toBe(
      "O preço está abaixo do piso necessário para preservar a margem mínima.",
    );
    expect(leitura.complemento).toBe("Faltam R$ 10,00 para alcançar o piso.");
  });

  it("preço acima do teto (mas dentro do piso) NUNCA é lido como 'mantenha o preço' — é a lacuna que resumoRecomendacao tinha", () => {
    const leitura = leituraFaixa({
      status: classificarStatusPreco(250, 150, 200),
      preco: 250,
      piso: 150,
      teto: 200,
      descontoMaximoPct: 0.4,
    });
    expect(leitura.titulo).toBe("O preço está acima do teto informado pela praça.");
    expect(leitura.titulo.toLowerCase()).not.toContain("mantenha");
    expect(leitura.complemento).not.toBeNull();
  });

  it("dentro da faixa com desconto disponível: título fala em folga, sem repetir o número (já em ResumoResultado)", () => {
    const leitura = leituraFaixa({
      status: classificarStatusPreco(155, 150, 200),
      preco: 155,
      piso: 150,
      teto: 200,
      descontoMaximoPct: 0.032,
    });
    expect(leitura.titulo).toBe("O preço está acima do piso, com folga até a margem mínima.");
    expect(leitura.complemento).toBeNull();
    expect(leitura.titulo).not.toContain("%");
  });

  it("preço exatamente no piso (sem desconto) não anuncia desconto nenhum", () => {
    const leitura = leituraFaixa({
      status: classificarStatusPreco(150, 150, 200),
      preco: 150,
      piso: 150,
      teto: 200,
      descontoMaximoPct: 0,
    });
    expect(leitura.titulo).toBe("O preço está no piso da margem mínima.");
    expect(leitura.complemento).toBeNull();
  });

  it("sem teto informado, preço alto nunca é lido como 'acima do teto' nem 'faixa inviável' — só piso decide", () => {
    const status = classificarStatusPreco(999, 150, null);
    expect(status).toBe("dentro_da_faixa");
    const leitura = leituraFaixa({
      status,
      preco: 999,
      piso: 150,
      teto: null,
      descontoMaximoPct: 0.85,
    });
    expect(leitura.titulo).not.toContain("teto");
  });

  it("Caso C (teste semântico) — Integral 2027 fica acima do teto e a leitura não diz 'mantenha o preço'", () => {
    const resultados = simular(
      {
        custoCompra: 100,
        formulaTipo: "multiplicador",
        despesaFixaPct: 0.15,
        margemAlvoPct: 0.35,
        margemMinimaPct: 0.22,
        tetoPracaMax: 152,
        cenarioRepasse: "integral",
      },
      PARAMETROS_TRANSICAO,
    );

    const r2027 = resultados.find((r) => r.ano === 2027);
    expect(r2027).toBeDefined();
    expect(r2027!.preco).toBeCloseTo(154.25, 2);

    const status = classificarStatusPreco(r2027!.preco, r2027!.piso, r2027!.teto);
    expect(status).toBe("acima_teto");

    const leitura = leituraFaixa({
      status,
      preco: r2027!.preco,
      piso: r2027!.piso,
      teto: r2027!.teto,
      descontoMaximoPct: r2027!.descontoMaximoPct,
    });
    expect(leitura.titulo).toBe("O preço está acima do teto informado pela praça.");
    expect(leitura.titulo).not.toContain("Mantenha");
  });

  it("Caso C — Gradual e Absorção em 2027 ficam dentro da faixa (contraste com Integral)", () => {
    const entradaBase = {
      custoCompra: 100,
      formulaTipo: "multiplicador" as const,
      despesaFixaPct: 0.15,
      margemAlvoPct: 0.35,
      margemMinimaPct: 0.22,
      tetoPracaMax: 152,
    };

    const gradual = simular(
      { ...entradaBase, cenarioRepasse: "gradual" },
      PARAMETROS_TRANSICAO,
    ).find((r) => r.ano === 2027)!;
    const absorcao = simular(
      { ...entradaBase, cenarioRepasse: "absorcao" },
      PARAMETROS_TRANSICAO,
    ).find((r) => r.ano === 2027)!;

    expect(gradual.preco).toBeCloseTo(150.61, 1);
    expect(classificarStatusPreco(gradual.preco, gradual.piso, gradual.teto)).toBe(
      "dentro_da_faixa",
    );

    expect(absorcao.preco).toBeCloseTo(150, 1);
    expect(classificarStatusPreco(absorcao.preco, absorcao.piso, absorcao.teto)).toBe(
      "dentro_da_faixa",
    );
  });
});

describe("mensagemPrecoEstrategia", () => {
  it("dentro da faixa: frase neutra, sem repetir o número, sem dizer 'recomendado'", () => {
    const texto = mensagemPrecoEstrategia({ precoEstrategia: 155, status: "dentro_da_faixa" });
    expect(texto).toBe("Este preço preserva sua margem mínima.");
    expect(texto.toLowerCase()).not.toContain("recomend");
  });

  it("acima do teto: reconhece o teto, nunca chama o preço de recomendado", () => {
    const texto = mensagemPrecoEstrategia({ precoEstrategia: 154.25, status: "acima_teto" });
    expect(texto).toBe("Este preço preserva sua margem, mas está acima do teto informado pela praça.");
    expect(texto.toLowerCase()).not.toContain("recomend");
  });

  it("faixa inviável: descreve a inviabilidade estrutural, nenhum preço comercial fictício", () => {
    const texto = mensagemPrecoEstrategia({ precoEstrategia: 150, status: "faixa_inviavel" });
    expect(texto).toBe("Não existe preço que atenda sua margem mínima e o teto da praça ao mesmo tempo.");
    expect(texto.toLowerCase()).not.toContain("recomend");
  });

  it("abaixo do piso: descreve o fato sem prescrever, sem dizer 'recomendado'", () => {
    const texto = mensagemPrecoEstrategia({ precoEstrategia: 90, status: "abaixo_piso" });
    expect(texto).toContain("R$ 90,00");
    expect(texto.toLowerCase()).not.toContain("recomend");
    expect(texto.toLowerCase()).not.toContain("deve cobrar");
  });
});

describe("mensagemReajusteNecessario", () => {
  it("descreve o valor necessário para atingir o piso, sem linguagem de recomendação comercial", () => {
    const texto = mensagemReajusteNecessario({ diferencaValor: 0.85, diferencaPercentual: 0.0052 });
    expect(texto).toBe("É necessário elevar o preço em R$ 0,85 (0,5%) para atingir o piso.");
    expect(texto.toLowerCase()).not.toContain("recomend");
    expect(texto.toLowerCase()).not.toContain("deve");
  });

  it("sem percentual disponível, ainda descreve o valor em reais", () => {
    const texto = mensagemReajusteNecessario({ diferencaValor: 10, diferencaPercentual: null });
    expect(texto).toBe("É necessário elevar o preço em R$ 10,00 para atingir o piso.");
  });
});

describe("Caso C (teste semântico) — Integral 2027: LeituraFaixa e mensagemPrecoEstrategia deixam de se contradizer", () => {
  it("nenhuma das duas frases soa como 'está tudo certo' quando o preço ultrapassa o teto", () => {
    const resultados = simular(
      {
        custoCompra: 100,
        formulaTipo: "multiplicador",
        despesaFixaPct: 0.15,
        margemAlvoPct: 0.35,
        margemMinimaPct: 0.22,
        tetoPracaMax: 152,
        cenarioRepasse: "integral",
      },
      PARAMETROS_TRANSICAO,
    );
    const r2027 = resultados.find((r) => r.ano === 2027)!;
    expect(r2027.preco).toBeCloseTo(154.25, 2);

    const status = classificarStatusPreco(r2027.preco, r2027.piso, r2027.teto);
    expect(status).toBe("acima_teto");

    const leitura = leituraFaixa({
      status,
      preco: r2027.preco,
      piso: r2027.piso,
      teto: r2027.teto,
      descontoMaximoPct: r2027.descontoMaximoPct,
    });

    const mensagem = mensagemPrecoEstrategia({ precoEstrategia: r2027.preco, status });

    expect(leitura.titulo).toBe("O preço está acima do teto informado pela praça.");
    expect(mensagem).toBe("Este preço preserva sua margem, mas está acima do teto informado pela praça.");
    expect(mensagem.toLowerCase()).not.toContain("recomend");
  });
});

describe("calcularDiferencaPreco aplicado ao piso (abaixo_piso) — reuso sem duplicar cálculo", () => {
  it("piso - preco produz a diferença necessária para atingir o piso (Caso B, markup, ano acima do piso)", () => {
    const resultados = simular(
      {
        custoCompra: 100,
        formulaTipo: "markup",
        markupPct: 0.3,
        margemAlvoPct: 0.3,
        margemMinimaPct: 0.29,
        cenarioRepasse: "integral",
      },
      PARAMETROS_TRANSICAO,
    );
    const r2028 = resultados.find((r) => r.ano === 2028)!;
    const status = classificarStatusPreco(r2028.preco, r2028.piso, r2028.teto);
    expect(status).toBe("abaixo_piso");

    const diferenca = calcularDiferencaPreco(r2028.piso, r2028.preco);
    expect(diferenca.valor).toBeCloseTo(r2028.piso - r2028.preco, 5);
    expect(diferenca.valor).toBeGreaterThan(0);
  });
});
