"use client";

/**
 * Apresentação read-only de uma simulação salva (/historico/[id]) — reusa
 * a mesma navegação de análise da simulação ao vivo (NavegacaoAnalise,
 * ver src/components/simulacao/ResultadoSimulacao.tsx), controlada aqui
 * por `useState` local em vez do estado global do simulador
 * (`useSimulation()`): este componente não está — e não deveria ficar —
 * acoplado ao reducer ao vivo, só ao snapshot que já veio pronto do banco.
 *
 * Nenhum recálculo: `simulacao.cenarios`/`impactoCaixa` já vêm prontos do
 * snapshot gravado — este componente só decide qual ano/cenário/seção
 * mostrar.
 *
 * Ramo e data de salvamento já aparecem no <header> de
 * src/app/historico/[id]/page.tsx — não repetidos aqui.
 */

import { useState } from "react";
import type { CenarioRepasse } from "@/lib/motor";
import type { SimulacaoDetalhe } from "@/lib/historico";
import { NavegacaoAnalise } from "@/components/simulacao/NavegacaoAnalise";

interface DetalheSimulacaoSalvaProps {
  simulacao: SimulacaoDetalhe;
}

export function DetalheSimulacaoSalva({ simulacao }: DetalheSimulacaoSalvaProps) {
  const [cenarioSelecionado, setCenarioSelecionado] = useState<CenarioRepasse>("integral");
  const resultadosDoCenario = simulacao.cenarios[cenarioSelecionado];
  const [anoSelecionado, setAnoSelecionado] = useState<number>(
    resultadosDoCenario[0]?.ano ?? new Date().getFullYear(),
  );
  const [descontoPedidoPct, setDescontoPedidoPct] = useState(0);

  const cenarioIrrelevante = simulacao.formulaTipo === "markup";

  return (
    <NavegacaoAnalise
      cenarioSelecionado={cenarioSelecionado}
      onSelecionarCenario={setCenarioSelecionado}
      cenarioIrrelevante={cenarioIrrelevante}
      resultados={resultadosDoCenario}
      anoSelecionado={anoSelecionado}
      onSelecionarAno={setAnoSelecionado}
      custoCompra={simulacao.custoCompra}
      descontoPedidoPct={descontoPedidoPct}
      onDescontoPedidoChange={setDescontoPedidoPct}
      impactoCaixa={simulacao.impactoCaixa}
    />
  );
}
