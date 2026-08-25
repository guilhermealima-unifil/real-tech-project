---
name: verificar-motor
description: Roda os 8 testes de aceitação do motor de cálculo tributário (lib/motor.ts) com Vitest e reporta se cada caso bate com o esperado nos documentos — especialmente os casos 1, 2 e 4, que são os que mais importam.
---

# Verificar motor de cálculo

Confere se `lib/motor.ts` (ou `src/lib/motor.ts`) passa nos 8 testes de
aceitação descritos em
[docs/00-plano-implementacao.md](../../../docs/00-plano-implementacao.md#6-testes-de-aceitação-não-mudam-viram-testes-automatizados-hoje)
(seção 6) e detalhados em
[docs/02-especificacao-completa.md](../../../docs/02-especificacao-completa.md)
(seção 6.1).

## Pré-condição

Se `lib/motor.ts` ou os arquivos de teste (`*.test.ts` cobrindo o motor)
ainda não existirem, pare e informe que a Fase 1 (motor de cálculo) ainda
não foi implementada — não invente um motor ou testes só para satisfazer
esta skill.

## Passos

1. Rode `npm run test` (ou `npx vitest run` se não houver script `test` no
   `package.json`).
2. Confirme que existem (ou identifique quais faltam) testes cobrindo os 8
   casos:
   1. EletroLondrina, multiplicador: custo 100, despesa 20%, margem 35% →
      preço = R$ 155,00.
   2. In-Pacto, markup: custo 100, markup 30% → preço = R$ 130,00.
   3. Aumento de carga (+1 p.p.), multiplicador → preço sobe, margem-alvo em
      reais preservada.
   4. Aumento de carga (+1 p.p.), markup → **preço não muda, lucro cai**
      (o caso mais importante — prova que as duas fórmulas foram entendidas
      como diferentes).
   5. Desconto no piso: preço praticado = piso → desconto máximo = 0%.
   6. Piso acima do teto → faixa negativa e alerta disparado.
   7. Continuidade 2026→2033 → nenhum salto não explicado pelos parâmetros.
   8. Faixa estreita (piso 155, teto 160) → banda ainda legível, desconto
      máximo correto.
3. Reporte em uma tabela: caso, esperado, obtido, passou/falhou.
4. Se qualquer um dos casos 1, 2 ou 4 falhar, deixe isso em destaque no topo
   do relatório — segundo o Documento 0, "se o motor não passar nestes, ele
   está errado" e nenhuma tela deve ser construída em cima disso.
5. Não corrija o motor sozinho sem confirmar com o usuário a mudança de
   lógica — reporte o que falhou e pergunte antes de alterar a fórmula.
