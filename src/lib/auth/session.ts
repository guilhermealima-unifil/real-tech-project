import prisma from "@/lib/prisma";
import type { Session, User } from "@/generated/prisma/client";
import { generateSessionToken, hashSessionToken } from "@/lib/auth/crypto";

/**
 * 7 dias — decisão confirmada explicitamente pelo usuário (não havia
 * definição anterior em docs/CLAUDE.md/memória; nenhum valor foi escolhido
 * sem essa confirmação).
 */
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Cria uma sessão para `userId` e retorna o token puro junto com a linha
 * criada. O token puro só existe aqui, na memória, para ser devolvido a
 * quem chamou — o banco recebe exclusivamente `hashSessionToken(token)`.
 * Quem chamar esta função (futuro endpoint de login/registro) é responsável
 * por colocar `token` num cookie; esta camada não sabe nada de HTTP/cookie.
 */
export async function createSession(userId: string): Promise<{ token: string; session: Session }> {
  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.session.create({
    data: { tokenHash, userId, expiresAt },
  });

  return { token, session };
}

/**
 * Recebe o token puro (ex.: valor lido do cookie), busca pelo hash — nunca
 * pelo token em si — e retorna a sessão junto com o usuário dono dela.
 * Retorna `null` para token inexistente e para sessão expirada (o chamador
 * não precisa nem deve distinguir os dois casos: nos dois, "não autenticado").
 *
 * Sessão expirada é removida do banco aqui mesmo, no momento em que é lida.
 * Decisão: como esta é a única query que toca essa linha de qualquer jeito,
 * não faz sentido devolver "inválida" e deixar a linha morta no banco só
 * para uma varredura periódica — que esta etapa explicitamente não constrói.
 * O delete é best-effort (`.catch` silencioso): se duas requisições
 * concorrentes detectarem a mesma expiração, a segunda tentativa de apagar
 * pode falhar por a linha já não existir mais — isso não muda o resultado
 * (`null` de qualquer forma), só evita uma exceção não tratada.
 */
export async function getSessionByToken(
  token: string,
): Promise<{ session: Session; user: User } | null> {
  const tokenHash = hashSessionToken(token);

  const found = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!found) {
    return null;
  }

  if (found.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { id: found.id } }).catch(() => {});
    return null;
  }

  const { user, ...session } = found;
  return { session, user };
}

/**
 * Revoga (apaga) a sessão correspondente ao token puro — usado por logout.
 * `deleteMany` em vez de `delete` para ser idempotente: revogar um token já
 * revogado/inexistente não lança exceção, só apaga zero linhas.
 */
export async function revokeSession(token: string): Promise<void> {
  const tokenHash = hashSessionToken(token);
  await prisma.session.deleteMany({ where: { tokenHash } });
}

/**
 * Revoga todas as sessões de um usuário (ex.: "sair de todos os
 * dispositivos", ou invalidar sessões antigas após troca de senha).
 * Retorna quantas sessões foram revogadas.
 */
export async function revokeAllSessionsForUser(userId: string): Promise<number> {
  const { count } = await prisma.session.deleteMany({ where: { userId } });
  return count;
}
