import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/crypto";
import { createSession } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookie";
import { validarEntradaLogin } from "@/lib/auth/validacao";
import { paraUsuarioPublico } from "@/lib/auth/usuario";

const CREDENCIAIS_INVALIDAS = "E-mail ou senha inválidos.";

/**
 * Hash Argon2id fixo de uma senha que nunca é usada de verdade — existe só
 * para ser comparado quando o e-mail não existe, gastando aproximadamente
 * o mesmo tempo de CPU que uma comparação real gastaria. Sem isso, um
 * "e-mail não encontrado" responderia bem mais rápido que um "senha
 * errada" (que passa pelo Argon2id), o que é um sinal de timing que
 * permitiria enumerar e-mails cadastrados mesmo com a mensagem genérica.
 */
const HASH_FANTASMA =
  "$argon2id$v=19$m=65536,p=4,t=3$E+/O3jhmFGGZ3AcFmPP6Bg$devv2J7mnPI+mr9kyENrpfS/P4nMCffXgQWRi7d5D20";

/**
 * Login. `verifyPassword` já normaliza hash malformado/corrompido para
 * `false` internamente (crypto.ts) — não há tratamento especial aqui para
 * esse caso, de propósito: qualquer motivo de falha (e-mail inexistente,
 * senha errada, hash corrompido) cai na mesma resposta genérica abaixo.
 * Criar um caminho de erro diferente para "hash corrompido" seria o tipo
 * de vazamento de informação que este endpoint existe para evitar.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erros: ["Corpo da requisição deve ser JSON válido."] }, { status: 400 });
  }

  const validacao = validarEntradaLogin(body);
  if (!validacao.ok) {
    return NextResponse.json({ erros: validacao.erros }, { status: 400 });
  }
  const { email, password } = validacao.entrada;

  const user = await prisma.user.findUnique({ where: { email } });

  const senhaValida = await verifyPassword(password, user?.passwordHash ?? HASH_FANTASMA);

  if (!user || !senhaValida) {
    return NextResponse.json({ erros: [CREDENCIAIS_INVALIDAS] }, { status: 401 });
  }

  const { token } = await createSession(user.id);
  await setSessionCookie(token);

  return NextResponse.json({ usuario: paraUsuarioPublico(user) });
}
