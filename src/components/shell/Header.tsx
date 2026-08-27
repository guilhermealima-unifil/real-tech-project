"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSimulation } from "@/state/SimulationProvider";
import { useAuth } from "@/state/AuthProvider";

/**
 * Header global do shell (Real Tech Identity — ver docs/06-design-system.md).
 * Nav final (etapa de polimento): deslogado = Simulador + Entrar; logado =
 * Simulador + Histórico + nome + Sair. "Como funciona" foi removido — era
 * um item "em breve" sem rota nenhuma, e o nav final não previa essa
 * entrada; mantê-lo como enfeite permanente não fazia mais sentido.
 *
 * Bloco de autenticação: "Entrar" deslogado, primeiro nome + "Sair"
 * autenticado. Enquanto `status === "loading"` (checagem inicial de
 * GET /api/auth/me em AuthProvider), não mostra nada nesse espaço — evita
 * piscar "Entrar" e trocar pro nome um instante depois a cada carregamento.
 *
 * "Histórico" é rota real (/historico), mas só faz sentido para quem está
 * autenticado — a própria página redireciona para /login se não estiver
 * (ver src/app/historico/page.tsx). Em vez de esconder o item quando
 * deslogado (o usuário não saberia que a função existe), ele aponta direto
 * para /login — mesmo destino que a página daria de qualquer forma, um
 * clique a menos.
 *
 * `aria-current="page"` agora reflete a rota de verdade via `usePathname()`
 * (antes estava fixo em "Simulador", errado em qualquer outra página —
 * inclusive /historico, que também é um item de nav).
 */
export function Header() {
  const { state, novaSimulacao } = useSimulation();
  const { status, usuario, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const emResultado = state.ui.etapaAtual === "resultado" && state.resultado !== null;
  const primeiroNome = usuario?.nome.trim().split(/\s+/)[0];
  const emHistorico = pathname === "/historico" || pathname.startsWith("/historico/");

  async function aoSair() {
    await logout();
    router.push("/");
  }

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex w-full max-w-[840px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4">
        <Link href="/" className="shrink-0 text-base font-semibold tracking-tight text-text-primary">
          <span className="text-primary">Real</span> Tech
        </Link>

        <nav aria-label="Principal" className="flex flex-1 flex-wrap items-center gap-1 text-sm">
          <Link
            href="/"
            aria-current={!emHistorico ? "page" : undefined}
            className={
              !emHistorico
                ? "rounded-md bg-primary/10 px-3 py-1.5 font-medium text-primary"
                : "rounded-md px-3 py-1.5 font-medium text-text-secondary hover:text-text-primary"
            }
          >
            Simulador
          </Link>
          <Link
            href={status === "autenticado" ? "/historico" : "/login"}
            aria-current={emHistorico ? "page" : undefined}
            className={
              emHistorico
                ? "rounded-md bg-primary/10 px-3 py-1.5 font-medium text-primary"
                : "rounded-md px-3 py-1.5 font-medium text-text-secondary hover:text-text-primary"
            }
          >
            Histórico
          </Link>
        </nav>

        <div className="flex shrink-0 items-center gap-4">
          {/* Só aparece com um resultado fechado na tela — durante o wizard,
              "nova simulação" já é o estado atual (ambíguo, potencialmente
              destrutivo de dados que o usuário acabou de digitar). Reaproveita
              novaSimulacao() do SimulationProvider, mesma ação do botão que já
              existe em ResultadoSimulacao — nenhuma lógica de reset nova. */}
          {emResultado && (
            <button
              type="button"
              onClick={novaSimulacao}
              className="rounded-md bg-text-primary px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            >
              + Nova simulação
            </button>
          )}

          {status === "autenticado" && usuario ? (
            <div className="flex items-center gap-3 text-sm">
              <span className="text-text-secondary">{primeiroNome}</span>
              <button
                type="button"
                onClick={aoSair}
                className="font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                Sair
              </button>
            </div>
          ) : status === "deslogado" ? (
            <Link
              href="/login"
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              Entrar
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
