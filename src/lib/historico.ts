/**
 * Camada de acesso a dados do histórico de simulações — centraliza a
 * checagem de ownership (userId) num único lugar, reaproveitado por
 * GET /api/simulacoes, GET /api/simulacoes/[id] e pelas páginas
 * /historico e /historico/[id] (Server Components não precisam refazer um
 * round-trip HTTP para a própria API para ler os mesmos dados). Só leitura
 * — a escrita (POST) fica em src/app/api/simulacoes/route.ts, que já tem
 * a validação estrutural do payload.
 *
 * Nenhuma função aqui recalcula `simular()`: os valores voltam exatamente
 * como foram gravados.
 */

import { cache } from "react";
import prisma from "./prisma";
import { classificarStatusPreco, type StatusPreco } from "./analiseResultado";
import type { CenarioRepasse, FormulaTipo, ImpactoCaixaAno, ResultadoAno } from "./motor";

const CENARIO_PRINCIPAL: CenarioRepasse = "integral";

/**
 * Nome de exibição de uma simulação salva — "Geladeira Electrolux 480L"
 * quando o usuário informou um nome ao salvar (dialog "Salvar simulação",
 * ver src/components/simulacao/SalvarSimulacao.tsx); nunca mostra
 * `null`/string vazia para registros salvos antes desta etapa (ou os 2 de
 * seed) — cai para um rótulo derivado do ramo, nunca para um texto
 * genérico tipo "Sem nome". Função pura, sem acesso a banco: só decide
 * como exibir o que `nomeProduto`/`ramoRotulo` já trazem.
 */
export function nomeExibicaoSimulacao(nomeProduto: string | null, ramoRotulo: string | null): string {
  if (nomeProduto && nomeProduto.trim().length > 0) return nomeProduto;
  return ramoRotulo ? `Simulação de ${ramoRotulo}` : "Simulação salva";
}

/**
 * Rótulo/classe de apresentação de cada `StatusPreco` — movido de
 * src/app/historico/page.tsx para cá (mesmo valor, só um novo lugar) para
 * a Home (src/app/page.tsx) reutilizar sem duplicar o mapeamento. Só
 * strings — nenhuma dependência de React/JSX, cabe num módulo "lib" como
 * qualquer outra constante.
 */
export const ROTULO_STATUS_PRECO: Record<StatusPreco, { rotulo: string; classe: string }> = {
  abaixo_piso: { rotulo: "Abaixo do piso", classe: "bg-danger/10 text-danger" },
  dentro_da_faixa: { rotulo: "Dentro da faixa viável", classe: "bg-success/10 text-success" },
  acima_teto: { rotulo: "Acima do teto da praça", classe: "bg-warning/10 text-warning" },
  faixa_inviavel: { rotulo: "Faixa inviável", classe: "bg-danger/10 text-danger" },
};

export interface SimulacaoResumo {
  id: string;
  createdAt: string;
  nomeProduto: string | null;
  ramoRotulo: string | null;
  formulaTipo: string;
  custoCompra: number;
  cenarioPrincipal: CenarioRepasse;
  anoPrincipal: number | null;
  /** Preço que a estratégia (ano-base do cenário "integral") produz — ver `ResultadoAno.preco`, nunca uma correção automática de piso. */
  precoAnalisado: number | null;
  status: StatusPreco | null;
  alertaDisparado: boolean;
}

/** Lista só as simulações do usuário informado, mais recentes primeiro. */
export async function listarSimulacoesDoUsuario(userId: string): Promise<SimulacaoResumo[]> {
  const simulacoes = await prisma.simulacao.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      nomeProduto: true,
      ramoRotulo: true,
      formulaTipo: true,
      custoCompra: true,
      resultados: {
        where: { cenario: CENARIO_PRINCIPAL },
        orderBy: { ano: "asc" },
        take: 1,
      },
    },
  });

  return simulacoes.map((s) => {
    const anchor = s.resultados[0];
    let resultadoAno: ResultadoAno | null = null;
    if (anchor) {
      resultadoAno = {
        ano: anchor.ano,
        preco: Number(anchor.preco),
        margemResultante: Number(anchor.margemResultante),
        tributoTotalPct: Number(anchor.tributoTotalPct),
        piso: Number(anchor.piso),
        teto: anchor.teto !== null ? Number(anchor.teto) : null,
        descontoMaximoPct: anchor.descontoMaximoPct !== null ? Number(anchor.descontoMaximoPct) : null,
        alertaDisparado: anchor.alertaDisparado,
        mensagemRecomendacao: anchor.mensagemRecomendacao,
      };
    }

    return {
      id: s.id,
      createdAt: s.createdAt.toISOString(),
      nomeProduto: s.nomeProduto,
      ramoRotulo: s.ramoRotulo,
      formulaTipo: s.formulaTipo,
      custoCompra: Number(s.custoCompra),
      cenarioPrincipal: CENARIO_PRINCIPAL,
      anoPrincipal: resultadoAno?.ano ?? null,
      precoAnalisado: resultadoAno?.preco ?? null,
      status: resultadoAno ? classificarStatusPreco(resultadoAno.preco, resultadoAno.piso, resultadoAno.teto) : null,
      alertaDisparado: resultadoAno?.alertaDisparado ?? false,
    };
  });
}

