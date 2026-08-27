import { NextResponse } from "next/server";
import { clearSessionCookie, getSessionTokenFromCookie } from "@/lib/auth/cookie";
import { revokeSession } from "@/lib/auth/session";

/**
 * Logout é idempotente por construção: sem cookie, não há nada a revogar
 * (não é erro); com cookie de um token já revogado/inexistente,
 * `revokeSession` (session.ts) já é um `deleteMany` que não lança exceção
 * para zero linhas afetadas. Em qualquer um dos casos o cookie é limpo e a
 * resposta é a mesma.
 */
export async function POST() {
  const token = await getSessionTokenFromCookie();

  if (token) {
    await revokeSession(token);
  }

  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
