"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface HeroHomeProps {
  /** Presente = usuário autenticado ("Olá, {nome}"); ausente = Hero público. */
  primeiroNome?: string;
}

/**
 * Hero da Home — única superfície de "identidade do produto" da tela (ver
 * CLAUDE.md desta etapa, Partes 1/2). Client Component só por causa do CTA:
 * `Button` (src/components/ui/Button.tsx) é sempre um `<button>` real, sem
 * variante "link" — em vez de estilizar um `<Link>` à mão (o que reintroduz
 * o botão-com-CSS-solto que esta etapa está justamente removendo), o clique
 * navega via `useRouter().push`, mesmo padrão já usado em
 * src/components/shell/MenuUsuario.tsx e nas páginas de login/cadastro.
 *
 * "Real Tech" some quando autenticado por decisão desta etapa (Parte 10:
 * "Não repetir 'Olá, Guilherme' em vários lugares" — o mesmo princípio vale
 * para a marca, que já aparece na Sidebar/BarraSuperiorMobile o tempo todo;
 * repeti-la aqui também não ajuda a decisão, só ocupa espaço) — mantém a
 * eyebrow só na versão deslogada, onde é a primeira coisa que a pessoa vê.
 */
export function HeroHome({ primeiroNome }: HeroHomeProps) {
  const router = useRouter();
  const autenticado = Boolean(primeiroNome);

  return (
    <header className="flex flex-col gap-5 rounded-xl border border-primary/25 bg-surface-elevated p-6 shadow-elevated sm:p-8">
      {!autenticado && (
        <p className="text-xs font-semibold tracking-wide text-muted uppercase">
          <span className="text-primary">Real</span> Tech
        </p>
      )}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
          {autenticado ? `Olá, ${primeiroNome}` : "Decida seu preço na transição IBS/CBS"}
        </h1>
        <p className="mt-2 max-w-md text-sm text-text-secondary sm:text-base">
          {autenticado
            ? "Compare custo, margem e mercado para saber quando manter, reajustar ou negociar o preço."
            : "Custo, margem mínima e preço da praça: veja onde seu preço pode viver em cada ano, de 2026 a 2033."}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button variant="primary" onClick={() => router.push("/simulador")}>
          {autenticado ? "Nova simulação" : "Começar simulação"}
        </Button>
        {!autenticado && (
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
