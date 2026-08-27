import Link from "next/link";
import { redirect } from "next/navigation";
import { getUsuarioAutenticado } from "@/lib/auth/dal";
import {
  listarSimulacoesDoUsuario,
  nomeExibicaoSimulacao,
  ROTULO_STATUS_PRECO,
  type SimulacaoResumo,
} from "@/lib/historico";
import { formatarReais } from "@/lib/frases";
import type { CenarioRepasse } from "@/lib/motor";

// Mesmos rótulos de CENARIOS em ResultadoSimulacao.tsx/DetalheSimulacaoSalva.tsx
// — "integral"/"gradual"/"absorcao" são nomes de código, não texto para o
// usuário ler cru na listagem.
const ROTULO_CENARIO: Record<CenarioRepasse, string> = {
  integral: "Repasse integral",
  gradual: "Repasse gradual",
  absorcao: "Absorção",
};

const FORMATADOR_DATA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function ItemHistorico({ item }: { item: SimulacaoResumo }) {
  const status = item.status ? ROTULO_STATUS_PRECO[item.status] : null;
  const dataFormatada = FORMATADOR_DATA.format(new Date(item.createdAt));
  const nome = nomeExibicaoSimulacao(item.nomeProduto, item.ramoRotulo);
  const ramo = item.ramoRotulo ?? "Ramo não informado";

  return (
    <li>
      <Link
        href={`/historico/${item.id}`}
        aria-label={`Ver simulação: ${nome}, salva em ${dataFormatada}`}
        className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-text-secondary sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{nome}</p>
          <p className="mt-0.5 break-words text-xs text-text-secondary">
            {ramo} · {dataFormatada} · Custo R$ {formatarReais(item.custoCompra)} ·{" "}
            {item.formulaTipo === "markup" ? "Markup" : "Multiplicador"}
            {item.anoPrincipal !== null &&
              ` · ${ROTULO_CENARIO[item.cenarioPrincipal]} ${item.anoPrincipal}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
          <div className="sm:text-right">
            <p className="text-xs text-muted">Preço da estratégia</p>
            <p className="font-figures text-sm font-medium text-text-primary">
              {item.precoAnalisado !== null ? `R$ ${formatarReais(item.precoAnalisado)}` : "—"}
            </p>
          </div>
          {status && (
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${status.classe}`}>
              {status.rotulo}
            </span>
          )}
          <span aria-hidden="true" className="shrink-0 text-sm text-muted">
            Ver simulação →
          </span>
        </div>
      </Link>
    </li>
  );
}

/**
 * Requer autenticação no nível da própria página (sem middleware/proxy
 * global, ver CLAUDE.md desta etapa): Server Component que checa
 * `getUsuarioAutenticado()` e redireciona para /login se não houver
 * sessão — mesmo padrão documentado em node_modules/next/dist/docs
 * (auth checks em page components).
 *
 * Lista deliberadamente enxuta (nada de dashboard/gráfico/métrica
 * agregada) — só o suficiente para reconhecer e abrir uma simulação.
 */

export const metadata = { title: "Histórico — Real Tech" };

export default async function HistoricoPage() {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    redirect("/login");
  }

  const simulacoes = await listarSimulacoesDoUsuario(usuario.id);

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Histórico</h1>
        <p className="mt-1 text-sm text-text-secondary">Suas simulações salvas, mais recentes primeiro.</p>
      </header>

      {simulacoes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-sm text-text-secondary">Você ainda não salvou nenhuma simulação.</p>
          <Link
            href="/simulador"
            className="rounded-lg bg-text-primary px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Fazer uma simulação
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {simulacoes.map((item) => (
            <ItemHistorico key={item.id} item={item} />
          ))}
        </ul>
      )}
    </>
  );
}
