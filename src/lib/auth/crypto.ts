import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import argon2 from "argon2";

/**
 * Senha humana → Argon2id → passwordHash (armazenado em User.passwordHash).
 * `type` é passado explicitamente porque o padrão da lib pode mudar entre
 * versões — Argon2id é a variante decidida para este projeto, não o default
 * implícito de uma versão específica do pacote.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, { type: argon2.argon2id });
}

/**
 * argon2.verify lança exceção para hash malformado/de outro algoritmo, em
 * vez de retornar false — normalizado aqui para que "senha errada" e "hash
 * inválido" tenham o mesmo resultado (false) para quem chama.
 */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, password);
  } catch {
    return false;
  }
}

/**
 * Token aleatório de 256 bits → SHA-256 → tokenHash (armazenado em
 * Session.tokenHash). O token puro nunca é persistido — só o hash.
 */
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Comparação de tokenHash em tempo constante. A busca no banco já é por
 * igualdade exata de índice único, mas comparar o resultado com
 * timingSafeEqual evita vazar informação por timing caso o hash retornado
 * seja comparado novamente em código de aplicação (defesa em profundidade).
 */
export function tokensMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
