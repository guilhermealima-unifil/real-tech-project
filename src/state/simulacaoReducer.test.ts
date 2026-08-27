import { describe, expect, it } from "vitest";
import {
  estadoInicialSimulacao,
  simulacaoReducer,
  type SimulationFormState,
  type SimulationResult,
} from "./simulacaoReducer";

const RESULTADO_FICTICIO: SimulationResult = {
  cenarios: { integral: [], gradual: [], absorcao: [] },
  impactoCaixa: null,
  ramo: null,
  formulaTipo: "multiplicador",
  custoCompra: 100,
  entradaSnapshot: {
    despesaFixaPct: 20,
    markupPct: null,
    margemAlvoPct: 35,
    margemMinimaPct: 30,
    tetoPracaMin: null,
    tetoPracaMax: null,
    prazoPagamentoFornecedorDias: 30,
  },
};

describe("simulacaoReducer — contrato de progressão do wizard (regressão: pular a Etapa Mercado)", () => {
  it("segue operacao -> margens -> mercado -> resultado só quando a simulação conclui com sucesso", () => {
    let estado = estadoInicialSimulacao;
    expect(estado.ui.etapaAtual).toBe("operacao");

    estado = simulacaoReducer(estado, { type: "ETAPA_ALTERADA", etapa: "margens" });
    expect(estado.ui.etapaAtual).toBe("margens");
    expect(estado.resultado).toBeNull();

    estado = simulacaoReducer(estado, { type: "ETAPA_ALTERADA", etapa: "mercado" });
    expect(estado.ui.etapaAtual).toBe("mercado");
    expect(estado.resultado).toBeNull();

    estado = simulacaoReducer(estado, {
      type: "SIMULACAO_CONCLUIDA",
      resultado: RESULTADO_FICTICIO,
    });
    expect(estado.ui.etapaAtual).toBe("resultado");
    expect(estado.resultado).not.toBeNull();
  });

  it("ETAPA_ALTERADA nunca leva direto a 'resultado' — só SIMULACAO_CONCLUIDA faz isso", () => {
    // ETAPA_ALTERADA é tipado para aceitar só EtapaWizard ("operacao" |
    // "margens" | "mercado"), nunca "resultado" — o teste documenta essa
    // garantia em runtime, não só em tipo.
    let estado = estadoInicialSimulacao;
    estado = simulacaoReducer(estado, { type: "ETAPA_ALTERADA", etapa: "margens" });
    estado = simulacaoReducer(estado, { type: "ETAPA_ALTERADA", etapa: "mercado" });
    expect(estado.ui.etapaAtual).not.toBe("resultado");
    expect(estado.resultado).toBeNull();
  });

  it("SIMULACAO_FALHOU não altera etapaAtual — não empurra o usuário para 'resultado' nem para outra etapa", () => {
    let estado = estadoInicialSimulacao;
    estado = simulacaoReducer(estado, { type: "ETAPA_ALTERADA", etapa: "margens" });
    estado = simulacaoReducer(estado, { type: "SIMULACAO_FALHOU", erros: ["algum erro"] });
    expect(estado.ui.etapaAtual).toBe("margens");
    expect(estado.resultado).toBeNull();
  });
});

describe("simulacaoReducer — 'Nova a partir desta' (FORM_CASO_REAL_CARREGADO + ETAPA_ALTERADA vindos de fora do wizard)", () => {
  const FORM_DO_HISTORICO: SimulationFormState = {
    ramoId: "ramo-eletro",
    custoCompra: "150",
    formulaTipo: "multiplicador",
    despesaFixaPct: "22",
    markupPct: "",
    margemAlvoPct: "40",
    margemMinimaPct: "32",
    tetoPracaMin: "",
    tetoPracaMax: "",
    prazoPagamentoFornecedorDias: "45",
  };

  it("carrega o form do histórico e volta para 'operacao' mesmo partindo de um estado 'resultado' de uma sessão anterior — não fica preso na etapa em que o usuário tinha parado antes", () => {
    // Simula o usuário chegando em /historico/[id] com `ui.etapaAtual`
    // ainda "resultado" de uma simulação anterior (o cenário real que
    // NovaAPartirDesta.tsx precisa neutralizar navegando de fora do
    // wizard, ao contrário de "Começar com um exemplo", que só aparece já
    // dentro da Etapa Operação).
    let estado = simulacaoReducer(estadoInicialSimulacao, {
      type: "SIMULACAO_CONCLUIDA",
      resultado: RESULTADO_FICTICIO,
    });
    expect(estado.ui.etapaAtual).toBe("resultado");
    expect(estado.resultado).not.toBeNull();

    // Mesma sequência de NovaAPartirDesta.tsx: carregarCasoReal() + irParaEtapa("operacao").
    estado = simulacaoReducer(estado, { type: "FORM_CASO_REAL_CARREGADO", form: FORM_DO_HISTORICO });
    estado = simulacaoReducer(estado, { type: "ETAPA_ALTERADA", etapa: "operacao" });

    expect(estado.ui.etapaAtual).toBe("operacao");
    expect(estado.resultado).toBeNull();
    expect(estado.form).toEqual(FORM_DO_HISTORICO);
    expect(estado.ui.erros).toEqual([]);
    expect(estado.ui.descontoPedidoPct).toBe(0);
  });

  it("FORM_CASO_REAL_CARREGADO substitui o form inteiro — nenhum campo do form anterior sobrevive misturado ao novo", () => {
    let estado = simulacaoReducer(estadoInicialSimulacao, {
      type: "FORM_CAMPO_ALTERADO",
      campo: "custoCompra",
      valor: "999",
    });
    estado = simulacaoReducer(estado, { type: "FORM_CASO_REAL_CARREGADO", form: FORM_DO_HISTORICO });

    expect(estado.form).toEqual(FORM_DO_HISTORICO);
    expect(estado.form.custoCompra).toBe("150"); // não "999"
  });
});
