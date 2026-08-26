import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const parametros = await prisma.parametroTributario.findMany({
      orderBy: { ano: "asc" },
    });

    return NextResponse.json(
      parametros.map((p) => ({
        ano: p.ano,
        versao: p.versao,
        vigencia: p.vigencia.toISOString(),
        fonte: p.fonte,
        cbsPct: Number(p.cbsPct),
        ibsPct: Number(p.ibsPct),
        pisCofinsPct: Number(p.pisCofinsPct),
        icmsIssPct: Number(p.icmsIssPct),
      })),
    );
  } catch {
    return NextResponse.json(
      { erros: ["Não foi possível carregar os parâmetros tributários. Tente novamente."] },
      { status: 500 },
    );
  }
}
