# Real Tech — Guia do Projeto

Ferramenta que responde: dado o custo, a margem mínima e o preço da praça,
onde o preço pode viver em cada ano da transição do IBS/CBS (2026–2033) — e
quanto de desconto cabe antes de furar o piso. Feito para o **Solveathon
SESCAP 2026** (Contexto 01, Desafio 2), pitch em 27/08/2026.

**Leia primeiro, nesta ordem:**
1. [docs/00-plano-implementacao.md](docs/00-plano-implementacao.md) — cronograma, fases, ordem de corte, testes de aceitação, riscos.
2. [docs/01-passo-a-passo-vercel-prisma.md](docs/01-passo-a-passo-vercel-prisma.md) — como configurar Vercel, Prisma, PostgreSQL, seed.
3. [docs/02-especificacao-completa.md](docs/02-especificacao-completa.md) — dados de entrada/saída, telas, endpoints, schema, validações, roteiro de apresentação.

Em caso de divergência entre este arquivo e os documentos acima, os
documentos são a fonte de verdade — este arquivo só resume e aponta para
eles.

## Stack e decisões já tomadas

- Next.js (App Router), TypeScript, diretório `src/`, alias de import `@/*`.
- Tailwind CSS para estilo.
- ESLint (config padrão do Next.js).
- npm como gerenciador de pacotes.
- Vitest para os testes de aceitação do motor de cálculo (ainda não instalado — ver "Estado atual").
- Backend via API routes da própria Vercel; Prisma ORM + PostgreSQL (Prisma Postgres via Vercel Marketplace) — ver Documento 1.

## Estado atual do repositório

- [x] Projeto Next.js inicializado (scaffold, sem telas/módulos de negócio ainda).
- [x] Projeto criado na Vercel e ligado ao repositório (sem banco, sem Prisma ainda).
- [ ] Prisma instalado e `prisma/schema.prisma` criado (Documento 1, seções 4–6).
- [ ] Banco PostgreSQL criado na Vercel (Storage → Prisma Postgres).
- [ ] `DATABASE_URL` sincronizada localmente (`vercel env pull`).
- [ ] `lib/motor.ts` (função pura `simular()`) e os 8 testes de aceitação (Vitest).
- [ ] `prisma/seed.ts` com ramos, parâmetros 2026–2033 e os casos reais.
- [ ] API routes (`/api/ramos`, `/api/parametros`, `/api/simular`, ...).
- [ ] Telas (entrada, faixa viável, cenários, desconto, recomendação).

Isso é o ponto de partida da Fase 1 do Documento 0 — nada disso deve ser
construído sem alinhar antes, especialmente decisões de schema, contrato dos
endpoints e layout de tela.

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
npm run dev      # servidor de desenvolvimento
npm run build    # build de produção
npm run lint     # eslint
```

(Comandos de teste e de banco serão adicionados aqui quando Vitest e Prisma
forem instalados na Fase 1.)

## Skills deste projeto

- `verificar-motor` — roda os 8 testes de aceitação do motor e reporta se
  cada caso bate com o esperado (Documento 0, seção 6).
- `checklist-sprint` — percorre o checklist pré-Sprint Day (Documento 0,
  seção 10; Documento 1, seção 14) e reporta o que falta.
- `seed-db` — roda `prisma/seed.ts` e confirma que ramos, parâmetros
  2026–2033 e os casos reais foram carregados.
