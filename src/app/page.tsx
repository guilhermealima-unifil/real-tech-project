import Link from "next/link";
import { getUsuarioAutenticado } from "@/lib/auth/dal";
import {
  derivarAlertasSimulacao,
  listarSimulacoesDoUsuario,
  nomeExibicaoSimulacao,
  ROTULO_STATUS_PRECO,
  type AlertaSimulacao,
  type SimulacaoResumo,
} from "@/lib/historico";
import { formatarReais } from "@/lib/frases";

/**
 * Home (`/`) — deixou de ser um redirect para `/simulador` nesta etapa
 * (ver src/app/simulador/page.tsx, que continua com o conteúdo do
 * simulador intocado). Server Component: busca os dados direto pela DAL
 * (`getUsuarioAutenticado` + `listarSimulacoesDoUsuario`, as mesmas
 * funções que /historico já usa — nenhuma API nova, nenhuma query
 * duplicada) e resolve os dois estados (deslogado/logado) inteiramente no
 * servidor. Sem "use client", sem skeleton: a página já chega pronta.
 *
 * Nada aqui chama `simular()` — `listarSimulacoesDoUsuario` só lê o
 * snapshot já persistido (ver src/lib/historico.ts).
 */

export const metadata = {
  title: "Real Tech — faixa viável de preço na transição IBS/CBS",
};

const FORMATADOR_DATA_CURTA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const LIMITE_ULTIMAS_SIMULACOES = 4;
const LIMITE_ALERTAS = 3;

export default async function HomePage() {
  const usuario = await getUsuarioAutenticado();

  if (!usuario) {
    return <HomeDeslogada />;
  }

  const simulacoes = await listarSimulacoesDoUsuario(usuario.id);
  const ultimas = simulacoes.slice(0, LIMITE_ULTIMAS_SIMULACOES);
  // Varre TODAS as simulações buscadas (não só as `ultimas` exibidas
  // abaixo) — um problema numa simulação salva há mais tempo ainda merece
  // aparecer aqui, mesmo que ela não caiba na prévia de "últimas". Mesma
  // query que /historico já roda sem paginação; nenhum I/O extra.
  const todosAlertas = simulacoes.flatMap(derivarAlertasSimulacao);
  const alertas = todosAlertas.slice(0, LIMITE_ALERTAS);
  const totalComAtencao = new Set(todosAlertas.map((a) => a.simulacaoId)).size;
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0];

  return (
    <>
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Olá, {primeiroNome}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Acompanhe suas últimas decisões de preço e veja o que merece atenção.
        </p>
      </header>

      <Link
        href="/simulador"
        className="self-start rounded-lg bg-text-primary px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Nova simulação
      </Link>

      <div className="grid grid-cols-2 gap-3 sm:max-w-sm">
        <IndicadorResumo rotulo="Total salvo" valor={simulacoes.length} />
        <IndicadorResumo
          rotulo="Com atenção"
          valor={totalComAtencao}
          destaque={totalComAtencao > 0}
        />
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-text-primary">Últimas simulações</h2>
          {simulacoes.length > 0 && (
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

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-text-primary">Alertas</h2>

        {alertas.length === 0 ? (
          <p className="rounded-xl border border-border bg-surface p-4 text-sm text-text-secondary">
            Suas simulações recentes não têm alertas críticos.
          </p>
        ) : (
          <ul className="flex flex-col gap-2.5">
            {alertas.map((alerta) => (
              <CardAlerta key={`${alerta.simulacaoId}-${alerta.tipo}`} alerta={alerta} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function IndicadorResumo({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: number;
  destaque?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs text-muted">{rotulo}</p>
      <p
        className={
          "font-figures mt-1 text-2xl font-semibold " +
          (destaque ? "text-warning" : "text-text-primary")
        }
      >
        {valor}
      </p>
    </div>
  );
}

/**
 * Card compacto de "última simulação" — deliberadamente mais enxuto que
 * `ItemHistorico` (src/app/historico/page.tsx): mostra só nome/ramo/data/
 * preço recomendado/status, sem custo/fórmula/cenário (o histórico
 * completo já cobre isso, um clique adiante). Reaproveita
 * `nomeExibicaoSimulacao`/`ROTULO_STATUS_PRECO` do histórico — nenhuma
 * regra de fallback/status duplicada.
 *
 * "Preço recomendado" aqui é sempre `item.precoRecomendado`, já calculado
 * por `listarSimulacoesDoUsuario` a partir do ano-base (2026) do cenário
 * "integral" — a mesma convenção que /historico já usa, não uma agregação
 * nova.
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
            <p className="text-xs text-muted">Recomendado</p>
            <p className="font-figures text-sm font-medium text-text-primary">
              {item.precoRecomendado !== null ? `R$ ${formatarReais(item.precoRecomendado)}` : "—"}
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

/**
 * Card de alerta — aponta direto para a simulação (`/historico/${id}`).
 * Cor é só reforço, nunca a única pista: a mensagem ("Preço abaixo do
 * piso em 2029.") já é compreensível sem cor nenhuma (ver CLAUDE.md desta
 * etapa, Parte 15).
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

/**
 * Home pública — o simulador continua acessível sem login (ver
 * CLAUDE.md desta etapa, Parte 3), então `/` precisa funcionar mesmo
 * deslogado. Texto e significado preservados do antigo cabeçalho do
 * simulador (agora só em src/app/simulador/page.tsx, sem duplicar aqui —
 * a versão daqui é a de entrada/apresentação, mais curta).
 */
function HomeDeslogada() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-10 text-center">
      <p className="text-sm font-semibold tracking-tight text-muted">
        <span className="text-primary">Real</span> Tech
      </p>

      <div className="max-w-xl">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
          Real Tech — faixa viável de preço na transição IBS/CBS
        </h1>
        <p className="mt-3 text-sm text-text-secondary sm:text-base">
          Custo, margem mínima e preço da praça: descubra onde seu preço pode
          viver em cada ano da transição, de 2026 a 2033.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/simulador"
          className="rounded-lg bg-text-primary px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Começar simulação
        </Link>
        <Link href="/login" className="text-sm font-medium text-primary hover:underline">
          Entrar
        </Link>
      </div>
    </div>
  );
}
