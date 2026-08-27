import { NextResponse } from "next/server";
import { getUsuarioAutenticado } from "@/lib/auth/dal";
import { buscarSimulacaoDoUsuario } from "@/lib/historico";

const MENSAGEM_NAO_ENCONTRADA = "Simulação não encontrada.";

/**
 * Devolve o snapshot completo de uma simulação salva — SOMENTE se ela
 * pertencer ao usuário autenticado (ver src/lib/historico.ts,
 * `buscarSimulacaoDoUsuario`: filtra por dono na própria query). ID
 * inexistente e ID de outro usuário devolvem exatamente a mesma resposta
 * (404 genérico), sem vazar qual dos dois casos ocorreu. Nenhum número é
 * recalculado aqui — os valores voltam exatamente como foram gravados por
 * POST /api/simulacoes.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    return NextResponse.json({ erros: ["Não autenticado."] }, { status: 401 });
  }

  const { id } = await params;
  const simulacao = await buscarSimulacaoDoUsuario(id, usuario.id);

  if (!simulacao) {
    return NextResponse.json({ erros: [MENSAGEM_NAO_ENCONTRADA] }, { status: 404 });
  }

  return NextResponse.json({ simulacao });
}
