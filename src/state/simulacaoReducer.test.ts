import { describe, expect, it } from "vitest";
import { estadoInicialSimulacao, simulacaoReducer, type SimulationResult } from "./simulacaoReducer";

const RESULTADO_FICTICIO: SimulationResult = {
  cenarios: { integral: [], gradual: [], absorcao: [] },
  impactoCaixa: null,
  ramo: null,
  formulaTipo: "multiplicador",
  custoCompra: 100,
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
