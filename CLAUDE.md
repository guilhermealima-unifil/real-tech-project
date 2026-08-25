# Real Tech — Guia do Projeto

Ferramenta que responde: dado o custo, a margem mínima e o preço da praça,
onde o preço pode viver em cada ano da transição do IBS/CBS (2026–2033) — e
quanto de desconto cabe antes de furar o piso. Feito para o **Solveathon
SESCAP 2026** (Contexto 01, Desafio 2), pitch em 27/08/2026.

**Leia primeiro, nesta ordem:**
1. [docs/00-plano-implementacao.md](docs/00-plano-implementacao.md) — cronograma, fases, ordem de corte, testes de aceitação, riscos.
2. [docs/01-passo-a-passo-vercel-prisma.md](docs/01-passo-a-passo-vercel-prisma.md) — como configurar Vercel, Prisma, PostgreSQL, seed.
3. [docs/02-especificacao-completa.md](docs/02-especificacao-completa.md) — dados de entrada/saída, telas, endpoints, schema, validações, roteiro de apresentação.
4. [docs/03-checkpoint2-apresentacao.md](docs/03-checkpoint2-apresentacao.md) — narrativa do pitch do 2º Checkpoint (problema, solução, modelo de negócio, diferenciais, evidências).
5. [docs/04-dossie-consolidado.md](docs/04-dossie-consolidado.md) — dossiê completo da jornada: entrevistas na íntegra, pesquisa de concorrência, Canvas de Proposta de Valor, BMG, plano de implementação original. É o documento mais detalhado sobre o *porquê* de cada decisão de produto.

Em caso de divergência entre este arquivo e os documentos acima, os
documentos são a fonte de verdade — este arquivo só resume e aponta para
eles.

## Stack e decisões já tomadas

- Next.js (App Router), TypeScript, diretório `src/`, alias de import `@/*`.
- Tailwind CSS para estilo.
- ESLint (config padrão do Next.js).
- npm como gerenciador de pacotes.
- Vitest para os testes de aceitação do motor de cálculo (instalado).
- Backend via API routes da própria Vercel; Prisma ORM + PostgreSQL (Prisma Postgres via Vercel Marketplace) — ver Documento 1.

## Estado atual do repositório

- [x] Projeto Next.js inicializado (scaffold, sem telas/módulos de negócio ainda).
- [x] Projeto criado na Vercel, ligado ao repositório, Framework Preset = Next.js.
- [x] Banco PostgreSQL criado na Vercel (Storage → Prisma Postgres, região Washington/USA — `gru1` não disponível).
- [x] Prisma instalado (fixado em `7.10.0` — ver "Divergências do Documento 1" abaixo) e `prisma/schema.prisma` criado com os 5 modelos (Documento 1, seção 6).
- [x] Schema aplicado no banco (`prisma db push`) e Prisma Client gerado.
- [x] `DATABASE_URL` sincronizada localmente (`vercel env pull`), `.env` no `.gitignore`.
- [x] `src/lib/prisma.ts` (singleton do Prisma Client com `@prisma/adapter-pg`).
- [x] Vitest instalado.
- [ ] `src/lib/motor.ts` (função pura `simular()`) e os 8 testes de aceitação — **o algoritmo exato de como a carga tributária por ano combina com as duas fórmulas de preço ainda não está fechado, ver seção abaixo**.
- [ ] `prisma/seed.ts` com ramos, parâmetros 2026–2033 e os casos reais.
- [ ] API routes (`/api/ramos`, `/api/parametros`, `/api/simular`, ...).
- [ ] Telas (entrada, faixa viável, cenários, desconto, recomendação).

Nada da lista pendente deve ser construído sem alinhar antes, especialmente
o conteúdo do seed (parâmetros tributários ainda não validados com o
contador) e o contrato dos endpoints.

## Divergências do Documento 1 (por que o código não é uma cópia 1:1)

- **`src/` em vez de `app/` na raiz**: todo caminho do Documento 1 precisa
  de tradução — `lib/` → `src/lib/`, `app/api/...` → `src/app/api/...`.
  `prisma/` (schema, seed, migrations) fica na raiz normalmente, fora de
  `src/`.
- **Prisma Client gerado em `src/generated/prisma`** (era
  `app/generated/prisma` no documento). Import: `@/generated/prisma/client`.
  Já está no `.gitignore`.
