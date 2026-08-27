---
name: seed-db
description: Roda prisma/seed.ts contra o banco apontado pela DATABASE_URL atual e confirma que os ramos, os parâmetros tributários 2026-2033 e os dois casos reais (EletroLondrina e In-Pacto) foram carregados corretamente.
---

# Rodar seed do banco

Executa o seed descrito no Documento 1 (seção 11) e confere o resultado —
não assuma sucesso só porque o comando não deu erro.

## Pré-condição

Se `prisma/schema.prisma` ou `prisma/seed.ts` ainda não existirem, pare e
informe que a Fase 1 (schema + seed) ainda não foi implementada. Não crie um
seed do zero sem alinhar antes o conteúdo com o usuário — os parâmetros
tributários 2026–2033 precisam ser validados com o contador antes de virarem
dados "reais" no banco (Documento 0, seção 10).

## Antes de rodar

1. Confirme qual `DATABASE_URL` está ativa (`.env` local) — pergunte ao
   usuário se é o banco de desenvolvimento ou o de produção antes de rodar,
   já que o seed usa `skipDuplicates` mas ainda assim grava dados reais.

## Passos

1. Rode `npx tsx prisma/seed.ts` (ou `npx prisma db seed` se estiver
   registrado no `package.json`).
2. Depois de rodar, confirme via Prisma Client ou uma query direta que:
   - A tabela `Ramo` tem os três ramos do MVP (eletro, eletrico, vestuario).
   - A tabela `ParametroTributario` tem uma linha para cada ano de 2026 a
     2033, sem lacunas.
   - Os casos reais (EletroLondrina e In-Pacto) existem, se o seed incluir
     simulações pré-carregadas.
3. Rode rapidamente os dois casos de teste mais críticos contra o endpoint
   ou a função `simular()`, se já existir:
   - EletroLondrina (custo 100, despesa 20%, margem 35%) → preço R$ 155,00.
   - In-Pacto (custo 100, markup 30%) → preço R$ 130,00.
4. Reporte o que foi carregado, o que faltou e, se algum dos dois números
   acima não bater, pare e avise antes de considerar o seed concluído.
