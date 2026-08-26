import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const ramos = await prisma.ramo.findMany({
      where: { entraNoMvp: true },
      orderBy: { rotulo: "asc" },
    });

    return NextResponse.json(
      ramos.map((ramo) => ({
        id: ramo.id,
        chave: ramo.chave,
        rotulo: ramo.rotulo,
        aliquotaSugerida: Number(ramo.aliquotaSugerida),
        tratamento: ramo.tratamento,
      })),
    );
  } catch {
    return NextResponse.json({ erros: ["Não foi possível carregar os ramos. Tente novamente."] }, { status: 500 });
  }
}
