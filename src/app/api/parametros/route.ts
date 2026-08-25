import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
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
}
