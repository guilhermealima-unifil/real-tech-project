"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  calcularImpactoCaixa,
  type CenarioRepasse,
  type FormulaTipo,
  type ImpactoCaixaAno,
  type ParametroTributarioAno,
  type ResultadoAno,
} from "@/lib/motor";
import { FaixaViavelChart } from "@/components/FaixaViavelChart";
import { ImpactoCaixaChart } from "@/components/ImpactoCaixaChart";
import { PainelRecomendacao } from "@/components/PainelRecomendacao";

const CENARIOS: { valor: CenarioRepasse; rotulo: string }[] = [
  { valor: "integral", rotulo: "Repasse integral" },
  { valor: "gradual", rotulo: "Repasse gradual" },
  { valor: "absorcao", rotulo: "Absorção" },
];

interface Ramo {
  id: string;
  chave: string;
  rotulo: string;
  aliquotaSugerida: number;
}

interface ParametroInfo extends ParametroTributarioAno {
  vigencia: string;
  fonte: string;
}

interface FormState {
  ramoId: string;
  custoCompra: string;
  formulaTipo: FormulaTipo;
  despesaFixaPct: string;
  markupPct: string;
  margemAlvoPct: string;
  margemMinimaPct: string;
  tetoPracaMin: string;
  tetoPracaMax: string;
  prazoPagamentoFornecedorDias: string;
}

const FORM_INICIAL: FormState = {
  ramoId: "",
  custoCompra: "",
  formulaTipo: "multiplicador",
  despesaFixaPct: "",
  markupPct: "",
  margemAlvoPct: "",
  margemMinimaPct: "",
  tetoPracaMin: "",
  tetoPracaMax: "",
  prazoPagamentoFornecedorDias: "30",
};

/** Casos reais das entrevistas (docs/00, seção 6; prisma/seed.ts) — botão de demonstração. */
const CASOS_REAIS: Record<
  string,
  { rotulo: string; ramoChave: string; form: Omit<FormState, "ramoId"> }
> = {
  eletrolondrina: {
    rotulo: "Carregar caso EletroLondrina",
    ramoChave: "eletro",
    form: {
      custoCompra: "100",
      formulaTipo: "multiplicador",
      despesaFixaPct: "20",
      markupPct: "",
      margemAlvoPct: "35",
      margemMinimaPct: "30",
      tetoPracaMin: "",
      tetoPracaMax: "",
      prazoPagamentoFornecedorDias: "30",
    },
  },
  inpacto: {
    rotulo: "Carregar caso Grupo In-Pacto",
    ramoChave: "eletrico",
    form: {
      custoCompra: "100",
      formulaTipo: "markup",
      despesaFixaPct: "",
      markupPct: "30",
      margemAlvoPct: "30",
      margemMinimaPct: "30",
      tetoPracaMin: "",
      tetoPracaMax: "",
      prazoPagamentoFornecedorDias: "30",
    },
  },
};

function numOrUndefined(valor: string): number | undefined {
  if (valor.trim() === "") return undefined;
  const n = Number(valor);
  return Number.isFinite(n) ? n : undefined;
}

interface RespostaCenarios {
  ramo: { rotulo: string; aliquotaSugerida: number };
  cenarios: Record<CenarioRepasse, ResultadoAno[]>;
}

/** Guarda mínima de formato antes de confiar na resposta de /api/simular-cenarios — evita um `as` sem checagem em runtime. */
function isRespostaCenariosValida(data: unknown): data is RespostaCenarios {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  if (typeof d.ramo !== "object" || d.ramo === null) return false;
  if (typeof d.cenarios !== "object" || d.cenarios === null) return false;
  const cenarios = d.cenarios as Record<string, unknown>;
  return (["integral", "gradual", "absorcao"] as const).every((chave) =>
    Array.isArray(cenarios[chave]),
  );
}