- **`prisma7.config.ts`, não `prisma.config.ts`**: a CLI do Prisma 7.10
  gera e procura especificamente esse nome de arquivo (suporte a
  side-by-side com Prisma 8). Não renomear para `prisma.config.ts`.
- **Prisma fixado em `7.10.0` (client, CLI e adapter-pg), não "latest"**:
  o dist-tag `latest` do pacote `prisma` aponta para `8.0.0-rc.10`, uma
  release candidate com mudança arquitetural grande (client deixa de ser
  gerado como pacote tradicional) e ainda desalinhada com `@prisma/client`
  (que está em `7.10.0` estável). Não fazer upgrade para a linha 8.x sem
  decidir isso explicitamente — o CLI vai continuar avisando que há
  atualização disponível, é esperado.
- **Região do banco: Washington (USA), não `gru1` (São Paulo)** — `gru1`
  não estava disponível no Marketplace no momento da criação.
- **Prisma Postgres instalou skills de referência automaticamente** em
  `.claude/skills/prisma-*` (prisma-cli, prisma-client-api, prisma-postgres,
  prisma-upgrade-v7, etc., + `skills-lock.json`) — conteúdo oficial do
  repositório `prisma/skills`, mantido por decisão do time. Não confundir
  com as 3 skills que desenhamos para este projeto (abaixo).

## Regras não-negociáveis (extraídas dos documentos — não reabrir sem discutir)

- **O motor (`lib/motor.ts`) é uma função pura**, sem import de banco ou
  rede. Recebe os parâmetros tributários já carregados como argumento. Isso
  permite testá-lo com Vitest sem depender do Prisma.
- **As duas fórmulas de preço são obrigatórias**: multiplicador
  (`preco = custo × (1 + despesaPct + margemPct)`, caso EletroLondrina) e
  markup (`preco = custo × (1 + markupPct)`, caso In-Pacto). O Caso de Teste
  4 (aumento de carga no modelo markup: preço não muda, lucro cai) é o mais
  importante da suíte.
- **Campos monetários e percentuais usam `Decimal`, nunca `Float`.**
- **A alíquota é sugerida por ramo, nunca pedida como NCM.** Editável pelo
  usuário, mas o padrão vem da tabela `Ramo`.
- **Toda tela termina em recomendação, não em gráfico solto.** Não virar
  dashboard.
- **`/api/simular` deve funcionar sem persistir nada** — calcular sob
  demanda é suficiente; salvar simulação é bônus.
- **Ordem de corte se houver atraso** (do mais cortável ao menos): mix entre
  produtos → camada de IA para texto → módulo de caixa → terceiro cenário de
  repasse → persistência de histórico. **Faixa viável, desconto e
  recomendação nunca são cortáveis.**

## Comandos

```bash
npm run dev            # servidor de desenvolvimento
npm run build           # build de produção
npm run lint             # eslint

npx prisma validate      # valida prisma/schema.prisma
npx prisma format        # formata prisma/schema.prisma
npx prisma db push       # aplica o schema no banco (sem migration versionada)
npx prisma generate      # gera o Prisma Client em src/generated/prisma
npx tsx prisma/seed.ts   # roda o seed (quando existir)
npx vitest run           # roda os testes de aceitação do motor (quando existirem)
```
```

## Skills deste projeto

- `verificar-motor` — roda os 8 testes de aceitação do motor e reporta se
  cada caso bate com o esperado (Documento 0, seção 6).
- `checklist-sprint` — percorre o checklist pré-Sprint Day (Documento 0,
  seção 10; Documento 1, seção 14) e reporta o que falta.
- `seed-db` — roda `prisma/seed.ts` e confirma que ramos, parâmetros
  2026–2033 e os casos reais foram carregados.
- `licoes-aprendidas` — registro vivo de padrões de trabalho e erros já
  cometidos neste projeto (tooling, infra, preferências do usuário).
  Consultar antes de repetir uma decisão parecida; atualizar sempre que
  algo novo surgir.
- `prisma-cli`, `prisma-client-api`, `prisma-compute`,
  `prisma-database-setup`, `prisma-driver-adapter-implementation`,
  `prisma-mongodb-upgrade`, `prisma-postgres`, `prisma-postgres-setup`,
  `prisma-upgrade-v7` — skills de referência oficiais do Prisma
  (repositório `prisma/skills`), instaladas automaticamente pelo
  `prisma init`. Não fazem parte do design deste projeto; são material de
  consulta para tarefas envolvendo Prisma.
