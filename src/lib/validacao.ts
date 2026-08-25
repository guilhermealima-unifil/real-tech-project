/**
 * Validação de entrada de `/api/simular` — regras de docs/02-especificacao-completa.md
 * (seção 7.3). Função pura, sem dependência de banco: a checagem de `ramoId`
 * (existe? `entraNoMvp`?) fica na rota, que tem acesso ao Prisma.
 *
 * Convenção de unidade nesta camada de API: percentuais chegam como números
 * "inteiros" (20 = 20%), igual ao resto do produto (ver ParametroTributario
 * e docs/00, seção "Desenho do motor"). A rota converte para fração (÷100)
 * antes de chamar `simular()`.
 */

export type FormulaTipo = "multiplicador" | "markup";
export type Regime = "simples" | "lucroReal";
export type CenarioRepasse = "integral" | "gradual" | "absorcao";

export interface EntradaSimulacaoAPI {
  ramoId: string;
  custoCompra: number;
  formulaTipo: FormulaTipo;
  despesaFixaPct?: number;
  markupPct?: number;
  margemAlvoPct: number;
  margemMinimaPct: number;
  regime: Regime;
  tetoPracaMin?: number;
  tetoPracaMax?: number;
  cenarioRepasse?: CenarioRepasse;
}

export type ResultadoValidacao =
  | { ok: true; entrada: EntradaSimulacaoAPI }
  | { ok: false; erros: string[] };

function numero(valor: unknown): number | undefined {
  return typeof valor === "number" && Number.isFinite(valor) ? valor : undefined;
}

export function validarEntradaSimulacao(body: unknown): ResultadoValidacao {
  const erros: string[] = [];

  if (typeof body !== "object" || body === null) {
    return { ok: false, erros: ["Corpo da requisição deve ser um objeto JSON."] };
  }
  const b = body as Record<string, unknown>;

  const ramoId = typeof b.ramoId === "string" && b.ramoId.length > 0 ? b.ramoId : undefined;
  if (!ramoId) erros.push("ramoId é obrigatório.");

  const custoCompra = numero(b.custoCompra);
  if (custoCompra === undefined || custoCompra <= 0) {
    erros.push("custoCompra é obrigatório e deve ser maior que zero.");
  }

  const formulaTipo = b.formulaTipo === "multiplicador" || b.formulaTipo === "markup"
    ? (b.formulaTipo as FormulaTipo)
    : undefined;
  if (!formulaTipo) erros.push('formulaTipo deve ser "multiplicador" ou "markup".');

  const despesaFixaPct = numero(b.despesaFixaPct);
  const markupPct = numero(b.markupPct);

  if (formulaTipo === "multiplicador") {
    if (despesaFixaPct === undefined || despesaFixaPct < 0 || despesaFixaPct > 100) {
      erros.push("despesaFixaPct é obrigatório quando formulaTipo é multiplicador, entre 0 e 100.");
    }
  }
  if (formulaTipo === "markup") {
    if (markupPct === undefined || markupPct < 0) {
      erros.push("markupPct é obrigatório quando formulaTipo é markup, e não pode ser negativo.");
    }
  }

  const margemAlvoPct = numero(b.margemAlvoPct);
  if (margemAlvoPct === undefined || margemAlvoPct < 0 || margemAlvoPct > 100) {
    erros.push("margemAlvoPct é obrigatório, entre 0 e 100.");
  }

  const margemMinimaPct = numero(b.margemMinimaPct);
  if (margemMinimaPct === undefined || margemMinimaPct < 0 || margemMinimaPct > 100) {
    erros.push("margemMinimaPct é obrigatório, entre 0 e 100.");
  }

  if (margemAlvoPct !== undefined && margemMinimaPct !== undefined && margemMinimaPct > margemAlvoPct) {
    erros.push("margemMinimaPct não pode ser maior que margemAlvoPct.");
  }

  const regime = b.regime === "simples" || b.regime === "lucroReal" ? (b.regime as Regime) : undefined;
  if (!regime) erros.push('regime deve ser "simples" ou "lucroReal".');

  const tetoPracaMin = numero(b.tetoPracaMin);
  const tetoPracaMax = numero(b.tetoPracaMax);
  if (b.tetoPracaMin !== undefined && (tetoPracaMin === undefined || tetoPracaMin <= 0)) {
    erros.push("tetoPracaMin, se informado, deve ser maior que zero.");
  }
  if (b.tetoPracaMax !== undefined && (tetoPracaMax === undefined || tetoPracaMax <= 0)) {
    erros.push("tetoPracaMax, se informado, deve ser maior que zero.");
  }
  if (tetoPracaMin !== undefined && tetoPracaMax !== undefined && tetoPracaMin > tetoPracaMax) {
    erros.push("tetoPracaMin não pode ser maior que tetoPracaMax.");
  }

  const cenariosValidos: CenarioRepasse[] = ["integral", "gradual", "absorcao"];
  const cenarioRepasse = b.cenarioRepasse === undefined
    ? "integral"
    : cenariosValidos.includes(b.cenarioRepasse as CenarioRepasse)
      ? (b.cenarioRepasse as CenarioRepasse)
      : undefined;
  if (cenarioRepasse === undefined) {
    erros.push('cenarioRepasse deve ser "integral", "gradual" ou "absorcao".');
  }

  if (erros.length > 0) return { ok: false, erros };

  return {
    ok: true,
    entrada: {
      ramoId: ramoId as string,
      custoCompra: custoCompra as number,
      formulaTipo: formulaTipo as FormulaTipo,
      despesaFixaPct,
      markupPct,
      margemAlvoPct: margemAlvoPct as number,
      margemMinimaPct: margemMinimaPct as number,
      regime: regime as Regime,
      tetoPracaMin,
      tetoPracaMax,
      cenarioRepasse: cenarioRepasse as CenarioRepasse,
    },
  };
}
