"use client";

import { useSimulation } from "@/state/SimulationProvider";
import { errosDaEtapa, numOrUndefined } from "@/state/validacaoEtapas";
import type { EtapaWizard, SimulationFormState } from "@/state/simulacaoReducer";
import { decidirAcaoEnter } from "./decisaoEnter";
import { IndicadorEtapas } from "./IndicadorEtapas";
import { EtapaOperacao } from "./EtapaOperacao";
import { EtapaMargens } from "./EtapaMargens";
import { EtapaMercado } from "./EtapaMercado";

const ORDEM_ETAPAS: EtapaWizard[] = ["operacao", "margens", "mercado"];

/** Casos reais das entrevistas (docs/00, seção 6; prisma/seed.ts) — atalhos de demonstração, só na primeira etapa. */
const CASOS_REAIS: Record<
  string,
  { rotulo: string; ramoChave: string; form: Omit<SimulationFormState, "ramoId"> }
> = {
  eletrolondrina: {
    rotulo: "EletroLondrina",
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
    rotulo: "Grupo In-Pacto",
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

/**
 * Orquestra as 3 etapas de coleta. Não é o "Resultado" — esse vive em
 * ResultadoSimulacao, montado por SimuladorPage quando a simulação termina
 * (ver CLAUDE.md, "'Resultado' não é uma quarta etapa de formulário").
 * Container/hierarquia/tokens redesenhados (Real Tech Identity); fluxo,
 * estado, validação e ações continuam exatamente os mesmos de antes.
 */
export function SimulacaoWizard() {
  const {
    state,
    carregarCasoReal,
    irParaEtapa,
    reportarErrosEtapa,
    executarSimulacao,
    novaSimulacao,
  } = useSimulation();
  const { form, ui, catalogo } = state;

  // Salvaguarda de tipo: SimuladorPage só renderiza este componente quando
  // `etapaAtual` não é "resultado", mas o tipo de `ui.etapaAtual` inclui
  // "resultado" — sem isso o TS não consegue estreitar para EtapaWizard.
  const etapa: EtapaWizard = ui.etapaAtual === "resultado" ? "operacao" : ui.etapaAtual;
  const indiceAtual = ORDEM_ETAPAS.indexOf(etapa);
  const eUltimaEtapa = etapa === "mercado";

  function errosDaEtapaAtual(): string[] {
    if (etapa === "margens") {
      const erros = errosDaEtapa("margens", form);
      if (numOrUndefined(form.prazoPagamentoFornecedorDias) === undefined) {
        return [...erros, "Informe o prazo de pagamento ao fornecedor, em dias."];
      }
      return erros;
    }
    return errosDaEtapa(etapa, form);
  }

  function aoContinuar() {
    const erros = errosDaEtapaAtual();
    if (erros.length > 0) {
      reportarErrosEtapa(erros);
      return;
    }
    const proximaEtapa = ORDEM_ETAPAS[indiceAtual + 1];
    if (proximaEtapa) irParaEtapa(proximaEtapa);
  }

  function aoVoltar() {
    const etapaAnterior = ORDEM_ETAPAS[indiceAtual - 1];
    if (etapaAnterior) irParaEtapa(etapaAnterior);
  }

  function aoCarregarCasoReal(chave: keyof typeof CASOS_REAIS) {
    const caso = CASOS_REAIS[chave];
    const ramo = catalogo.ramos.find((r) => r.chave === caso.ramoChave);
    if (!ramo) return;
    carregarCasoReal({ ramoId: ramo.id, ...caso.form });
  }

  async function aoSubmeter(evento: React.FormEvent) {
    evento.preventDefault();
    // Guarda de verdade contra pular a Etapa Mercado: o handler de Enter
    // (abaixo) cobre o gatilho mais comum de submit espúrio, mas o próprio
    // `onSubmit` do <form> pode disparar por qualquer outro motivo (ex.: um
    // clique que caia sobre o botão de submit no instante em que ele troca
    // de "Continuar" para "Simular"). `aoSubmeter` não deve confiar que
    // "onSubmit disparou" implica "o usuário está no Mercado" — só
    // `executarSimulacao()` quando isso for realmente verdade.
    if (!eUltimaEtapa) return;
    await executarSimulacao();
  }

  // Causa raiz do bug de pular a Etapa Mercado: o wizard inteiro é um único
  // <form>, e o navegador submete um <form> ao apertar Enter num campo
  // mesmo sem nenhum <button type="submit"> presente no DOM naquele
  // momento (só existe na última etapa). Fora da última etapa, Enter deve
  // significar o mesmo que o botão "Continuar" visível — nunca "Simular".
  function aoTeclarNoFormulario(evento: React.KeyboardEvent<HTMLFormElement>) {
    if (evento.key !== "Enter") return;
    const alvo = evento.target as HTMLElement;
    const acao = decidirAcaoEnter({ eUltimaEtapa, tagNameAlvo: alvo.tagName });
    if (acao === "ignorar" || acao === "submeter-nativo") return;
    evento.preventDefault();
    aoContinuar();
  }

  return (
    <form
      onSubmit={aoSubmeter}
      onKeyDown={aoTeclarNoFormulario}
      className="rounded-xl border border-border bg-surface p-6 sm:p-8"
    >
      {etapa === "operacao" && (
        <div
          className="mb-6 flex flex-wrap items-center gap-2"
          aria-busy={catalogo.carregandoRamos}
        >
          <span className="text-xs text-muted">Começar com um exemplo:</span>
          {Object.entries(CASOS_REAIS).map(([chave, caso]) => (
            <button
              key={chave}
              type="button"
              onClick={() => aoCarregarCasoReal(chave as keyof typeof CASOS_REAIS)}
              disabled={catalogo.ramos.length === 0}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-text-secondary hover:text-text-secondary disabled:opacity-50"
            >
              {caso.rotulo}
            </button>
          ))}
          {catalogo.carregandoRamos && (
            <span className="text-xs text-muted">Carregando ramos…</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          Etapa {indiceAtual + 1} de {ORDEM_ETAPAS.length}
        </p>
        <button
          type="button"
          onClick={novaSimulacao}
          className="text-xs text-muted transition-colors hover:text-text-secondary"
        >
          Nova simulação
        </button>
      </div>

      <div className="mt-3">
        <IndicadorEtapas etapaAtual={etapa} />
      </div>

      <div className="mt-8">
        {etapa === "operacao" && <EtapaOperacao />}
        {etapa === "margens" && <EtapaMargens />}
        {etapa === "mercado" && <EtapaMercado />}
      </div>

      {ui.erros.length > 0 && (
        <ul className="mt-6 list-inside list-disc rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">
          {ui.erros.map((erro) => (
            <li key={erro}>{erro}</li>
          ))}
        </ul>
      )}

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
        {indiceAtual > 0 ? (
          <button
            type="button"
            onClick={aoVoltar}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-background hover:text-text-primary"
          >
            ← Voltar
          </button>
        ) : (
          <span aria-hidden="true" />
        )}

        {eUltimaEtapa ? (
          <button
            type="submit"
            disabled={ui.isSimulating || catalogo.parametros.length === 0}
            className="rounded-lg bg-text-primary px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {ui.isSimulating ? "Calculando…" : "Simular faixa viável"}
          </button>
        ) : (
          <button
            type="button"
            onClick={aoContinuar}
            className="rounded-lg bg-text-primary px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Continuar →
          </button>
        )}
      </div>
    </form>
  );
}
