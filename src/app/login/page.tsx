"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/state/AuthProvider";
import { CampoTexto } from "@/components/auth/CampoTexto";

/**
 * Quem já está autenticado é redirecionado para "/" via useEffect — não
 * precisa de middleware/proxy pra isso (pedido explícito para avaliar a
 * forma mais simples primeiro): o AuthProvider já sabe o status, e o
 * redirect é só um efeito de navegação client-side, sem checagem de banco
 * nova nenhuma.
 *
 * O formulário é renderizado otimisticamente enquanto `status === "loading"`
 * (assume "provavelmente deslogado", o caso comum de quem abre /login) em
 * vez de mostrar uma página em branco até GET /api/auth/me responder — a
 * primeira versão disto fazia o oposto e deixava a tela vazia (só o Header)
 * até a checagem terminar, mesmo para a esmagadora maioria dos visitantes
 * que não estão logados. Só quando `status` já é "autenticado" o
 * componente para de renderizar o form, porque nesse caso o useEffect
 * acima está prestes a navegar para "/".
 */
export default function LoginPage() {
  const router = useRouter();
  const { status, autenticar } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);

  useEffect(() => {
    if (status === "autenticado") router.replace("/");
  }, [status, router]);

  async function aoSubmeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return; // impede double-submit (ex.: duplo clique/Enter)
    setEnviando(true);
    setErros([]);

    try {
      const resposta = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const corpo = await resposta.json();

      if (!resposta.ok) {
        setErros(corpo.erros ?? ["Não foi possível entrar. Tente novamente."]);
        setEnviando(false);
        return;
      }

      autenticar(corpo.usuario);
      router.push("/");
    } catch {
      setErros(["Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."]);
      setEnviando(false);
    }
  }

  if (status === "autenticado") {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 py-8">
      <div className="text-center">
        <p className="text-sm font-semibold tracking-tight text-muted">
          <span className="text-primary">Real</span> Tech
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary">Entrar</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Acesse sua conta para salvar simulações e consultar seu histórico.
        </p>
      </div>

      <form
        onSubmit={aoSubmeter}
        noValidate
        className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 sm:p-8"
      >
        <CampoTexto
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={setEmail}
        />
        <CampoTexto
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={setPassword}
        />

        {erros.length > 0 && (
          <ul
            aria-live="polite"
            className="list-inside list-disc rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger"
          >
            {erros.map((erro) => (
              <li key={erro}>{erro}</li>
            ))}
          </ul>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-text-primary px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="font-medium text-primary hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
