import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { hashPassword } from "@/lib/auth/crypto";
import { createSession } from "@/lib/auth/session";
import { setSessionCookie } from "@/lib/auth/cookie";
import { validarEntradaRegistro } from "@/lib/auth/validacao";
import { paraUsuarioPublico } from "@/lib/auth/usuario";

const EMAIL_JA_CADASTRADO = "Este e-mail já está cadastrado.";

/**
 * Cadastro. E-mail duplicado é tratado em duas camadas: um `findUnique`
 * primeiro (resposta rápida e clara no caso comum, sem gastar o custo de
 * hashear a senha com Argon2id à toa) e o `catch` de P2002 no `create`
 * depois (a garantia de verdade — cobre a corrida entre duas requisições
 * simultâneas com o mesmo e-mail, que o `findUnique` sozinho não cobre).
 *
 * Duplicidade de e-mail aqui é revelada explicitamente (409 + mensagem
 * clara) — decisão já registrada na proposta de arquitetura: sem fluxo de
 * recuperação de senha ainda, esconder isso no cadastro não protege nada
 * de verdade e só piora a UX. O que precisa ser genérico é o LOGIN (ver
 * login/route.ts), não o cadastro.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ erros: ["Corpo da requisição deve ser JSON válido."] }, { status: 400 });
  }

  const validacao = validarEntradaRegistro(body);
  if (!validacao.ok) {
    return NextResponse.json({ erros: validacao.erros }, { status: 400 });
  }
  const { nome, email, password } = validacao.entrada;

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json({ erros: [EMAIL_JA_CADASTRADO] }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await prisma.user.create({ data: { nome, email, passwordHash } });
  } catch (erro) {
    if (erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002") {
      return NextResponse.json({ erros: [EMAIL_JA_CADASTRADO] }, { status: 409 });
    }
    return NextResponse.json({ erros: ["Não foi possível criar a conta. Tente novamente."] }, { status: 500 });
  }

  const { token } = await createSession(user.id);
  await setSessionCookie(token);

  return NextResponse.json({ usuario: paraUsuarioPublico(user) }, { status: 201 });
}
