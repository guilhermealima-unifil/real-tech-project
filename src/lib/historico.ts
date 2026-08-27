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
import { calcularPrecoRecomendado, classificarStatusPreco, type StatusPreco } from "./analiseResultado";
import type { CenarioRepasse, FormulaTipo, ImpactoCaixaAno, ResultadoAno } from "./motor";

const CENARIO_PRINCIPAL: CenarioRepasse = "integral";

export interface SimulacaoResumo {
  id: string;
  createdAt: string;
  ramoRotulo: string | null;
  formulaTipo: string;
  custoCompra: number;
  cenarioPrincipal: CenarioRepasse;
  anoPrincipal: number | null;
  precoAnalisado: number | null;
  precoRecomendado: number | null;
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
      ramoRotulo: s.ramoRotulo,
      formulaTipo: s.formulaTipo,
      custoCompra: Number(s.custoCompra),
      cenarioPrincipal: CENARIO_PRINCIPAL,
      anoPrincipal: resultadoAno?.ano ?? null,
      precoAnalisado: resultadoAno?.preco ?? null,
      precoRecomendado: resultadoAno ? calcularPrecoRecomendado(resultadoAno) : null,
      status: resultadoAno ? classificarStatusPreco(resultadoAno.preco, resultadoAno.piso, resultadoAno.teto) : null,
      alertaDisparado: resultadoAno?.alertaDisparado ?? false,
    };
  });
}

export interface SimulacaoDetalhe {
  id: string;
  createdAt: string;
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
