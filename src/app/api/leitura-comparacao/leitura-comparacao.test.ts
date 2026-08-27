import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Mocka autenticação (`getUsuarioAutenticado`) e o SDK do Gemini
 * (`@google/genai`) — não faz chamada real a nenhum provedor pago (Parte L
 * do prompt desta etapa: "NÃO faça teste real contra API paga na suíte").
 * A rota em si (validação, tamanho de payload, leitura de `GEMINI_API_KEY`,
 * tratamento de erro) roda de verdade.
 */

const { generateContentMock, usuarioAutenticadoMock, ApiErrorFalso } = vi.hoisted(() => {
  class ApiErrorFalso extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.status = status;
    }
  }
  return {
    generateContentMock: vi.fn(),
    usuarioAutenticadoMock: vi.fn(),
    ApiErrorFalso,
  };
});

vi.mock("@/lib/auth/dal", () => ({
  getUsuarioAutenticado: usuarioAutenticadoMock,
}));

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn(function GoogleGenAIFalso() {
    return { models: { generateContent: generateContentMock } };
  }),
  ApiError: ApiErrorFalso,
  ThinkingLevel: { MINIMAL: "MINIMAL" },
}));

import { POST } from "./route";
import type { EvidenciasComparacao } from "@/lib/evidenciasComparacao";

const EVIDENCIAS_EXEMPLO: EvidenciasComparacao = {
  anoSelecionado: 2027,
  margemMinimaFracao: 0.22,
  cenarios: [
    {
      cenario: "integral",
      rotulo: "Repasse integral",
      resumo: {
        precoInicial: 150,
        precoFinal: 172,
        variacaoPrecoAbsoluta: 22,
        variacaoPrecoPct: 14.6,
        maiorReajusteAnual: 8,
        anoMaiorReajuste: 2027,
        menorMargemPct: 0.35,
        menorFolgaMargemPct: 0.13,
        anoMenorFolgaMargem: 2027,
        menorDistanciaTeto: -6,
        anoMenorDistanciaTeto: 2027,
        menorDescontoPct: 0.05,
        anosAbaixoMargemMinima: 0,
        anosAcimaTeto: 1,
        anosFaixaInviavel: 0,
        primeiroAnoCritico: 2027,
      },
      statusAnoSelecionado: "acima_teto",
      precoAnoSelecionado: 158,
      margemAnoSelecionadoPct: 0.35,
      primeiroAnoAcimaTeto: 2027,
      primeiroAnoMargemAbaixoMinima: null,
    },
  ],
  alertas: [
    { tipo: "acima_teto", cenario: "integral", rotulo: "Repasse integral", texto: "Repasse integral ultrapassa o teto a partir de 2027." },
  ],
  relacoes: {
    estrategiasEquivalentes: false,
    maisPreservaMargem: null,
    menosPreservaMargem: null,
    precoMaisEstavel: null,
    maiorReajuste: null,
    ultrapassaTetoMaisCedo: "integral",
    ultrapassaTetoMaisTarde: "integral",
    nuncaUltrapassaTeto: [],
    margemAbaixoMinima: [],
    faixaInviavel: [],
    intermediaria: null,
  },
};

function postJson(body: unknown): Request {
  return new Request("http://localhost/api/leitura-comparacao", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const chaveOriginal = process.env.GEMINI_API_KEY;

beforeEach(() => {
  generateContentMock.mockReset();
  usuarioAutenticadoMock.mockReset();
  usuarioAutenticadoMock.mockResolvedValue({ id: "user-1", email: "teste@exemplo.invalid" });
});

afterEach(() => {
  if (chaveOriginal === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = chaveOriginal;
});

describe("POST /api/leitura-comparacao", () => {
  it("não autenticado: 401, nunca chama o provedor de IA", async () => {
    usuarioAutenticadoMock.mockResolvedValue(null);
    const resposta = await POST(postJson({ evidencias: EVIDENCIAS_EXEMPLO }));

    expect(resposta.status).toBe(401);
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("corpo inválido: 400", async () => {
    const resposta = await POST(postJson({ evidencias: { foo: "bar" } }));
    expect(resposta.status).toBe(400);
  });

  it("sem GEMINI_API_KEY: devolve disponivel=false com motivo sem_chave, status 200", async () => {
    delete process.env.GEMINI_API_KEY;
    const resposta = await POST(postJson({ evidencias: EVIDENCIAS_EXEMPLO }));
    const dados = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(dados.disponivel).toBe(false);
    expect(dados.motivo).toBe("sem_chave");
    expect(generateContentMock).not.toHaveBeenCalled();
  });

  it("resposta válida do Gemini: devolve disponivel=true com o texto", async () => {
    process.env.GEMINI_API_KEY = "chave-de-teste";
    generateContentMock.mockResolvedValue({ text: "Repasse integral ultrapassa o teto em 2027, enquanto os demais preservam a faixa viável." });

    const resposta = await POST(postJson({ evidencias: EVIDENCIAS_EXEMPLO }));
    const dados = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(dados.disponivel).toBe(true);
    expect(typeof dados.texto).toBe("string");
    expect(dados.texto.length).toBeGreaterThan(0);
  });

  it("Gemini retorna erro (ex.: rate limit 429): devolve disponivel=false, nunca 500", async () => {
    process.env.GEMINI_API_KEY = "chave-de-teste";
    generateContentMock.mockRejectedValue(new ApiErrorFalso(429, "Resource exhausted"));

    const resposta = await POST(postJson({ evidencias: EVIDENCIAS_EXEMPLO }));
    const dados = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(dados.disponivel).toBe(false);
    expect(dados.motivo).toBe("limite_excedido");
  });

  it("Gemini lança erro genérico: devolve disponivel=false, motivo erro_provedor", async () => {
    process.env.GEMINI_API_KEY = "chave-de-teste";
    generateContentMock.mockRejectedValue(new Error("timeout"));

    const resposta = await POST(postJson({ evidencias: EVIDENCIAS_EXEMPLO }));
    const dados = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(dados.disponivel).toBe(false);
    expect(dados.motivo).toBe("erro_provedor");
  });

  it("Gemini devolve texto vazio: trata como resposta inválida, não quebra", async () => {
    process.env.GEMINI_API_KEY = "chave-de-teste";
    generateContentMock.mockResolvedValue({ text: "   " });

    const resposta = await POST(postJson({ evidencias: EVIDENCIAS_EXEMPLO }));
    const dados = await resposta.json();

    expect(resposta.status).toBe(200);
    expect(dados.disponivel).toBe(false);
    expect(dados.motivo).toBe("resposta_invalida");
  });

  it("evidências sem cenários: não chama o provedor, devolve disponivel=false", async () => {
    process.env.GEMINI_API_KEY = "chave-de-teste";
    const evidenciasVazias: EvidenciasComparacao = { ...EVIDENCIAS_EXEMPLO, cenarios: [] };

    const resposta = await POST(postJson({ evidencias: evidenciasVazias }));
    const dados = await resposta.json();

    expect(dados.disponivel).toBe(false);
    expect(dados.motivo).toBe("sem_dados");
    expect(generateContentMock).not.toHaveBeenCalled();
  });
});
