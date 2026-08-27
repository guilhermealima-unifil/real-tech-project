import Link from "next/link";
import type { AlertaSimulacao } from "@/lib/historico";

/**
 * Bloco de Alertas da Home — extraído de src/app/page.tsx nesta etapa para
 * poder vir ANTES de "Últimas simulações" no grid desktop (ver CLAUDE.md
 * desta etapa, Parte 4/7) sem inchar o page.tsx. Dado já vem pronto de
 * `derivarAlertasSimulacao` (src/lib/historico.ts) — este componente só
 * apresenta, nenhuma regra de alerta nova.
 */
export function AlertasHome({ alertas }: { alertas: AlertaSimulacao[] }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-text-primary">Alertas</h2>

      {alertas.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
          Nenhum alerta nas simulações recentes.
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {alertas.map((alerta) => (
            <CardAlerta key={`${alerta.simulacaoId}-${alerta.tipo}`} alerta={alerta} />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Cor é só reforço, nunca a única pista: a mensagem ("Preço abaixo do piso
 * em 2029.") já é compreensível sem cor nenhuma (ver CLAUDE.md desta etapa,
 * Parte 14). `grave` reaproveita a mesma distinção de severidade que
 * `derivarAlertasSimulacao` já define — nenhuma severidade nova inventada.
 */
function CardAlerta({ alerta }: { alerta: AlertaSimulacao }) {
  const grave = alerta.tipo === "faixa_inviavel" || alerta.tipo === "abaixo_piso";

  return (
    <li>
      <Link
        href={`/historico/${alerta.simulacaoId}`}
        aria-label={`Ver simulação: ${alerta.nomeExibicao} — ${alerta.mensagem}`}
        className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-text-secondary"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{alerta.nomeExibicao}</p>
          <p className={"mt-0.5 text-xs font-medium " + (grave ? "text-danger" : "text-warning")}>
            {alerta.mensagem}
          </p>
        </div>
        <span aria-hidden="true" className="shrink-0 text-sm text-muted">
          Ver simulação →
        </span>
      </Link>
    </li>
  );
}
