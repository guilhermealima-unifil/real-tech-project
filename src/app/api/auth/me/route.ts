import { NextResponse } from "next/server";
import { getUsuarioAutenticado } from "@/lib/auth/dal";

export async function GET() {
  const usuario = await getUsuarioAutenticado();

  if (!usuario) {
    return NextResponse.json({ erros: ["Não autenticado."] }, { status: 401 });
  }

  return NextResponse.json({ usuario });
}
