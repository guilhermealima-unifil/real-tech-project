"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/state/AuthProvider";
import { useToast } from "@/state/ToastProvider";
import { CampoTexto } from "@/components/auth/CampoTexto";

export default function CadastroPage() {
  const router = useRouter();
  const { status, autenticar } = useAuth();
  const { toast } = useToast();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erros, setErros] = useState<string[]>([]);

  useEffect(() => {
    if (status === "autenticado") router.replace("/");
  }, [status, router]);

  async function aoSubmeter(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (enviando) return; // impede double-submit
    setEnviando(true);
    setErros([]);

    try {
      const resposta = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, password }),
      });
      const corpo = await resposta.json();

      if (!resposta.ok) {
        setErros(corpo.erros ?? ["Não foi possível criar a conta. Tente novamente."]);
        setEnviando(false);
        return;
      }

      autenticar(corpo.usuario);
      toast({
        variant: "success",
        title: "Conta criada",
        description: "Você já pode salvar suas simulações.",
      });
      router.push("/");
    } catch {
      setErros(["Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."]);
      setEnviando(false);
    }
  }

  // Renderiza o formulário mesmo com status === "loading" (mesma decisão
  // de /login/page.tsx — evita tela em branco até GET /api/auth/me
  // responder). Só para de renderizar quando já sabemos que está
  // autenticado, caso em que o useEffect acima está navegando para "/".
  if (status === "autenticado") {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 py-8">
      <div className="text-center">
        <p className="text-sm font-semibold tracking-tight text-muted">
          <span className="text-primary">Real</span> Tech
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary">Criar conta</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Guarde suas simulações e volte a consultá-las quando precisar.
        </p>
      </div>

      <form
        onSubmit={aoSubmeter}
        noValidate
        className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 sm:p-8"
      >
        <CampoTexto label="Nome" type="text" autoComplete="name" required value={nome} onChange={setNome} />
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
          autoComplete="new-password"
          required
          minLength={8}
          helper="Pelo menos 8 caracteres."
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
          {enviando ? "Criando conta…" : "Criar conta"}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Já tem conta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  );
}
