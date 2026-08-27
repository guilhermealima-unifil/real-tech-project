import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import prisma from "@/lib/prisma";
import { SESSION_COOKIE_NAME } from "@/lib/auth/cookie";

/**
 * Mesma estratégia de src/app/api/auth/auth.test.ts: mock mínimo de
 * "next/headers" (Map em memória atrás de get/set/delete), rotas chamadas
 * diretamente, tudo o mais (Prisma, validação, checagem de ownership) roda
 * de verdade contra o banco real de desenvolvimento. Dados de teste ficam
 * restritos ao mínimo necessário para exercitar ownership entre dois
 * usuários (2 usuários, 2 simulações, poucas linhas de resultado cada) —
 * tudo rastreado e apagado em `afterAll`.
 *
 * `Simulacao.user` usa `onDelete: SetNull` (apagar um usuário não apaga
 * suas simulações) — por isso as simulações criadas aqui são apagadas
 * explicitamente antes/junto dos usuários, para não deixar linhas órfãs
 * (`userId: null`) no banco de desenvolvimento.
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

import { POST as registerRoute } from "../auth/register/route";
import { POST as criarSimulacao, GET as listarSimulacoes } from "./route";
import { GET as buscarSimulacao } from "./[id]/route";

function emailDeTeste(rotulo: string): string {
  return `${rotulo}-${Date.now()}-${Math.random().toString(36).slice(2)}@simulacoes-route-test.invalid`;
}

function postJson(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function getReq(url: string): Request {
  return new Request(url, { method: "GET" });
}

function autenticarComo(token: string) {
  cookieJar.set(SESSION_COOKIE_NAME, token);
}

function deslogar() {
  cookieJar.clear();
}

const createdUserIds: string[] = [];
const createdSimulacaoIds: string[] = [];

beforeEach(() => {
  cookieJar.clear();
  setCalls.length = 0;
});

afterAll(async () => {
  if (createdSimulacaoIds.length > 0) {
    await prisma.simulacao.deleteMany({ where: { id: { in: createdSimulacaoIds } } });
  }
  if (createdUserIds.length > 0) {
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  }
});

async function registrarUsuario(rotulo: string): Promise<{ id: string; email: string; token: string }> {
  const email = emailDeTeste(rotulo);
  const resposta = await registerRoute(
    postJson("http://localhost/api/auth/register", { nome: rotulo, email, password: "senha-valida-123" }),
  );
  const body = await resposta.json();
  createdUserIds.push(body.usuario.id);
  const token = setCalls[setCalls.length - 1].value;
  return { id: body.usuario.id as string, email, token };
}

function semSegredos(payload: unknown): void {
  const texto = JSON.stringify(payload);
  expect(texto).not.toContain("passwordHash");
  expect(texto).not.toContain("tokenHash");
}

function resultadoAno(ano: number) {
  return {
    ano,
    preco: 155,
    margemResultante: 0.35,
    tributoTotalPct: 26.5,
    piso: 150,
    teto: 200,
    descontoMaximoPct: 0.05,
    alertaDisparado: false,
    mensagemRecomendacao: "Preço dentro da faixa viável.",
  };
}

async function payloadValido() {
  const ramo = await prisma.ramo.findFirstOrThrow({ where: { entraNoMvp: true } });
  return {
    ramoId: ramo.id,
    ramoRotulo: ramo.rotulo,
    ramoAliquotaSugerida: Number(ramo.aliquotaSugerida),
    formulaTipo: "multiplicador" as const,
    custoCompra: 100,
    despesaFixaPct: 20,
    markupPct: null,
    margemAlvoPct: 35,
    margemMinimaPct: 30,
    tetoPracaMin: null,
    tetoPracaMax: 200,
    prazoPagamentoFornecedorDias: 30,
    cenarios: {
      integral: [resultadoAno(2026)],
      gradual: [resultadoAno(2026)],
      absorcao: [resultadoAno(2026)],
    },
    impactoCaixa: null,
  };
}

describe("POST /api/simulacoes", () => {
  it("exige autenticação (401), sem criar nada", async () => {
    deslogar();
    const payload = await payloadValido();
    const resposta = await criarSimulacao(postJson("http://localhost/api/simulacoes", payload));
    expect(resposta.status).toBe(401);
  });

  it("rejeita payload estruturalmente inválido (400), sem tocar o banco", async () => {
    const usuario = await registrarUsuario("post-invalido");
    autenticarComo(usuario.token);

    const payload = await payloadValido();
    // @ts-expect-error -- propositalmente quebrando a forma esperada
    delete payload.cenarios.gradual;

    const antes = await prisma.simulacao.count({ where: { userId: usuario.id } });
    const resposta = await criarSimulacao(postJson("http://localhost/api/simulacoes", payload));
    const depois = await prisma.simulacao.count({ where: { userId: usuario.id } });

    expect(resposta.status).toBe(400);
    expect(depois).toBe(antes);
  });

  it("rejeita ramoId inexistente (400)", async () => {
    const usuario = await registrarUsuario("post-ramo-invalido");
    autenticarComo(usuario.token);

    const payload = await payloadValido();
    payload.ramoId = "ramo-que-nao-existe";

    const resposta = await criarSimulacao(postJson("http://localhost/api/simulacoes", payload));
    expect(resposta.status).toBe(400);
  });

  it("salva o snapshot exatamente como enviado — sem recalcular — e não vaza segredos", async () => {
    const usuario = await registrarUsuario("post-ok");
    autenticarComo(usuario.token);

    const payload = await payloadValido();
    const resposta = await criarSimulacao(postJson("http://localhost/api/simulacoes", payload));
    const corpo = await resposta.json();
    expect(resposta.status).toBe(201);
    createdSimulacaoIds.push(corpo.id);
    semSegredos(corpo);

    const detalhe = await buscarSimulacao(getReq(`http://localhost/api/simulacoes/${corpo.id}`), {
      params: Promise.resolve({ id: corpo.id as string }),
    });
    const detalheBody = await detalhe.json();

    // Os números do payload são arbitrários (não correspondem a nenhum
    // cálculo real de simular()) — se a rota tivesse recalculado, esses
    // valores específicos não bateriam. Batendo exatamente, prova que a
    // rota só gravou e devolveu o snapshot.
    expect(detalheBody.simulacao.cenarios.integral).toEqual([resultadoAno(2026)]);
    expect(detalheBody.simulacao.cenarios.gradual).toEqual([resultadoAno(2026)]);
    expect(detalheBody.simulacao.cenarios.absorcao).toEqual([resultadoAno(2026)]);
    expect(detalheBody.simulacao.custoCompra).toBe(100);
    expect(detalheBody.simulacao.ramoRotulo).toBe(payload.ramoRotulo);
  });
});

describe("GET /api/simulacoes", () => {
  it("exige autenticação (401)", async () => {
    deslogar();
    const resposta = await listarSimulacoes();
    expect(resposta.status).toBe(401);
  });

  it("lista só as simulações do usuário autenticado", async () => {
    const usuarioA = await registrarUsuario("list-a");
    const usuarioB = await registrarUsuario("list-b");

    autenticarComo(usuarioA.token);
    const respostaA1 = await criarSimulacao(postJson("http://localhost/api/simulacoes", await payloadValido()));
    const simA = await respostaA1.json();
    createdSimulacaoIds.push(simA.id);

    autenticarComo(usuarioB.token);
    const respostaB1 = await criarSimulacao(postJson("http://localhost/api/simulacoes", await payloadValido()));
    const simB = await respostaB1.json();
    createdSimulacaoIds.push(simB.id);

    autenticarComo(usuarioA.token);
    const listaA = await (await listarSimulacoes()).json();
    const idsListaA: string[] = listaA.simulacoes.map((s: { id: string }) => s.id);
    expect(idsListaA).toContain(simA.id);
    expect(idsListaA).not.toContain(simB.id);

    autenticarComo(usuarioB.token);
    const listaB = await (await listarSimulacoes()).json();
    const idsListaB: string[] = listaB.simulacoes.map((s: { id: string }) => s.id);
    expect(idsListaB).toContain(simB.id);
    expect(idsListaB).not.toContain(simA.id);
  });
});

describe("GET /api/simulacoes/[id]", () => {
  it("exige autenticação (401)", async () => {
    deslogar();
    const resposta = await buscarSimulacao(getReq("http://localhost/api/simulacoes/qualquer"), {
      params: Promise.resolve({ id: "qualquer" }),
    });
    expect(resposta.status).toBe(401);
  });

  it("usuário A não acessa simulação de B — 404 idêntico ao de um ID inexistente", async () => {
    const usuarioA = await registrarUsuario("owner-a");
    const usuarioB = await registrarUsuario("owner-b");

    autenticarComo(usuarioA.token);
    const respostaCriacao = await criarSimulacao(postJson("http://localhost/api/simulacoes", await payloadValido()));
    const simA = await respostaCriacao.json();
    createdSimulacaoIds.push(simA.id);

    autenticarComo(usuarioB.token);
    const tentativaB = await buscarSimulacao(getReq(`http://localhost/api/simulacoes/${simA.id}`), {
      params: Promise.resolve({ id: simA.id as string }),
    });
    const tentativaBBody = await tentativaB.json();

    const idInexistente = await buscarSimulacao(getReq("http://localhost/api/simulacoes/id-que-nao-existe"), {
      params: Promise.resolve({ id: "id-que-nao-existe" }),
    });
    const idInexistenteBody = await idInexistente.json();

    expect(tentativaB.status).toBe(404);
    expect(idInexistente.status).toBe(404);
    expect(tentativaBBody).toEqual(idInexistenteBody);

    autenticarComo(usuarioA.token);
    const comoDono = await buscarSimulacao(getReq(`http://localhost/api/simulacoes/${simA.id}`), {
      params: Promise.resolve({ id: simA.id as string }),
    });
    expect(comoDono.status).toBe(200);
  });
});
