/**
 * Estado da simulação, separado em três grupos conceituais pedidos na
 * evolução arquitetural (ver CLAUDE.md): dados do formulário, resultado da
 * última simulação bem-sucedida, e estado de UI (seleção/interação) — mais
 * um quarto grupo, dados de catálogo (ramos/parâmetros vindos do banco via
 * GET), que não é preenchido pelo usuário nem produzido pelo motor.
 *
 * Reducer puro, sem import de React: só descreve como o estado muda, nunca
 * quando/por quê (isso fica em SimulationProvider.tsx). Não duplica nenhuma
 * regra de negócio — quem decide o resultado continua sendo
 * src/lib/simulacaoCliente.ts (que reaproveita src/lib/motor.ts e
 * src/lib/validacao.ts, intocados).
 */

import type {
  CenarioRepasse,
  FormulaTipo,
  ImpactoCaixaAno,
  ParametroTributarioAno,
  ResultadoAno,
} from "@/lib/motor";

export interface Ramo {
  id: string;
  chave: string;
  rotulo: string;
  aliquotaSugerida: number;
}

export interface ParametroInfo extends ParametroTributarioAno {
  vigencia: string;
  fonte: string;
}

/** 1. Dados da simulação — o que o usuário está preenchendo no formulário. */
export interface SimulationFormState {
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

export const FORM_INICIAL: SimulationFormState = {
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

/**
 * 2. Resultado da simulação — snapshot atômico da última simulação
 * bem-sucedida. Fica separado de `form`: o usuário pode editar o form à
 * vontade sem que `resultado` mude, até rodar uma nova simulação.
 */
export interface SimulationResult {
  cenarios: Record<CenarioRepasse, ResultadoAno[]>;
  impactoCaixa: ImpactoCaixaAno[] | null;
  ramo: { rotulo: string; aliquotaSugerida: number } | null;
  formulaTipo: FormulaTipo;
  /** Custo de compra usado nesta simulação — precisa acompanhar o snapshot para cálculos derivados de apresentação (ex.: margem após desconto) não dependerem do `form` ao vivo. */
  custoCompra: number;
}

/**
 * As 3 etapas do wizard de coleta, mais o destino "resultado" — que não é
 * uma quarta etapa de formulário, é a área de análise/decisão para onde o
 * wizard entrega o usuário depois de simular (ver CLAUDE.md).
 */
export type EtapaWizard = "operacao" | "margens" | "mercado";
export type EtapaSimulacao = EtapaWizard | "resultado";

/**
 * 3. Estado de UI — seleção/interação sobre os dados acima. Não sabe nada
 * de apresentação (não sabe que `descontoPedidoPct` vira um `<input
 * type="range">`, nem que `cenarioSelecionado` vira abas): isso é
 * responsabilidade de quem consome o estado.
 */
export interface SimulationUiState {
  isSimulating: boolean;
  erros: string[];
  cenarioSelecionado: CenarioRepasse;
  anoSelecionado: number;
  descontoPedidoPct: number;
  etapaAtual: EtapaSimulacao;
}

/** Dados de catálogo (GET /api/ramos, GET /api/parametros) — referência. */
export interface SimulationCatalogState {
  ramos: Ramo[];
  parametros: ParametroInfo[];
  carregandoRamos: boolean;
}

export interface SimulationState {
  form: SimulationFormState;
  resultado: SimulationResult | null;
  ui: SimulationUiState;
  catalogo: SimulationCatalogState;
}

export const ANO_BASE = 2026;

export const estadoInicialSimulacao: SimulationState = {
  form: FORM_INICIAL,
  resultado: null,
  ui: {
    isSimulating: false,
    erros: [],
    cenarioSelecionado: "integral",
    anoSelecionado: ANO_BASE,
    descontoPedidoPct: 0,
    etapaAtual: "operacao",
  },
  catalogo: {
    ramos: [],
    parametros: [],
    carregandoRamos: true,
  },
};

export type SimulationAction =
  | { type: "CATALOGO_RAMOS_CARREGADOS"; ramos: Ramo[] }
  | { type: "CATALOGO_RAMOS_ERRO"; mensagem: string }
  | { type: "CATALOGO_PARAMETROS_CARREGADOS"; parametros: ParametroInfo[] }
  | { type: "CATALOGO_PARAMETROS_ERRO"; mensagem: string }
  | {
      type: "FORM_CAMPO_ALTERADO";
      campo: keyof SimulationFormState;
      valor: SimulationFormState[keyof SimulationFormState];
    }
  | { type: "FORM_CASO_REAL_CARREGADO"; form: SimulationFormState }
  | { type: "SIMULACAO_INICIADA" }
  | { type: "SIMULACAO_CONCLUIDA"; resultado: SimulationResult }
  | { type: "SIMULACAO_FALHOU"; erros: string[] }
  | { type: "CENARIO_SELECIONADO"; cenario: CenarioRepasse }
  | { type: "ANO_SELECIONADO"; ano: number }
  | { type: "DESCONTO_PEDIDO_ALTERADO"; percentual: number }
  | { type: "ETAPA_ALTERADA"; etapa: EtapaWizard }
  | { type: "ETAPA_VALIDACAO_FALHOU"; erros: string[] }
  | { type: "NOVA_SIMULACAO" };

export function simulacaoReducer(
  state: SimulationState,
  action: SimulationAction,
): SimulationState {
  switch (action.type) {
    case "CATALOGO_RAMOS_CARREGADOS":
      return {
        ...state,
        catalogo: { ...state.catalogo, ramos: action.ramos, carregandoRamos: false },
      };

    case "CATALOGO_RAMOS_ERRO":
      return {
        ...state,
        catalogo: { ...state.catalogo, carregandoRamos: false },
        ui: { ...state.ui, erros: [...state.ui.erros, action.mensagem] },
      };

    case "CATALOGO_PARAMETROS_CARREGADOS":
      return {
        ...state,
        catalogo: { ...state.catalogo, parametros: action.parametros },
      };

    case "CATALOGO_PARAMETROS_ERRO":
      return {
        ...state,
        ui: { ...state.ui, erros: [...state.ui.erros, action.mensagem] },
      };

    case "FORM_CAMPO_ALTERADO":
      return {
        ...state,
        form: { ...state.form, [action.campo]: action.valor },
      };

    // "Carregar caso real": troca o form inteiro e descarta qualquer
    // resultado anterior — mesmo comportamento de antes (não é uma
    // simulação nova rodando, é uma limpeza explícita de tela).
    case "FORM_CASO_REAL_CARREGADO":
      return {
        ...state,
        form: action.form,
        resultado: null,
        ui: { ...state.ui, erros: [], descontoPedidoPct: 0 },
      };

    case "SIMULACAO_INICIADA":
      return { ...state, ui: { ...state.ui, isSimulating: true, erros: [] } };

    // Sucesso: sai do wizard e entrega o usuário na área de resultado —
    // "resultado" não é uma quarta etapa de formulário, é o destino da
    // simulação (ver CLAUDE.md).
    case "SIMULACAO_CONCLUIDA":
      return {
        ...state,
        resultado: action.resultado,
        ui: {
          ...state.ui,
          isSimulating: false,
          cenarioSelecionado: "integral",
          anoSelecionado: ANO_BASE,
          descontoPedidoPct: 0,
          etapaAtual: "resultado",
        },
      };

    // Mesmo comportamento de antes: uma simulação que falha (entrada
    // inválida) descarta o resultado anterior, não só mostra o erro por
    // cima dele.
    case "SIMULACAO_FALHOU":
      return {
        ...state,
        resultado: null,
        ui: { ...state.ui, isSimulating: false, erros: action.erros },
      };

    case "CENARIO_SELECIONADO":
      return { ...state, ui: { ...state.ui, cenarioSelecionado: action.cenario } };

    case "ANO_SELECIONADO":
      return { ...state, ui: { ...state.ui, anoSelecionado: action.ano } };

    case "DESCONTO_PEDIDO_ALTERADO":
      return { ...state, ui: { ...state.ui, descontoPedidoPct: action.percentual } };

    // Navegação entre etapas do wizard (Voltar/Continuar/"Editar dados").
    // Nunca toca em `form` nem em `resultado` — só troca qual etapa está
    // visível, limpando erros de uma tentativa de avanço anterior.
    case "ETAPA_ALTERADA":
      return { ...state, ui: { ...state.ui, etapaAtual: action.etapa, erros: [] } };

    // Etapa atual tem campo obrigatório inválido — bloqueia o avanço e
    // reaproveita o mesmo espaço de erros já usado pela simulação, sem
    // tocar em `resultado` (não é uma simulação que falhou).
    case "ETAPA_VALIDACAO_FALHOU":
      return { ...state, ui: { ...state.ui, erros: action.erros } };

    // "Nova simulação": diferente de "Editar dados" (que preserva tudo),
    // aqui o pedido é começar do zero — form volta ao estado inicial e o
    // resultado anterior é descartado. Dados de catálogo (`catalogo`) não
    // são tocados, não são "da simulação".
    case "NOVA_SIMULACAO":
      return {
        ...state,
        form: FORM_INICIAL,
        resultado: null,
        ui: {
          isSimulating: false,
          erros: [],
          cenarioSelecionado: "integral",
          anoSelecionado: ANO_BASE,
          descontoPedidoPct: 0,
          etapaAtual: "operacao",
        },
      };

    default:
      return state;
  }
}
