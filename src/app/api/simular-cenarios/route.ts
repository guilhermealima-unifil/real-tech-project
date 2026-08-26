import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { simular, type CenarioRepasse, type ParametroTributarioAno, type ResultadoAno } from "@/lib/motor";
import { validarEntradaSimulacao } from "@/lib/validacao";

/**
 * Roda os três cenários de repasse (integral, gradual, absorção) de uma vez
 * só, para a tela de cenários sobrepostos (docs/02, "Tela de cenários" —
 * Fase 3). Reaproveita a mesma validação e o mesmo carregamento de
 * ramo/parâmetros de `/api/simular`, mas devolve os três resultados juntos
 * em vez de fazer o cliente disparar três requisições. Qualquer
 * `cenarioRepasse` enviado no corpo é ignorado — os três são sempre
 * calculados.
 */

const CENARIOS: CenarioRepasse[] = ["integral", "gradual", "absorcao"];

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erros: ["Corpo da requisição deve ser JSON válido."] }, { status: 400 });
  }

  const validacao = validarEntradaSimulacao(body);
  if (!validacao.ok) {
    return NextResponse.json({ erros: validacao.erros }, { status: 400 });
  }
  const entrada = validacao.entrada;

  let ramo: Awaited<ReturnType<typeof prisma.ramo.findUnique>>;
  let parametros: ParametroTributarioAno[];
  try {
    ramo = await prisma.ramo.findUnique({ where: { id: entrada.ramoId } });
    if (!ramo) {
      return NextResponse.json({ erros: ["ramoId não encontrado."] }, { status: 400 });
    }
    if (!ramo.entraNoMvp) {
      return NextResponse.json(
        {
          erros: [
            `O ramo "${ramo.rotulo}" ainda não é suportado — ramos mistos (mercado, farmácia) ` +
              "exigem mix de alíquota por item e ficam fora do MVP.",
          ],
        },
        { status: 400 },
      );
    }

    const parametrosDb = await prisma.parametroTributario.findMany({ orderBy: { ano: "asc" } });
    parametros = parametrosDb.map((p) => ({
      ano: p.ano,
      cbsPct: Number(p.cbsPct),
      ibsPct: Number(p.ibsPct),
      pisCofinsPct: Number(p.pisCofinsPct),
      icmsIssPct: Number(p.icmsIssPct),
    }));
  } catch {
    return NextResponse.json(
      { erros: ["Não foi possível consultar o banco de dados. Tente novamente."] },
      { status: 500 },
    );
  }

  try {
    const cenarios: Record<CenarioRepasse, ResultadoAno[]> = {} as Record<CenarioRepasse, ResultadoAno[]>;
    for (const cenarioRepasse of CENARIOS) {
      cenarios[cenarioRepasse] = simular(
        {
          custoCompra: entrada.custoCompra,
          formulaTipo: entrada.formulaTipo,
          despesaFixaPct: entrada.despesaFixaPct !== undefined ? entrada.despesaFixaPct / 100 : undefined,
          markupPct: entrada.markupPct !== undefined ? entrada.markupPct / 100 : undefined,
          margemAlvoPct: entrada.margemAlvoPct / 100,
          margemMinimaPct: entrada.margemMinimaPct / 100,
          tetoPracaMin: entrada.tetoPracaMin,
          tetoPracaMax: entrada.tetoPracaMax,
          cenarioRepasse,
        },
        parametros,
      );
    }

    return NextResponse.json({
      ramo: {
        id: ramo.id,
        chave: ramo.chave,
        rotulo: ramo.rotulo,
        aliquotaSugerida: Number(ramo.aliquotaSugerida),
      },
      cenarios,
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido ao simular.";
    return NextResponse.json({ erros: [mensagem] }, { status: 400 });
  }
}