export type TipoAlertaSimulacao = "faixa_inviavel" | "abaixo_piso" | "margem_abaixo_minima";

export interface AlertaSimulacao {
  simulacaoId: string;
  tipo: TipoAlertaSimulacao;
  nomeExibicao: string;
  mensagem: string;
}

/**
 * Deriva alertas de uma simulação salva para a Home (src/app/page.tsx) —
 * SEM chamar `simular()` nem recalcular piso/margem: usa só `status`
 * (`classificarStatusPreco`) e `alertaDisparado`, os dois já persistidos
 * por linha em `ResultadoAnual` no momento do salvamento (ver
 * `listarSimulacoesDoUsuario` acima e `simular()` em motor.ts, que já
 * calcula `alertaDisparado = (teto !== null && piso > teto) ||
 * margemResultante < margemMinimaPct`). Função pura: só lê o
 * `SimulacaoResumo` que já foi montado, nada de I/O aqui.
 *
 * No máximo 1 alerta por simulação — `SimulacaoResumo` só carrega o
 * ano-base (2026) do cenário "integral" (mesma convenção já usada pelo
 * histórico), então só há um status/alertaDisparado para avaliar por
 * simulação. Prioridade quando mais de uma condição bate ao mesmo tempo
 * (da mais grave para a mais branda):
 *
 * 1. `"faixa_inviavel"` — `status` já classificado como piso > teto: não
 *    existe preço nenhum que satisfaça as duas restrições ao mesmo tempo.
 * 2. `"abaixo_piso"` — `status` já classificado como preço < piso: a
 *    margem mínima configurada já está sendo furada no preço analisado.
 * 3. `"margem_abaixo_minima"` — nenhum dos dois casos acima, mas
 *    `alertaDisparado` é `true`: acontece sobretudo no modelo markup
 *    (preço fixo por definição — Teste 4 da suíte de aceitação do motor —
 *    então nunca cai em "abaixo_piso"/"faixa_inviavel" por preço, mas a
 *    margem resultante já caiu abaixo do mínimo configurado). Sem este
 *    terceiro caso, esse cenário nunca apareceria como alerta na Home.
 *
 * Nenhuma outra condição vira alerta aqui — em especial, "desconto pedido
 * acima do limite seguro" (citado como exemplo no pedido desta etapa)
 * NUNCA é persistido: `descontoPedidoPct` só existe como estado de UI ao
 * vivo (ver AnaliseDesconto/PainelEdicaoRapida), não há coluna para isso
 * em `Simulacao`/`ResultadoAnual` — não dá para derivar do snapshot.
 */
export function derivarAlertasSimulacao(item: SimulacaoResumo): AlertaSimulacao[] {
  if (item.anoPrincipal === null) return []; // sem resultado do ano-base salvo, nada a avaliar

  let tipo: TipoAlertaSimulacao | null = null;
  let mensagem = "";

  if (item.status === "faixa_inviavel") {
    tipo = "faixa_inviavel";
    mensagem = `Faixa de preço inviável em ${item.anoPrincipal} — o piso ficou acima do teto da praça.`;
  } else if (item.status === "abaixo_piso") {
    tipo = "abaixo_piso";
    mensagem = `Preço abaixo do piso em ${item.anoPrincipal}.`;
  } else if (item.alertaDisparado) {
    tipo = "margem_abaixo_minima";
    mensagem = `Margem abaixo do mínimo configurado em ${item.anoPrincipal}, mesmo com o preço dentro da faixa.`;
  }

  if (!tipo) return [];

  return [
    {
      simulacaoId: item.id,
      tipo,
      nomeExibicao: nomeExibicaoSimulacao(item.nomeProduto, item.ramoRotulo),
      mensagem,
    },
  ];
}

