import { getUsuarioAutenticado } from "@/lib/auth/dal";
import { derivarAlertasSimulacao, listarSimulacoesDoUsuario } from "@/lib/historico";
import { HeroHome } from "@/components/home/HeroHome";
import { AlertasHome } from "@/components/home/AlertasHome";
import { UltimasSimulacoesHome } from "@/components/home/UltimasSimulacoesHome";

/**
 * Home (`/`) — Server Component: busca os dados direto pela DAL
 * (`getUsuarioAutenticado` + `listarSimulacoesDoUsuario`, as mesmas
 * funções que /historico já usa — nenhuma API nova, nenhuma query
 * duplicada) e resolve os dois estados (deslogado/logado) inteiramente no
 * servidor. Sem "use client" aqui — só `HeroHome` (src/components/home/HeroHome.tsx)
 * precisa de client-side, por causa do CTA.
 *
 * Nada aqui chama `simular()` — `listarSimulacoesDoUsuario` só lê o
 * snapshot já persistido (ver src/lib/historico.ts).
 *
 * Redesenho desta etapa (ver CLAUDE.md): Hero com identidade do produto no
 * topo, Alertas ANTES de Últimas simulações (prioridade de decisão), e os
 * KPIs "Total salvo"/"Com atenção" removidos — não agregavam decisão, e o
 * "0/N com atenção" já fica implícito no estado neutro/preenchido de
 * `AlertasHome`.
 */

export const metadata = {
  title: "Real Tech — faixa viável de preço na transição IBS/CBS",
};

const LIMITE_ULTIMAS_SIMULACOES = 4;
const LIMITE_ALERTAS = 3;

export default async function HomePage() {
  const usuario = await getUsuarioAutenticado();

  if (!usuario) {
    return <HeroHome />;
  }

  const simulacoes = await listarSimulacoesDoUsuario(usuario.id);
  const ultimas = simulacoes.slice(0, LIMITE_ULTIMAS_SIMULACOES);
  // Varre TODAS as simulações buscadas (não só as `ultimas` exibidas
  // abaixo) — um problema numa simulação salva há mais tempo ainda merece
  // aparecer aqui, mesmo que ela não caiba na prévia de "últimas". Mesma
  // query que /historico já roda sem paginação; nenhum I/O extra.
  const alertas = simulacoes.flatMap(derivarAlertasSimulacao).slice(0, LIMITE_ALERTAS);
  const primeiroNome = usuario.nome.trim().split(/\s+/)[0];

  return (
    <>
      <HeroHome primeiroNome={primeiroNome} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:items-start">
        <div className="lg:col-span-2">
          <AlertasHome alertas={alertas} />
        </div>
        <div className="lg:col-span-3">
          <UltimasSimulacoesHome ultimas={ultimas} mostrarLinkHistorico={simulacoes.length > 0} />
        </div>
      </div>
    </>
  );
}
