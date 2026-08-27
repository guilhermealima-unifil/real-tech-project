import { NextResponse } from "next/server";
import { GoogleGenAI, ApiError as GeminiApiError, ThinkingLevel } from "@google/genai";
import { getUsuarioAutenticado } from "@/lib/auth/dal";
import type { EvidenciasComparacao } from "@/lib/evidenciasComparacao";
import {
  INSTRUCAO_SISTEMA_LEITURA_COMPARACAO,
  construirMensagemUsuario,
  construirPayloadIA,
} from "@/lib/leituraComparacaoPrompt";

/**
 * Camada mínima de IA (Parte C do prompt desta etapa): recebe evidências já
 * calculadas de "Comparar estratégias" (client-side, via
 * `construirEvidenciasComparacao` — nunca recalculadas aqui) e devolve uma
 * leitura curta em português, gerada pelo Gemini. A IA NUNCA vê o objeto
 * bruto do motor nem calcula preço/margem/tributo — só o payload restrito
 * de `construirPayloadIA` (ver leituraComparacaoPrompt.ts).
 *
 * Sem `GEMINI_API_KEY` configurada, ou em qualquer erro do provedor
 * (quota, rate limit, timeout, resposta inválida), devolve 200 com
 * `{ disponivel: false }` — nunca 500 nem quebra a página: o cliente já
 * tem a leitura determinística de fallback (`leituraComparacaoFallback.ts`)
 * e continua funcional sem IA (Parte H).
 */

const MODELO_GEMINI = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
const TAMANHO_MAX_PAYLOAD_BYTES = 50_000;
const TAMANHO_MAX_TEXTO = 2_000;

interface CorpoRequisicao {
  evidencias: EvidenciasComparacao;
}

function corpoValido(body: unknown): body is CorpoRequisicao {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  if (typeof b.evidencias !== "object" || b.evidencias === null) return false;
  const evidencias = b.evidencias as Record<string, unknown>;
  return (
    typeof evidencias.anoSelecionado === "number" &&
    typeof evidencias.margemMinimaFracao === "number" &&
    Array.isArray(evidencias.cenarios)
  );
}

export async function POST(request: Request) {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    return NextResponse.json({ erros: ["Não autenticado."] }, { status: 401 });
  }

  const bruto = await request.text();
  if (bruto.length > TAMANHO_MAX_PAYLOAD_BYTES) {
    return NextResponse.json(
      { erros: ["Corpo da requisição excede o tamanho máximo permitido."] },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(bruto);
  } catch {
    return NextResponse.json({ erros: ["Corpo da requisição deve ser JSON válido."] }, { status: 400 });
  }

  if (!corpoValido(body)) {
    return NextResponse.json({ erros: ["Corpo deve conter `evidencias` no formato esperado."] }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ disponivel: false, motivo: "sem_chave" });
  }

  if (body.evidencias.cenarios.length === 0) {
    return NextResponse.json({ disponivel: false, motivo: "sem_dados" });
  }
  const payload = construirPayloadIA(body.evidencias);

  try {
    const ai = new GoogleGenAI({ apiKey });
    const resposta = await ai.models.generateContent({
      model: MODELO_GEMINI,
      contents: construirMensagemUsuario(payload),
      config: {
        systemInstruction: INSTRUCAO_SISTEMA_LEITURA_COMPARACAO,
        responseMimeType: "text/plain",
        temperature: 0.2,
        maxOutputTokens: 1000,
        // Tarefa é resumo curto e restrito por fatos — sem necessidade de
        // raciocínio interno. Modelos Gemini 3 (ex.: gemini-3.5-flash-lite) não
        // aceitam thinkingBudget: 0 (rejeitado com 400) — thinkingLevel é o
        // controle correto nessa geração, "minimal" sendo o menor nível
        // documentado. Sem isso, os tokens de pensamento consomem o mesmo
        // orçamento de maxOutputTokens e podem truncar a resposta visível
        // antes de sair texto nenhum (visto em validação manual: 478/500
        // tokens gastos só em "thoughts", resposta cortada em MAX_TOKENS).
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
      },
    });

    const texto = resposta.text?.trim();
    if (!texto || texto.length === 0 || texto.length > TAMANHO_MAX_TEXTO) {
      return NextResponse.json({ disponivel: false, motivo: "resposta_invalida" });
    }

    return NextResponse.json({ disponivel: true, texto });
  } catch (erro) {
    const motivo = erro instanceof GeminiApiError && erro.status === 429 ? "limite_excedido" : "erro_provedor";
    return NextResponse.json({ disponivel: false, motivo });
  }
}
