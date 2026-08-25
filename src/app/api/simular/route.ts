import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { simular, type ParametroTributarioAno } from "@/lib/motor";
import { validarEntradaSimulacao } from "@/lib/validacao";

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

  const ramo = await prisma.ramo.findUnique({ where: { id: entrada.ramoId } });
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
  const parametros: ParametroTributarioAno[] = parametrosDb.map((p) => ({
    ano: p.ano,
    cbsPct: Number(p.cbsPct),
    ibsPct: Number(p.ibsPct),
    pisCofinsPct: Number(p.pisCofinsPct),
    icmsIssPct: Number(p.icmsIssPct),
  }));

  try {
    const resultados = simular(
      {
        custoCompra: entrada.custoCompra,
        formulaTipo: entrada.formulaTipo,
        despesaFixaPct: entrada.despesaFixaPct !== undefined ? entrada.despesaFixaPct / 100 : undefined,
        markupPct: entrada.markupPct !== undefined ? entrada.markupPct / 100 : undefined,
        margemAlvoPct: entrada.margemAlvoPct / 100,
        margemMinimaPct: entrada.margemMinimaPct / 100,
        regime: entrada.regime,
        tetoPracaMin: entrada.tetoPracaMin,
        tetoPracaMax: entrada.tetoPracaMax,
        cenarioRepasse: entrada.cenarioRepasse,
      },
      parametros,
    );

    return NextResponse.json({
      ramo: {
        id: ramo.id,
        chave: ramo.chave,
        rotulo: ramo.rotulo,
        aliquotaSugerida: Number(ramo.aliquotaSugerida),
      },
      resultados,
    });
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Erro desconhecido ao simular.";
    return NextResponse.json({ erros: [mensagem] }, { status: 400 });
  }
}
