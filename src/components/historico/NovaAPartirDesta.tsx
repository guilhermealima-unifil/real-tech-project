"use client";

import { useRouter } from "next/navigation";
import { useSimulation } from "@/state/SimulationProvider";
import { formStateAPartirDoHistorico } from "@/state/novaAPartirDoHistorico";
import type { SimulacaoDetalhe } from "@/lib/historico";
import { Button } from "@/components/ui/Button";

interface NovaAPartirDestaProps {
  simulacao: SimulacaoDetalhe;
}

/**
 * "Nova a partir desta" — ponto de partida para uma nova simulação a
 * partir das PREMISSAS de uma simulação salva ("e se meu custo mudar?").
 * NÃO edita nem sobrescreve o histórico: só carrega o form do simulador
 * com os inputs desta simulação (mesmo caminho de "Começar com um
 * exemplo", ver `carregarCasoReal`/`CASOS_REAIS` em SimulacaoWizard.tsx) e
 * navega para `/simulador`, de onde o fluxo normal (Simular → Salvar)
 * segue exatamente como para qualquer simulação nova — o registro salvo
 * ao final é sempre um `INSERT` novo (ver POST /api/simulacoes), nunca
 * reaproveita id/timestamps/identidade desta simulação.
 *
 * `irParaEtapa("operacao")` depois de `carregarCasoReal`: sem isso, quem
 * chega aqui vindo de fora do wizard (esta página) poderia herdar
 * `ui.etapaAtual` de uma sessão anterior (ex.: "resultado" ou "mercado") e
 * pular direto para uma etapa no meio do formulário pré-preenchido, em vez
 * de começar a revisão pela Etapa 1 como esperado.
 *
 * `SimulationProvider` vive no layout raiz (src/app/layout.tsx) — o mesmo
 * estado sobrevive à navegação client-side até `/simulador`, por isso
 * basta despachar e então `router.push`, sem nenhum canal extra para
 * passar os dados entre as duas páginas.
 */
export function NovaAPartirDesta({ simulacao }: NovaAPartirDestaProps) {
  const router = useRouter();
  const { carregarCasoReal, irParaEtapa } = useSimulation();

  function aoClicar() {
    carregarCasoReal(formStateAPartirDoHistorico(simulacao));
    irParaEtapa("operacao");
    router.push("/simulador");
  }

  return (
    <Button variant="secondary" onClick={aoClicar}>
      Nova a partir desta
    </Button>
  );
}
