---
name: checklist-sprint
description: Percorre o checklist pré-Sprint Day do projeto Real Tech (banco criado, seed rodado, env vars conferidas, testes de aceitação passando, etc.) e reporta o que está feito e o que falta, sem marcar nada como concluído sem verificar de verdade.
---

# Checklist pré-Sprint Day

Verifica, item a item, o checklist combinado do Documento 0 (seção 10,
"Pendências antes do Sprint Day") e do Documento 1 (seção 14, "Checklist
final antes do Sprint Day"). Não marque nenhum item como feito sem checar de
fato — rode o comando ou leia o arquivo relevante.

## Itens a verificar

Para cada item, indique ✅ (confirmado), ❌ (confirmado que falta) ou ⚠️
(não deu para verificar automaticamente, precisa de checagem humana):

1. **Alíquotas dos três ramos validadas com contador** — não verificável por
   código; pergunte ao usuário se já foi feito.
2. **8 testes de aceitação passando** — rode a skill `verificar-motor` (ou
   `npm run test` diretamente) e confira especialmente os casos 1, 2 e 4.
3. **Banco PostgreSQL criado na Vercel** — verifique se existe
   `DATABASE_URL` no `.env` local (`vercel env pull` já deve ter rodado) e
   se `prisma/schema.prisma` existe.
4. **Seed rodado em produção** — não dá para confirmar via código local se
   rodou em produção; verifique se `prisma/seed.ts` existe e pergunte ao
   usuário se já rodou contra o banco de produção.
5. **`POST /api/simular` testado ponta a ponta** (navegador → banco) —
   verifique se `app/api/simular/route.ts` (ou `src/app/api/simular/route.ts`)
   existe; a execução real precisa ser confirmada pelo usuário.
6. **Variáveis de ambiente conferidas em Production na Vercel, não só em
   Development** — não verificável localmente; lembre o usuário de checar no
   dashboard da Vercel (Settings → Environment Variables).
7. **`.env` no `.gitignore`** — confira o `.gitignore` diretamente.
8. **Build de produção passa** — rode `npm run build` e reporte erros, se
   houver.

## Saída esperada

Uma lista curta, item por item, com o status e — para os itens ❌ ou ⚠️ — o
próximo passo concreto para resolver, apontando para a seção do Documento 0
ou 1 correspondente.
