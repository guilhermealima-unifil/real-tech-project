import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUsuarioAutenticado } from "@/lib/auth/dal";
import { validarEntradaSimulacaoSalva } from "@/lib/validacaoSimulacaoSalva";
import { listarSimulacoesDoUsuario } from "@/lib/historico";
import type { CenarioRepasse } from "@/lib/motor";

/**
 * Persistência de simulações (histórico). O cálculo tributário já rodou no
 * cliente (src/lib/motor.ts) — esta rota NUNCA chama `simular()` nem
 * reimplementa a regra. Ela só autentica, valida a FORMA do payload
 * (validarEntradaSimulacaoSalva), confere o `ramoId` contra o banco e
 * grava o snapshot exatamente como recebido.
 */

const CENARIOS: CenarioRepasse[] = ["integral", "gradual", "absorcao"];

// Defesa contra "payload absurdamente grande" (ver CLAUDE.md desta etapa) —
// uma simulação real tem ~24 linhas de resultado (3 cenários x 8 anos) e
// cabe em poucos KB; 200 KB já é uma folga generosa.
const TAMANHO_MAX_PAYLOAD_BYTES = 200_000;

export async function POST(request: Request) {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    return NextResponse.json({ erros: ["Não autenticado."] }, { status: 401 });
  }

  const bruto = await request.text();
  if (bruto.length > TAMANHO_MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ erros: ["Corpo da requisição excede o tamanho máximo permitido."] }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(bruto);
  } catch {
    return NextResponse.json({ erros: ["Corpo da requisição deve ser JSON válido."] }, { status: 400 });
  }

  const validacao = validarEntradaSimulacaoSalva(body);
  if (!validacao.ok) {
    return NextResponse.json({ erros: validacao.erros }, { status: 400 });
  }
  const entrada = validacao.entrada;

  const ramo = await prisma.ramo.findUnique({ where: { id: entrada.ramoId } });
  if (!ramo) {
    return NextResponse.json({ erros: ["ramoId não encontrado."] }, { status: 400 });
  }

  const simulacao = await prisma.simulacao.create({
    data: {
      userId: usuario.id,
      ramoId: entrada.ramoId,
      ramoRotulo: entrada.ramoRotulo,
      ramoAliquotaSugerida: entrada.ramoAliquotaSugerida,
      formulaTipo: entrada.formulaTipo,
      custoCompra: entrada.custoCompra,
      despesaFixaPct: entrada.despesaFixaPct,
      markupPct: entrada.markupPct,
      margemAlvoPct: entrada.margemAlvoPct,
      margemMinimaPct: entrada.margemMinimaPct,
      tetoPracaMin: entrada.tetoPracaMin,
      tetoPracaMax: entrada.tetoPracaMax,
      prazoPagamentoFornecedorDias: entrada.prazoPagamentoFornecedorDias,
      resultados: {
        create: CENARIOS.flatMap((cenario) =>
          entrada.cenarios[cenario].map((r) => ({
            cenario,
            ano: r.ano,
            preco: r.preco,
            margemResultante: r.margemResultante,
            tributoTotalPct: r.tributoTotalPct,
            piso: r.piso,
            teto: r.teto,
            descontoMaximoPct: r.descontoMaximoPct,
            alertaDisparado: r.alertaDisparado,
            mensagemRecomendacao: r.mensagemRecomendacao,
          })),
        ),
      },
      impactosCaixa:
        entrada.impactoCaixa && entrada.impactoCaixa.length > 0
          ? {
              create: entrada.impactoCaixa.map((r) => ({
                ano: r.ano,
                valorProtegido: r.valorProtegido,
                valorEmRisco: r.valorEmRisco,
                mensagemRecomendacao: r.mensagemRecomendacao,
              })),
            }
          : undefined,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json(
    { id: simulacao.id, createdAt: simulacao.createdAt.toISOString() },
    { status: 201 },
  );
}

/**
 * Lista só as simulações do usuário autenticado, mais recentes primeiro.
 * Item de lista propositalmente enxuto (ver CLAUDE.md: "não transforme
 * isso em dashboard") — só o suficiente para reconhecer a simulação:
 * data, ramo, preço analisado/recomendado e status no ano-base do cenário
 * "integral" (o mesmo cenário/ano que a tela de Resultado abre por padrão).
 */
export async function GET() {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    return NextResponse.json({ erros: ["Não autenticado."] }, { status: 401 });
  }

  const simulacoes = await listarSimulacoesDoUsuario(usuario.id);
  return NextResponse.json({ simulacoes });
}
