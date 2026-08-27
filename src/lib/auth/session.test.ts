import { afterAll, beforeAll, describe, expect, it } from "vitest";
import prisma from "@/lib/prisma";
import { hashPassword, hashSessionToken } from "@/lib/auth/crypto";
import {
  createSession,
  getSessionByToken,
  revokeAllSessionsForUser,
  revokeSession,
} from "@/lib/auth/session";

/**
 * Testes de integração reais contra o Postgres de desenvolvimento (o mesmo
 * banco do `db push`/seed) — este projeto não tem banco de teste separado
 * nem infraestrutura de mock de Prisma. Mockar `prisma.session.*` aqui só
 * provaria que o mock devolve o que foi programado para devolver, não que
 * `session.ts` fala corretamente com o Postgres de verdade (query real,
 * unique constraint real, FK real) — por isso a escolha é rodar contra o
 * banco real, com todo dado marcado (`@session-test.invalid`) e limpo no
 * final. Limitação conhecida: testes dependem de rede/banco disponível e
 * rodam mais devagor que os demais (hash Argon2id + queries reais).
 */

const TEST_EMAIL = `user-${Date.now()}@session-test.invalid`;
let userId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      nome: "Usuário de teste — session.test.ts",
      email: TEST_EMAIL,
      passwordHash: await hashPassword("senha-de-teste-nunca-usada-para-login"),
    },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.delete({ where: { id: userId } });
});

describe("createSession", () => {
  it("cria a sessão e retorna o token puro junto com a linha criada", async () => {
    const { token, session } = await createSession(userId);

    expect(token).toBeTruthy();
    expect(session.userId).toBe(userId);
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());

    await revokeSession(token);
  });

  it("persiste apenas o hash do token — o token puro nunca aparece na linha salva", async () => {
    const { token, session } = await createSession(userId);

    const row = await prisma.session.findUniqueOrThrow({ where: { id: session.id } });

    expect(row.tokenHash).toBe(hashSessionToken(token));
    expect(row.tokenHash).not.toBe(token);
    expect(JSON.stringify(row)).not.toContain(token);

    await revokeSession(token);
  });
});

describe("getSessionByToken", () => {
  it("recupera a sessão e o usuário com o token correto", async () => {
    const { token } = await createSession(userId);

    const result = await getSessionByToken(token);

    expect(result).not.toBeNull();
    expect(result?.user.id).toBe(userId);
    expect(result?.user.email).toBe(TEST_EMAIL);
    expect(result?.session.userId).toBe(userId);

    await revokeSession(token);
  });

  it("retorna null para um token que nunca existiu", async () => {
    const result = await getSessionByToken("token-que-nunca-foi-emitido");
    expect(result).toBeNull();
  });

  it("trata sessão expirada como inválida e a remove do banco", async () => {
    const { token, session } = await createSession(userId);

    // Simula o tempo já ter passado do vencimento, sem esperar 7 dias de verdade.
    await prisma.session.update({
      where: { id: session.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const result = await getSessionByToken(token);
    expect(result).toBeNull();

    const row = await prisma.session.findUnique({ where: { id: session.id } });
    expect(row).toBeNull();
  });
});

describe("revokeSession", () => {
  it("revoga a sessão — o token deixa de autenticar depois", async () => {
    const { token } = await createSession(userId);

    await revokeSession(token);

    expect(await getSessionByToken(token)).toBeNull();
  });

  it("revogar um token inexistente não lança exceção", async () => {
    await expect(revokeSession("token-que-nunca-existiu")).resolves.not.toThrow();
  });
});

describe("revokeAllSessionsForUser", () => {
  it("revoga todas as sessões do usuário e retorna quantas foram revogadas", async () => {
    const a = await createSession(userId);
    const b = await createSession(userId);

    const count = await revokeAllSessionsForUser(userId);

    expect(count).toBeGreaterThanOrEqual(2);
    expect(await getSessionByToken(a.token)).toBeNull();
    expect(await getSessionByToken(b.token)).toBeNull();
  });
});