export default function Home() {
  const [ramos, setRamos] = useState<Ramo[]>([]);
  const [parametros, setParametros] = useState<ParametroInfo[]>([]);
  const [form, setForm] = useState<FormState>(FORM_INICIAL);
  const [cenarios, setCenarios] = useState<Record<
    CenarioRepasse,
    ResultadoAno[]
  > | null>(null);
  const [cenarioSelecionado, setCenarioSelecionado] =
    useState<CenarioRepasse>("integral");
  const [impactoCaixa, setImpactoCaixa] = useState<ImpactoCaixaAno[] | null>(
    null,
  );
  const [ramoSimulado, setRamoSimulado] = useState<{
    rotulo: string;
    aliquotaSugerida: number;
  } | null>(null);
  // Guardado à parte de form.formulaTipo: o usuário pode trocar o rádio
  // depois de simular, sem reenviar o formulário — o seletor de cenário
  // precisa refletir a fórmula que gerou `resultados`, não a do form atual.
  const [formulaTipoSimulado, setFormulaTipoSimulado] =
    useState<FormulaTipo | null>(null);
  const [anoSelecionado, setAnoSelecionado] = useState<number>(2026);
  const [descontoPedidoPct, setDescontoPedidoPct] = useState<number>(0);
  const [erros, setErros] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoRamos, setCarregandoRamos] = useState(true);

  const resultados = cenarios ? cenarios[cenarioSelecionado] : null;
  const parametrosInfo = parametros[0] ?? null;
  const cenarioIrrelevante = formulaTipoSimulado === "markup";

  // Ignora respostas de simulação que chegam depois de o usuário já ter
  // trocado de caso/formulário — evita sobrescrever a tela com um
  // resultado obsoleto (corrida de estado entre "carregar caso real" e
  // uma simulação ainda em voo).
  const requisicaoIdRef = useRef(0);
  const tabsCenarioRef = useRef<(HTMLButtonElement | null)[]>([]);

  function onCenarioTabKeyDown(
    evento: React.KeyboardEvent<HTMLButtonElement>,
    indice: number,
  ) {
    if (evento.key !== "ArrowRight" && evento.key !== "ArrowLeft") return;
    evento.preventDefault();
    const delta = evento.key === "ArrowRight" ? 1 : -1;
    const proximoIndice = (indice + delta + CENARIOS.length) % CENARIOS.length;
    setCenarioSelecionado(CENARIOS[proximoIndice].valor);
    tabsCenarioRef.current[proximoIndice]?.focus();
  }

  useEffect(() => {
    let cancelado = false;

    fetch("/api/ramos")
      .then((r) => {
        if (!r.ok) throw new Error("resposta não-ok");
        return r.json();
      })
      .then((data: Ramo[]) => {
        if (!cancelado) setRamos(data);
      })
      .catch(() => {
        if (!cancelado)
          setErros((e) => [
            ...e,
            "Não foi possível carregar os ramos. Recarregue a página.",
          ]);
      })
      .finally(() => {
        if (!cancelado) setCarregandoRamos(false);
      });

    fetch("/api/parametros")
      .then((r) => {
        if (!r.ok) throw new Error("resposta não-ok");
        return r.json();
      })
      .then((data: ParametroInfo[]) => {
        if (!cancelado) setParametros(data);
      })
      .catch(() => {
        if (!cancelado) {
          setErros((e) => [
            ...e,
            "Não foi possível carregar os parâmetros tributários. Recarregue a página.",
          ]);
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const ramoSelecionado = useMemo(
    () => ramos.find((r) => r.id === form.ramoId) ?? null,
    [ramos, form.ramoId],
  );

  function atualizarCampo<K extends keyof FormState>(
    campo: K,
    valor: FormState[K],
  ) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function carregarCasoReal(chave: keyof typeof CASOS_REAIS) {
    const caso = CASOS_REAIS[chave];
    const ramo = ramos.find((r) => r.chave === caso.ramoChave);
    if (!ramo) return;
    requisicaoIdRef.current += 1; // invalida qualquer simulação ainda em voo
    setForm({ ramoId: ramo.id, ...caso.form });
    setCenarios(null);
    setImpactoCaixa(null);
    setDescontoPedidoPct(0);
    setErros([]);
  }

  async function simular(evento: React.FormEvent) {
    evento.preventDefault();
    setErros([]);
    setCarregando(true);
    const idRequisicao = (requisicaoIdRef.current += 1);

    const corpo = {
      ramoId: form.ramoId,
      custoCompra: numOrUndefined(form.custoCompra),
      formulaTipo: form.formulaTipo,
      despesaFixaPct:
        form.formulaTipo === "multiplicador"
          ? numOrUndefined(form.despesaFixaPct)
          : undefined,
      markupPct:
        form.formulaTipo === "markup"
          ? numOrUndefined(form.markupPct)
          : undefined,
      // No modelo markup o campo "margem-alvo" fica escondido (não é lido
      // por simular() para essa fórmula — ver motor.ts) mas a API ainda
      // exige o campo; o markup já É a margem-alvo nesse modelo (não há
      // despesa/margem decompostas), então reaproveitamos o mesmo valor.
      margemAlvoPct:
        form.formulaTipo === "markup"
          ? numOrUndefined(form.markupPct)
          : numOrUndefined(form.margemAlvoPct),
      margemMinimaPct: numOrUndefined(form.margemMinimaPct),
      tetoPracaMin: numOrUndefined(form.tetoPracaMin),
      tetoPracaMax: numOrUndefined(form.tetoPracaMax),
    };

    try {
      const resposta = await fetch("/api/simular-cenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });

      let data: unknown;
      try {
        data = await resposta.json();
      } catch {
        throw new Error("Resposta inválida do servidor.");
      }

      if (requisicaoIdRef.current !== idRequisicao) return; // resposta obsoleta, ignorar

      if (!resposta.ok) {
        const errosResposta =
          typeof data === "object" &&
          data !== null &&
          Array.isArray((data as Record<string, unknown>).erros)
            ? ((data as Record<string, unknown>).erros as string[])
            : ["Erro ao simular."];
        setErros(errosResposta);
        setCenarios(null);
        setImpactoCaixa(null);
        return;
      }

      if (!isRespostaCenariosValida(data)) {
        setErros(["Resposta inesperada do servidor. Tente novamente."]);
        setCenarios(null);
        setImpactoCaixa(null);
        return;
      }

      setCenarios(data.cenarios);
      setCenarioSelecionado("integral");
      setRamoSimulado(data.ramo);
      setFormulaTipoSimulado(form.formulaTipo);
      setAnoSelecionado(2026);
      setDescontoPedidoPct(0);

      // Impacto no caixa (Fase 5) não depende do banco — roda no cliente com
      // os parâmetros já carregados em /api/parametros. Ver CLAUDE.md, seção
      // "Desenho do motor".
      const custoCompra = numOrUndefined(form.custoCompra);
      const prazoPagamentoFornecedorDias = numOrUndefined(
        form.prazoPagamentoFornecedorDias,
      );
      if (
        custoCompra !== undefined &&
        prazoPagamentoFornecedorDias !== undefined &&
        parametros.length > 0
      ) {
        setImpactoCaixa(
          calcularImpactoCaixa(
            custoCompra,
            prazoPagamentoFornecedorDias,
            parametros,
          ),
        );
      } else {
        setImpactoCaixa(null);
      }
    } catch {
      if (requisicaoIdRef.current !== idRequisicao) return; // resposta obsoleta, ignorar
      setErros([
        "Não foi possível falar com o servidor. Verifique a rede e tente novamente.",
      ]);
      setCenarios(null);
      setImpactoCaixa(null);
    } finally {
      if (requisicaoIdRef.current === idRequisicao) setCarregando(false);
    }
  }

  const resultadoSelecionado =
    resultados?.find((r) => r.ano === anoSelecionado) ?? null;
  const impactoCaixaSelecionado =
    impactoCaixa?.find((r) => r.ano === anoSelecionado) ?? null;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-10">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Real Tech — faixa viável de preço na transição IBS/CBS
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Custo, margem mínima e preço da praça: onde seu preço pode viver em
            cada ano, de 2026 a 2033.
          </p>
        </header>

        <form
          onSubmit={simular}
          className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div
            className="mb-4 flex flex-wrap items-center gap-2"
            aria-busy={carregandoRamos}
          >
            {Object.entries(CASOS_REAIS).map(([chave, caso]) => (
              <button
                key={chave}
                type="button"
                onClick={() =>
                  carregarCasoReal(chave as keyof typeof CASOS_REAIS)
                }
                disabled={ramos.length === 0}
                className="rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {caso.rotulo}
              </button>
            ))}
            {carregandoRamos && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Carregando ramos…
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Custo de compra (R$)
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.custoCompra}
                onChange={(e) => atualizarCampo("custoCompra", e.target.value)}
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Ramo
              </span>
              <select
                required
                value={form.ramoId}
                onChange={(e) => atualizarCampo("ramoId", e.target.value)}
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {ramos.map((ramo) => (
                  <option key={ramo.id} value={ramo.id}>
                    {ramo.rotulo}
                  </option>
                ))}
              </select>
              {ramoSelecionado && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  Alíquota sugerida: {ramoSelecionado.aliquotaSugerida}% —
                  estimativa por ramo. A precisão do centavo é trabalho do
                  contador.
                </span>
              )}
            </label>

            <fieldset className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Sua margem já inclui impostos e despesas?
              </span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="formulaTipo"
                    checked={form.formulaTipo === "markup"}
                    onChange={() => atualizarCampo("formulaTipo", "markup")}
                  />
                  Sim — uso um markup único (ex.: In-Pacto)
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="formulaTipo"
                    checked={form.formulaTipo === "multiplicador"}
                    onChange={() =>
                      atualizarCampo("formulaTipo", "multiplicador")
                    }
                  />
                  Não — calculo despesas e margem separadas (ex.:
                  EletroLondrina)
                </label>
              </div>
            </fieldset>

            {form.formulaTipo === "multiplicador" ? (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Despesa fixa (%)
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  value={form.despesaFixaPct}
                  onChange={(e) =>
                    atualizarCampo("despesaFixaPct", e.target.value)
                  }
                  className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
            ) : (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Markup (%)
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={form.markupPct}
                  onChange={(e) => atualizarCampo("markupPct", e.target.value)}
                  className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
            )}

            {form.formulaTipo === "multiplicador" && (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  Margem-alvo (%)
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  value={form.margemAlvoPct}
                  onChange={(e) =>
                    atualizarCampo("margemAlvoPct", e.target.value)
                  }
                  className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
            )}

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Margem mínima — o piso (%)
              </span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                required
                value={form.margemMinimaPct}
                onChange={(e) =>
                  atualizarCampo("margemMinimaPct", e.target.value)
                }
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Prazo de pagamento ao fornecedor (dias)
              </span>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={form.prazoPagamentoFornecedorDias}
                onChange={(e) =>
                  atualizarCampo("prazoPagamentoFornecedorDias", e.target.value)
                }
                className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Usado só no impacto no caixa (abaixo) — em quantos dias você
                costuma pagar o fornecedor.
              </span>
            </label>

            <div className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                Preço da praça (opcional) — o que a concorrência pratica
              </span>
              <div className="flex gap-3">
                <label className="flex w-1/2 flex-col gap-1">
                  <span className="sr-only">Preço da praça — mínimo</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="mínimo"
                    value={form.tetoPracaMin}
                    onChange={(e) =>
                      atualizarCampo("tetoPracaMin", e.target.value)
                    }
                    className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <label className="flex w-1/2 flex-col gap-1">
                  <span className="sr-only">Preço da praça — máximo</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="máximo"
                    value={form.tetoPracaMax}
                    onChange={(e) =>
                      atualizarCampo("tetoPracaMax", e.target.value)
                    }
                    className="w-full rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Normalmente esse dado chega no momento da venda, pelo próprio
                cliente — não precisa ter em mãos agora.
              </span>
            </div>
          </div>

          {erros.length > 0 && (
            <ul className="mt-4 list-inside list-disc rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
              {erros.map((erro) => (
                <li key={erro}>{erro}</li>
              ))}
            </ul>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="mt-5 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {carregando ? "Simulando…" : "Simular faixa viável"}
          </button>
        </form>

        {resultados && (
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Faixa viável — 2026 a 2033
              </h2>
              {ramoSimulado && (
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {ramoSimulado.rotulo}
                </span>
              )}
            </div>

            <div
              className="mb-2 flex gap-2"
              role="tablist"
              aria-label="Cenário de repasse"
            >
              {CENARIOS.map((cenario, indice) => (
                <button
                  key={cenario.valor}
                  ref={(el) => {
                    tabsCenarioRef.current[indice] = el;
                  }}
                  id={`tab-cenario-${cenario.valor}`}
                  type="button"
                  role="tab"
                  aria-selected={cenarioSelecionado === cenario.valor}
                  aria-controls="painel-cenario"
                  aria-disabled={cenarioIrrelevante}
                  tabIndex={cenarioSelecionado === cenario.valor ? 0 : -1}
                  disabled={cenarioIrrelevante}
                  onClick={() => setCenarioSelecionado(cenario.valor)}
                  onKeyDown={(e) => onCenarioTabKeyDown(e, indice)}
                  className={
                    cenarioIrrelevante
                      ? "cursor-not-allowed rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-400 dark:border-zinc-800 dark:text-zinc-600"
                      : cenarioSelecionado === cenario.valor
                        ? "rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                        : "rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  }
                >
                  {cenario.rotulo}
                </button>
              ))}
            </div>
            {cenarioIrrelevante && (
              <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
                Cenário de repasse não se aplica ao modelo de markup — nesse
                modelo o preço já é fixo por definição (custo × (1 + markup));
                quem varia é o lucro líquido, não o preço.
              </p>
            )}

            <div
              id="painel-cenario"
              role="tabpanel"
              aria-labelledby={`tab-cenario-${cenarioSelecionado}`}
            >
              <FaixaViavelChart
                resultados={resultados}
                anoSelecionado={anoSelecionado}
                onSelecionarAno={setAnoSelecionado}
              />
            </div>
          </section>
        )}

        <PainelRecomendacao
          resultado={resultadoSelecionado}
          resultados={resultados ?? []}
          descontoPedidoPct={descontoPedidoPct}
          onDescontoPedidoChange={setDescontoPedidoPct}
        />

        {impactoCaixa && impactoCaixa.length > 0 && (
          <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Impacto no caixa — crédito da compra, ano a ano
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Não é só quanto se paga de imposto, é quando esse crédito fica
              disponível. Verde: já protegido pelo split payment. Âmbar: ainda
              depende do fornecedor recolher.
            </p>

            <div className="mt-4">
              <ImpactoCaixaChart
                resultados={impactoCaixa}
                anoSelecionado={anoSelecionado}
                onSelecionarAno={setAnoSelecionado}
              />
            </div>

            {impactoCaixaSelecionado && (
              <p className="mt-4 rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                {impactoCaixaSelecionado.mensagemRecomendacao}
              </p>
            )}
          </section>
        )}

        {parametrosInfo && (
          <footer className="text-xs text-zinc-500 dark:text-zinc-400">
            Parâmetros tributários vigentes desde{" "}
            {new Date(parametrosInfo.vigencia).toLocaleDateString("pt-BR")} —{" "}
            {parametrosInfo.fonte}
          </footer>
        )}
      </main>
    </div>
  );
}