export interface SimulacaoDetalhe {
  id: string;
  createdAt: string;
  nomeProduto: string | null;
  /** FK real do ramo no momento do submit — usado para reconstruir o formulário em "Nova a partir desta" (ver src/state/novaAPartirDoHistorico.ts). `ramoRotulo`/`ramoAliquotaSugerida` abaixo continuam sendo o snapshot de EXIBIÇÃO (não recalculado se o Ramo mudar depois). */
  ramoId: string;
  ramoRotulo: string | null;
  ramoAliquotaSugerida: number | null;
  formulaTipo: FormulaTipo;
  custoCompra: number;
  despesaFixaPct: number | null;
  markupPct: number | null;
  margemAlvoPct: number;
  margemMinimaPct: number;
  tetoPracaMin: number | null;
  tetoPracaMax: number | null;
  prazoPagamentoFornecedorDias: number | null;
  cenarios: Record<CenarioRepasse, ResultadoAno[]>;
  impactoCaixa: ImpactoCaixaAno[] | null;
}

/**
 * Devolve o snapshot completo de uma simulação — SOMENTE se pertencer a
 * `userId`. `findFirst` filtra por dono na própria query: não existe
 * caminho para montar a resposta sem o dono bater. `null` cobre tanto "não
 * existe" quanto "existe, mas é de outro usuário" — de propósito, para
 * quem chama nunca vazar qual dos dois casos ocorreu.
 *
 * `cache()` (React): /historico/[id]/page.tsx chama esta função duas vezes
 * no mesmo request (`generateMetadata` e o componente da página, para o
 * `<title>` e o conteúdo usarem o mesmo dado) — sem isso seria uma consulta
 * ao banco duplicada por carregamento de página. Memoiza só durante um
 * único render/request, não entre requisições.
 */
export const buscarSimulacaoDoUsuario = cache(async function buscarSimulacaoDoUsuario(
  id: string,
  userId: string,
): Promise<SimulacaoDetalhe | null> {
  const simulacao = await prisma.simulacao.findFirst({
    where: { id, userId },
    include: {
      resultados: { orderBy: [{ cenario: "asc" }, { ano: "asc" }] },
      impactosCaixa: { orderBy: { ano: "asc" } },
    },
  });

  if (!simulacao) return null;

  const cenarios: Record<CenarioRepasse, ResultadoAno[]> = { integral: [], gradual: [], absorcao: [] };
  for (const r of simulacao.resultados) {
    const cenario = r.cenario as CenarioRepasse;
    if (!(cenario in cenarios)) continue; // defensivo: nunca deveria acontecer, dado o que a própria API grava
    cenarios[cenario].push({
      ano: r.ano,
      preco: Number(r.preco),
      margemResultante: Number(r.margemResultante),
      tributoTotalPct: Number(r.tributoTotalPct),
      piso: Number(r.piso),
      teto: r.teto !== null ? Number(r.teto) : null,
      descontoMaximoPct: r.descontoMaximoPct !== null ? Number(r.descontoMaximoPct) : null,
      alertaDisparado: r.alertaDisparado,
      mensagemRecomendacao: r.mensagemRecomendacao,
    });
  }

  return {
    id: simulacao.id,
    createdAt: simulacao.createdAt.toISOString(),
    nomeProduto: simulacao.nomeProduto,
    ramoId: simulacao.ramoId,
    ramoRotulo: simulacao.ramoRotulo,
    ramoAliquotaSugerida:
      simulacao.ramoAliquotaSugerida !== null ? Number(simulacao.ramoAliquotaSugerida) : null,
    formulaTipo: simulacao.formulaTipo as FormulaTipo,
    custoCompra: Number(simulacao.custoCompra),
    despesaFixaPct: simulacao.despesaFixaPct !== null ? Number(simulacao.despesaFixaPct) : null,
    markupPct: simulacao.markupPct !== null ? Number(simulacao.markupPct) : null,
    margemAlvoPct: Number(simulacao.margemAlvoPct),
    margemMinimaPct: Number(simulacao.margemMinimaPct),
    tetoPracaMin: simulacao.tetoPracaMin !== null ? Number(simulacao.tetoPracaMin) : null,
    tetoPracaMax: simulacao.tetoPracaMax !== null ? Number(simulacao.tetoPracaMax) : null,
    prazoPagamentoFornecedorDias: simulacao.prazoPagamentoFornecedorDias,
    cenarios,
    impactoCaixa:
      simulacao.impactosCaixa.length > 0
        ? simulacao.impactosCaixa.map((r) => ({
            ano: r.ano,
            valorProtegido: Number(r.valorProtegido),
            valorEmRisco: Number(r.valorEmRisco),
            // Coluna é nullable no schema (mesmo padrão de ResultadoAnual),
            // mas por contrato nunca é gravada como null (ver
            // validarEntradaSimulacaoSalva) — ImpactoCaixaAno.mensagemRecomendacao
            // (src/lib/motor.ts) não é opcional.
            mensagemRecomendacao: r.mensagemRecomendacao ?? "",
          }))
        : null,
  };
});
