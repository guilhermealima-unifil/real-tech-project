import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/crypto";
import { SESSION_DURATION_MS } from "@/lib/auth/session";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookie";

/**
 * Estratégia de teste (avaliada antes de escrever qualquer coisa, por
 * pedido explícito):
 *
 * Chamar as Route Handlers diretamente (sem servidor Next rodando, sem
 * Playwright) é possível para a lógica de negócio, mas `cookies()` de
 * "next/headers" lança `cookies was called outside a request scope`
 * quando chamado fora do runtime de requisição do Next — confirmado com um
 * teste-sonda antes de decidir isto (removido depois de confirmar). Esse é
 * o único bloqueio real; nada na lógica de auth em si exige servidor
 * rodando.
 *
 * Solução: mock mínimo de "next/headers" — um Map em memória atrás da
 * mesma interface (`get`/`set`/`delete`) que `cookie.ts` já usa. Isso não é
 * o tipo de mock que só reproduz o que foi programado pra devolver: ele
 * não decide nada sobre autenticação, só substitui o armazenamento de
 * cookie do Next por um em memória — toda a lógica de negócio (hash,
 * criação de sessão, busca no Postgres, checagem de expiração, unique
 * constraint) roda de verdade, contra o banco real de desenvolvimento,
 * igual em session.test.ts.
 *
 * Isso significa que estes testes ainda criam/apagam linhas no banco real
 * (mesmo trade-off já aceito na etapa anterior) — não introduzem nenhuma
 * infraestrutura nova (sem Docker, sem banco separado, sem Playwright).
 * Todo dado usa e-mail marcado (`@auth-route-test.invalid`) e é apagado no
 * `afterAll`, com o `id` de cada usuário criado rastreado explicitamente em
 * vez de um cleanup "apague tudo que bate com o domínio".
 */

const { cookieJar, setCalls } = vi.hoisted(() => {
  return {
    cookieJar: new Map<string, string>(),
    setCalls: [] as Array<{ name: string; value: string; options?: Record<string, unknown> }>,
  };
});

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name)! } : undefined),
    set: (name: string, value: string, options?: Record<string, unknown>) => {
      cookieJar.set(name, value);
      setCalls.push({ name, value, options });
    },
    delete: (name: string) => {
      cookieJar.delete(name);
    },
  }),
}));

import { POST as registerRoute } from "./register/route";
import { POST as loginRoute } from "./login/route";
import { POST as logoutRoute } from "./logout/route";
import { GET as meRoute } from "./me/route";

function emailDeTeste(rotulo: string): string {
  return `${rotulo}-${Date.now()}-${Math.random().toString(36).slice(2)}@auth-route-test.invalid`;
}

