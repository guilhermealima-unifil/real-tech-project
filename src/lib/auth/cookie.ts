import { cookies } from "next/headers";
import { SESSION_DURATION_MS } from "@/lib/auth/session";

/**
 * Abstração única do cookie de sessão — nenhuma rota deve montar essas
 * opções na mão. O cookie contém SOMENTE o token puro da sessão (o mesmo
 * valor devolvido por createSession/já esperado por getSessionByToken);
 * nunca dados do usuário. `maxAge` deriva de SESSION_DURATION_MS
 * (session.ts) em vez de repetir "7 dias" como literal aqui.
 */
export const SESSION_COOKIE_NAME = "realtech_session";

const SESSION_COOKIE_MAX_AGE_SECONDS = Math.floor(SESSION_DURATION_MS / 1000);

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value;
}
