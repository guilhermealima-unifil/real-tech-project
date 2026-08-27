import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getUsuarioAutenticado } from "@/lib/auth/dal";
import { buscarSimulacaoDoUsuario } from "@/lib/historico";
import { DetalheSimulacaoSalva } from "@/components/historico/DetalheSimulacaoSalva";

const FORMATADOR_DATA = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

/**
 * Detalhe de uma simulação salva. Duas camadas de proteção, igual à rota
 * GET /api/simulacoes/[id]: sem sessão → /login; sessão válida mas
 * simulação inexistente OU de outro usuário → 404 genérico (nunca revela
 * qual dos dois casos ocorreu — `buscarSimulacaoDoUsuario` já filtra por
 * dono na própria query).
 *
 * Mostra o SNAPSHOT salvo, nunca recalcula com Ramo/ParametroTributario
 * atuais — ver DetalheSimulacaoSalva. A frase "Simulação salva em..." é só
 * contexto (texto secundário comum, sem cor de alerta) — não é um aviso de
 * problema, é o mesmo tipo de informação que qualquer histórico mostra.
 */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) return { title: "Histórico — Real Tech" };

  const { id } = await params;
  const simulacao = await buscarSimulacaoDoUsuario(id, usuario.id);
  return { title: simulacao ? `${simulacao.ramoRotulo ?? "Simulação salva"} — Real Tech` : "Histórico — Real Tech" };
}

export default async function HistoricoDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const usuario = await getUsuarioAutenticado();
  if (!usuario) {
    redirect("/login");
  }

  const { id } = await params;
  const simulacao = await buscarSimulacaoDoUsuario(id, usuario.id);
  if (!simulacao) {
    notFound();
  }

  return (
    <>
      <header>
        <Link
          href="/historico"
          className="text-xs font-medium text-text-secondary underline-offset-2 hover:text-text-primary hover:underline"
        >
          ← Voltar ao histórico
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary">
          {simulacao.ramoRotulo ?? "Simulação salva"}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Simulação salva em {FORMATADOR_DATA.format(new Date(simulacao.createdAt))}. Os valores abaixo
          são os que você viu naquele momento.
        </p>
      </header>

      <DetalheSimulacaoSalva simulacao={simulacao} />
    </>
  );
}