function postJson(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const createdUserIds: string[] = [];

beforeEach(() => {
  cookieJar.clear();
  setCalls.length = 0;
});

afterAll(async () => {
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
});

function semSegredos(payload: unknown, tokenBruto?: string): void {
  const texto = JSON.stringify(payload);
  expect(texto).not.toContain("passwordHash");
  expect(texto).not.toContain("tokenHash");
  if (tokenBruto) expect(texto).not.toContain(tokenBruto);
}

describe("POST /api/auth/register", () => {
  it("cria o usuário, seta o cookie de sessão com os atributos esperados e devolve dados públicos", async () => {
    const email = emailDeTeste("register-ok");
    const response = await registerRoute(
      postJson("http://localhost/api/auth/register", { nome: "Fulano de Teste", email, password: "senha-valida-123" }),
    );
    const body = await response.json();
    if (body.usuario?.id) createdUserIds.push(body.usuario.id);

    expect(response.status).toBe(201);
    expect(body.usuario).toMatchObject({ nome: "Fulano de Teste", email });
    semSegredos(body);

    expect(setCalls).toHaveLength(1);
    const cookie = setCalls[0];
    expect(cookie.name).toBe(SESSION_COOKIE_NAME);
    expect(cookie.value).toMatch(/^[A-Za-z0-9_-]{43}$/); // token puro, formato de generateSessionToken()
    expect(cookie.options?.httpOnly).toBe(true);
    expect(cookie.options?.sameSite).toBe("lax");
    expect(cookie.options?.path).toBe("/");
    expect(cookie.options?.secure).toBe(process.env.NODE_ENV === "production");
    expect(cookie.options?.maxAge).toBe(Math.floor(SESSION_DURATION_MS / 1000));

    semSegredos(body, cookie.value);
  });

  it("normaliza e-mail com espaços/maiúsculas antes de salvar", async () => {
    const emailBase = emailDeTeste("register-normaliza");
    const emailComRuido = `  ${emailBase.toUpperCase()}  `;

    const response = await registerRoute(
      postJson("http://localhost/api/auth/register", { nome: "Ruído", email: emailComRuido, password: "senha-valida-123" }),
    );
    const body = await response.json();
    if (body.usuario?.id) createdUserIds.push(body.usuario.id);

    expect(response.status).toBe(201);
    expect(body.usuario.email).toBe(emailBase.toLowerCase());
  });

  it("rejeita e-mail duplicado (409), sem criar um segundo usuário", async () => {
    const email = emailDeTeste("register-duplicado");
    const primeira = await registerRoute(
      postJson("http://localhost/api/auth/register", { nome: "Primeiro", email, password: "senha-valida-123" }),
    );
    const primeiroBody = await primeira.json();
    createdUserIds.push(primeiroBody.usuario.id);

    const segunda = await registerRoute(
      postJson("http://localhost/api/auth/register", { nome: "Segundo", email, password: "outra-senha-123" }),
    );
    const segundoBody = await segunda.json();

    expect(segunda.status).toBe(409);
    expect(segundoBody.erros).toEqual(["Este e-mail já está cadastrado."]);

    const total = await prisma.user.count({ where: { email } });
    expect(total).toBe(1);
  });

  it("rejeita senha curta demais (400) sem tocar o banco", async () => {
    const email = emailDeTeste("register-senha-curta");
    const response = await registerRoute(
      postJson("http://localhost/api/auth/register", { nome: "Curto", email, password: "123" }),
    );

    expect(response.status).toBe(400);
    expect(setCalls).toHaveLength(0);

    const existente = await prisma.user.findUnique({ where: { email } });
    expect(existente).toBeNull();
  });
});

describe("POST /api/auth/login", () => {
  async function criarUsuarioDireto(rotulo: string, password: string) {
    const email = emailDeTeste(rotulo);
    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({ data: { nome: "Usuário de login", email, passwordHash } });
    createdUserIds.push(user.id);
    return { email, user };
  }

  it("autentica com credenciais corretas e devolve uma sessão nova", async () => {
    const { email } = await criarUsuarioDireto("login-ok", "senha-correta-123");

    const response = await loginRoute(postJson("http://localhost/api/auth/login", { email, password: "senha-correta-123" }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.usuario.email).toBe(email);
    semSegredos(body, setCalls[0]?.value);
  });

  it("credenciais inválidas (senha errada) e e-mail inexistente devolvem exatamente a mesma resposta", async () => {
    const { email } = await criarUsuarioDireto("login-senha-errada", "senha-correta-123");

    const senhaErrada = await loginRoute(postJson("http://localhost/api/auth/login", { email, password: "senha-errada" }));
    const senhaErradaBody = await senhaErrada.json();

    const emailInexistente = await loginRoute(
      postJson("http://localhost/api/auth/login", { email: emailDeTeste("nao-existe"), password: "qualquer-coisa-123" }),
    );
    const emailInexistenteBody = await emailInexistente.json();

    expect(senhaErrada.status).toBe(401);
    expect(emailInexistente.status).toBe(401);
    expect(senhaErradaBody).toEqual(emailInexistenteBody);
    expect(senhaErradaBody.erros).toEqual(["E-mail ou senha inválidos."]);
  });
});

describe("GET /api/auth/me", () => {
  it("devolve o usuário quando há uma sessão válida no cookie", async () => {
    const email = emailDeTeste("me-autenticado");
    const registro = await registerRoute(
      postJson("http://localhost/api/auth/register", { nome: "Autenticado", email, password: "senha-valida-123" }),
    );
    createdUserIds.push((await registro.json()).usuario.id);

    const response = await meRoute();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.usuario.email).toBe(email);
  });

  it("devolve 401 sem cookie de sessão", async () => {
    const response = await meRoute();
    expect(response.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("revoga a sessão e limpa o cookie — /me deixa de autenticar depois", async () => {
    const email = emailDeTeste("logout");
    const registro = await registerRoute(
      postJson("http://localhost/api/auth/register", { nome: "Vai sair", email, password: "senha-valida-123" }),
    );
    createdUserIds.push((await registro.json()).usuario.id);

    const logoutResponse = await logoutRoute();
    expect(logoutResponse.status).toBe(200);
    expect(cookieJar.has(SESSION_COOKIE_NAME)).toBe(false);

    const meDepois = await meRoute();
    expect(meDepois.status).toBe(401);
  });

  it("é idempotente: chamar sem sessão válida não é erro", async () => {
    const response = await logoutRoute();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ ok: true });
  });
});
