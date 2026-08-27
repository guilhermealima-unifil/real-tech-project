import Link from "next/link";
import {
  nomeExibicaoSimulacao,
  ROTULO_STATUS_PRECO,
  type SimulacaoResumo,
} from "@/lib/historico";
import { formatarReais } from "@/lib/frases";

const FORMATADOR_DATA_CURTA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/**
 * Bloco de "Últimas simulações" da Home — extraído de src/app/page.tsx
 * nesta etapa (ver CLAUDE.md desta etapa, Parte 11), mesmo conteúdo de
 * antes. `ultimas` já vem cortado em `LIMITE_ULTIMAS_SIMULACOES` (3-4) por
 * quem chama; `mostrarLinkHistorico` decide o link "Ver histórico
 * completo" a partir do TOTAL de simulações (não só das exibidas aqui) —
 * mesma regra de antes.
 */
export function UltimasSimulacoesHome({
  ultimas,
  mostrarLinkHistorico,
}: {
  ultimas: SimulacaoResumo[];
  mostrarLinkHistorico: boolean;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-text-primary">Últimas simulações</h2>
        {mostrarLinkHistorico && (
          <Link
            href="/historico"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            Ver histórico completo →
          </Link>
        )}
      </div>

      {ultimas.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-secondary">
          Você ainda não salvou nenhuma simulação.{" "}
          <Link href="/simulador" className="font-medium text-primary hover:underline">
            Fazer a primeira simulação
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {ultimas.map((item) => (
            <CardUltimaSimulacao key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Card compacto de "última simulação" — deliberadamente mais enxuto que
 * `ItemHistorico` (src/app/historico/page.tsx): mostra só nome/ramo/data/
 * preço da estratégia/status, sem custo/fórmula/cenário (o histórico
 * completo já cobre isso, um clique adiante). Reaproveita
 * `nomeExibicaoSimulacao`/`ROTULO_STATUS_PRECO` do histórico — nenhuma
 * regra de fallback/status duplicada.
 *
 * "Preço da estratégia" aqui é sempre `item.precoAnalisado`, já calculado
 * por `listarSimulacoesDoUsuario` a partir do ano-base (2026) do cenário
 * "integral" — a mesma convenção que /historico já usa, não uma agregação
 * nova. Nenhuma correção automática de piso: é o `ResultadoAno.preco`
 * persistido, tal como foi salvo.
 */
function CardUltimaSimulacao({ item }: { item: SimulacaoResumo }) {
  const nome = nomeExibicaoSimulacao(item.nomeProduto, item.ramoRotulo);
  const ramo = item.ramoRotulo ?? "Ramo não informado";
  const dataFormatada = FORMATADOR_DATA_CURTA.format(new Date(item.createdAt));
  const status = item.status ? ROTULO_STATUS_PRECO[item.status] : null;

  return (
    <li>
      <Link
        href={`/historico/${item.id}`}
        aria-label={`Ver simulação: ${nome}`}
        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-text-secondary"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{nome}</p>
          <p className="mt-0.5 truncate text-xs text-text-secondary">
            {ramo} · {dataFormatada}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-muted">Preço da estratégia</p>
            <p className="font-figures text-sm font-medium text-text-primary">
              {item.precoAnalisado !== null ? `R$ ${formatarReais(item.precoAnalisado)}` : "—"}
            </p>
          </div>
          {status && (
            <span
              className={`hidden shrink-0 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-block ${status.classe}`}
            >
              {status.rotulo}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
