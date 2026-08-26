"use client";

/**
 * Provedor do estado de simulação — a camada de orquestração pedida na
 * evolução arquitetural (ver CLAUDE.md). Segura o `useReducer`, busca os
 * catálogos (`GET /api/ramos`, `GET /api/parametros`) e expõe as ações que
 * a UI pode disparar. `page.tsx` (e futuramente as telas do wizard) só
 * chamam essas ações — não sabem como o estado é calculado nem persistido.
 *
 * Reaproveita `simularTresCenarios` (src/lib/simulacaoCliente.ts) e
 * `calcularImpactoCaixa` (src/lib/motor.ts) sem alterar nenhum dos dois.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { calcularImpactoCaixa, type CenarioRepasse } from "@/lib/motor";
import { simularTresCenarios } from "@/lib/simulacaoCliente";
import {
  estadoInicialSimulacao,
  simulacaoReducer,
  type EtapaWizard,
  type ParametroInfo,
  type Ramo,
  type SimulationAction,
  type SimulationFormState,
  type SimulationState,
} from "./simulacaoReducer";
import { montarEntradaBruta, numOrUndefined } from "./validacaoEtapas";

interface SimulationContextValue {
  state: SimulationState;
  atualizarCampoForm: <K extends keyof SimulationFormState>(
    campo: K,
    valor: SimulationFormState[K],
  ) => void;
  carregarCasoReal: (form: SimulationFormState) => void;
  executarSimulacao: () => Promise<void>;
  selecionarCenario: (cenario: CenarioRepasse) => void;
  selecionarAno: (ano: number) => void;
  alterarDescontoPedido: (percentual: number) => void;
  /** Navega entre as etapas do wizard (Voltar/Continuar/"Editar dados"). Nunca aponta para "resultado" — essa transição só acontece via `executarSimulacao`. */
  irParaEtapa: (etapa: EtapaWizard) => void;
  /** Bloqueia o avanço da etapa atual, mostrando os erros de progressão (não é falha de simulação). */
  reportarErrosEtapa: (erros: string[]) => void;
  /** Começa do zero: form volta ao inicial, resultado anterior é descartado. */
  novaSimulacao: () => void;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(simulacaoReducer, estadoInicialSimulacao);

  // Protege contra respostas obsoletas: uma simulação (ou "carregar caso
  // real") mais recente invalida qualquer cálculo ainda em andamento. Antes
  // da Fase 6 isso protegia contra corrida entre requisições HTTP; agora
  // protege contra o yield de `executarSimulacao` (ver abaixo) ser
  // ultrapassado por uma ação mais nova do usuário nesse meio-tempo.
  const requisicaoIdRef = useRef(0);

  useEffect(() => {
    let cancelado = false;

    fetch("/api/ramos")
      .then((r) => {
        if (!r.ok) throw new Error("resposta não-ok");
        return r.json();
      })
      .then((data: Ramo[]) => {
        if (!cancelado) dispatch({ type: "CATALOGO_RAMOS_CARREGADOS", ramos: data });
      })
      .catch(() => {
        if (!cancelado) {
          dispatch({
            type: "CATALOGO_RAMOS_ERRO",
            mensagem: "Não foi possível carregar os ramos. Recarregue a página.",
          });
        }
      });

    fetch("/api/parametros")
      .then((r) => {
        if (!r.ok) throw new Error("resposta não-ok");
        return r.json();
      })
      .then((data: ParametroInfo[]) => {
        if (!cancelado) dispatch({ type: "CATALOGO_PARAMETROS_CARREGADOS", parametros: data });
      })
      .catch(() => {
        if (!cancelado) {
          dispatch({
            type: "CATALOGO_PARAMETROS_ERRO",
            mensagem: "Não foi possível carregar os parâmetros tributários. Recarregue a página.",
          });
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  const atualizarCampoForm = useCallback(
    <K extends keyof SimulationFormState>(campo: K, valor: SimulationFormState[K]) => {
      // O reducer não consegue amarrar `campo`↔`valor` genericamente num
      // union de ações — a segurança de tipo real está na assinatura desta
      // função, que é a única porta de entrada usada pela UI.
      dispatch({ type: "FORM_CAMPO_ALTERADO", campo, valor } as SimulationAction);
    },
    [],
  );

  const carregarCasoReal = useCallback((form: SimulationFormState) => {
    requisicaoIdRef.current += 1; // invalida qualquer simulação ainda em voo
    dispatch({ type: "FORM_CASO_REAL_CARREGADO", form });
  }, []);

  const selecionarCenario = useCallback((cenario: CenarioRepasse) => {
    dispatch({ type: "CENARIO_SELECIONADO", cenario });
  }, []);

  const selecionarAno = useCallback((ano: number) => {
    dispatch({ type: "ANO_SELECIONADO", ano });
  }, []);

  const alterarDescontoPedido = useCallback((percentual: number) => {
    dispatch({ type: "DESCONTO_PEDIDO_ALTERADO", percentual });
  }, []);

  const irParaEtapa = useCallback((etapa: EtapaWizard) => {
    dispatch({ type: "ETAPA_ALTERADA", etapa });
  }, []);

  const reportarErrosEtapa = useCallback((erros: string[]) => {
    dispatch({ type: "ETAPA_VALIDACAO_FALHOU", erros });
  }, []);

  const novaSimulacao = useCallback(() => {
    dispatch({ type: "NOVA_SIMULACAO" });
  }, []);

  const executarSimulacao = useCallback(async () => {
    dispatch({ type: "SIMULACAO_INICIADA" });
    const idRequisicao = (requisicaoIdRef.current += 1);

    // Mesma conversão form → payload usada pela validação de progressão do
    // wizard (src/state/validacaoEtapas.ts) — um único lugar.
    const corpo = montarEntradaBruta(state.form);
    // Snapshot do que está sendo simulado, tirado antes do yield abaixo —
    // se o usuário mudar o form (ou clicar "carregar caso real") nesse
    // intervalo, o resultado ainda precisa refletir o que foi de fato
    // submetido, não o form ao vivo.
    const ramoDoSubmit = state.catalogo.ramos.find((r) => r.id === state.form.ramoId) ?? null;
    const formulaTipoDoSubmit = state.form.formulaTipo;
    const custoCompraDoSubmit = numOrUndefined(state.form.custoCompra);
    const prazoPagamentoFornecedorDiasDoSubmit = numOrUndefined(
      state.form.prazoPagamentoFornecedorDias,
    );
    const parametrosDoSubmit = state.catalogo.parametros;

    // simular() roda no cliente e é síncrono/rápido (µs) — sem este yield,
    // o React nunca chegaria a pintar "Calculando…" antes do cálculo já ter
    // terminado. setTimeout(0) força um ciclo de paint entre a chamada e o
    // cálculo, sem adicionar delay perceptível.
    await new Promise((resolve) => setTimeout(resolve, 0));

    if (requisicaoIdRef.current !== idRequisicao) return; // invalidado enquanto esperava o paint

    try {
      const resultado = simularTresCenarios(corpo, parametrosDoSubmit);

      if (requisicaoIdRef.current !== idRequisicao) return; // obsoleto, ignorar

      if (!resultado.ok) {
        dispatch({ type: "SIMULACAO_FALHOU", erros: resultado.erros });
        return;
      }

      // Impacto no caixa (Fase 5) já rodava no cliente — sem mudança aqui,
      // só passou a compartilhar o mesmo snapshot de submit acima.
      const impactoCaixa =
        custoCompraDoSubmit !== undefined &&
        prazoPagamentoFornecedorDiasDoSubmit !== undefined &&
        parametrosDoSubmit.length > 0
          ? calcularImpactoCaixa(
              custoCompraDoSubmit,
              prazoPagamentoFornecedorDiasDoSubmit,
              parametrosDoSubmit,
            )
          : null;

      dispatch({
        type: "SIMULACAO_CONCLUIDA",
        resultado: {
          cenarios: resultado.cenarios,
          impactoCaixa,
          ramo: ramoDoSubmit
            ? { rotulo: ramoDoSubmit.rotulo, aliquotaSugerida: ramoDoSubmit.aliquotaSugerida }
            : null,
          formulaTipo: formulaTipoDoSubmit,
          // custoCompraDoSubmit é garantido definido aqui: se estivesse
          // vazio/inválido, validarEntradaSimulacao (dentro de
          // simularTresCenarios) já teria retornado ok:false antes deste
          // ponto — mesmo padrão de asserção já usado em motor.ts para
          // campos validados upstream.
          custoCompra: custoCompraDoSubmit as number,
        },
      });
    } catch (erro) {
      if (requisicaoIdRef.current !== idRequisicao) return;
      const mensagem = erro instanceof Error ? erro.message : "Erro inesperado ao simular.";
      dispatch({ type: "SIMULACAO_FALHOU", erros: [mensagem] });
    }
  }, [state.form, state.catalogo.ramos, state.catalogo.parametros]);

  const value: SimulationContextValue = {
    state,
    atualizarCampoForm,
    carregarCasoReal,
    executarSimulacao,
    selecionarCenario,
    selecionarAno,
    alterarDescontoPedido,
    irParaEtapa,
    reportarErrosEtapa,
    novaSimulacao,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation(): SimulationContextValue {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error("useSimulation precisa ser usado dentro de <SimulationProvider>.");
  }
  return context;
}

export type { SimulationState };
