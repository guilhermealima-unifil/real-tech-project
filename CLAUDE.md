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

**Fase 1 (Documento 0, seção 4) está fechada.** Todos os itens abaixo até
`src/lib/frases.ts` estão prontos e testados — falta só a validação humana
dos parâmetros fiscais com o contador (docs/05), que não é um bloqueio de
código.

- [x] Projeto Next.js inicializado (scaffold, sem telas/módulos de negócio ainda).
- [x] Projeto criado na Vercel, ligado ao repositório, Framework Preset = Next.js.
- [x] Banco PostgreSQL criado na Vercel (Storage → Prisma Postgres, região Washington/USA — `gru1` não disponível).
- [x] Prisma instalado (fixado em `7.10.0` — ver "Divergências do Documento 1" abaixo) e `prisma/schema.prisma` criado com os 5 modelos (Documento 1, seção 6).
- [x] Schema aplicado no banco (`prisma db push`) e Prisma Client gerado.
- [x] `DATABASE_URL` sincronizada localmente (`vercel env pull`), `.env` no `.gitignore`.
- [x] `src/lib/prisma.ts` (singleton do Prisma Client com `@prisma/adapter-pg`).
- [x] Vitest instalado.
- [x] `src/lib/motor.ts` (função pura `simular()`) e os 8 testes de aceitação — todos passando. Algoritmo "delta desde o ano-base" (ver seção abaixo). Cenários "gradual" e "absorcao" implementados na Fase 3 (ver seção "Desenho do motor").
- [x] `src/lib/frases.ts` (`recomendacaoParaAno`) — 4 frases fixas conectadas a `mensagemRecomendacao`, com prioridade definida (faixa inviável > margem furada > desconto disponível > sem margem de desconto).
- [x] `prisma/seed.ts` — 3 ramos, 8 anos de parâmetros tributários (**provisórios**, ver docs/05), 2 empresas e os 2 casos reais (EletroLondrina, In-Pacto). Rodado e verificado contra o banco: `EletroLondrina 2026 = R$155,00`, `In-Pacto 2026 = R$130,00` (batem com os Testes 1 e 2); `In-Pacto 2033` já mostra `alertaDisparado = true` (margem cai para 26,15%, abaixo do mínimo de 30%).
- [ ] **Parâmetros tributários validados com o contador** (docs/05 tem o checklist) — pendente humano, não é código.

**Fase 2 (Documento 0, seção 4) está fechada.** API routes e a tela de
entrada + faixa viável, ponta a ponta contra o banco real.

- [x] `src/lib/validacao.ts` — validação de entrada de simulação (docs/02, seção 7.3): `custoCompra`, limites de percentuais, `margemMinimaPct ≤ margemAlvoPct`, `tetoPracaMin ≤ tetoPracaMax`, `cenarioRepasse` restrito a valores válidos. Reaproveitada por `/api/simular-cenarios` (Fase 3).
- [x] `GET /api/ramos` — lista ramos com `entraNoMvp = true`.
- [x] `GET /api/parametros` — lista os 8 anos de `ParametroTributario`.
- [x] `POST /api/simular` — valida entrada, confere `ramo.entraNoMvp`, carrega parâmetros do banco e chama `simular()`; não persiste nada. Testado ao vivo contra o banco: EletroLondrina 2026 = R$155,00 (bate com o Teste 1); rejeita `margemMinimaPct > margemAlvoPct` com 400. **Removida na Fase 3** — a tela nunca chegou a usá-la sozinha (sempre precisou dos três cenários), então virou código morto assim que `/api/simular-cenarios` entrou; ver linha abaixo.
- [x] Tela de entrada (`src/app/page.tsx`) — custo, ramo (com alíquota sugerida e aviso de estimativa), seletor de fórmula, despesa/markup, margens, regime, teto da praça opcional, botões "carregar caso real" (EletroLondrina, In-Pacto).
- [x] Tela da faixa viável (`src/components/FaixaViavelChart.tsx`) — SVG próprio (sem lib de gráfico), piso/teto/preço ano a ano, escala automática pela faixa, ano selecionável.
- [x] Painel de recomendação (`src/components/PainelRecomendacao.tsx`) — sempre visível, mostra a frase de `mensagemRecomendacao` do ano selecionado.

**Fase 3 (Documento 0, seção 4) está fechada.** Cenários de repasse e
desconto, ponta a ponta.

- [x] Motor: cenários "gradual" e "absorcao" (`src/lib/motor.ts`) e 3 novos testes (`src/lib/motor.test.ts`) — ver "Desenho do motor" abaixo. `npx vitest run` = 11 testes passando.
- [x] `POST /api/simular-cenarios` — substitui `POST /api/simular` (removida): roda os três cenários (integral/gradual/absorção) de uma vez, mesma validação/carregamento de ramo e parâmetros; devolve `{ ramo, cenarios: { integral, gradual, absorcao } }`. Testado ao vivo: `gradual` fica abaixo do `integral` nos anos intermediários e converge para o mesmo preço em 2033 (fim da transição).
- [x] Seletor de cenário (`src/app/page.tsx`) — troca qual dos três arrays já buscados é exibido no gráfico; não dispara nova requisição a cada clique.
- [x] Controle de desconto (`src/components/PainelRecomendacao.tsx`) — slider + campo numérico (%) para o desconto pedido pelo cliente; mostra, para todos os anos de uma vez, em quais o desconto ainda cabe dentro do piso e a partir de qual ano ele deixa de caber.
- A fórmula de gradual/absorção é decisão de produto (não depende do contador); os *números* que ela usa (`ParametroTributario` 2026–2033) continuam pendentes de validação — docs/05 tem a seção "Perguntas para o contador".

- [ ] `/api/simulacoes`, `/api/simulacoes/[id]`, `/api/empresas` (persistência) — bônus, não bloqueiam o Pitch. Fase 4 (regras, recomendação e deploy) e Fase 5 (caixa) — ver docs/00, seção 4.

Nada da lista pendente deve ser construído sem alinhar antes, especialmente
o contrato dos endpoints de persistência (Fase 4+) — e nenhum número da
aplicação deve ser tratado como definitivo até o checklist de docs/05 estar
marcado.

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

## Nota de produto para a Fase 2 (telas)

`tetoPraca` normalmente **não é um dado que a empresa já tem guardado** —
segundo o Dossiê (docs/04, seção 5.2), o preço do concorrente costuma
chegar no momento da venda, pelo próprio cliente. A tela de entrada não
deve tratar esse campo como obrigatório/pré-cadastrado; provavelmente
precisa ser fácil de preencher ou editar *durante* o atendimento, não só
antes. Isso não foi desenhado ainda — só registrado aqui para não se
perder até a Fase 2.

## Desenho do motor (`src/lib/motor.ts`) — decisão que não está nos documentos originais

Os documentos 0/1/2 descrevem os 8 testes de aceitação e as duas fórmulas
base, mas não especificam como a carga tributária de cada ano
(`ParametroTributario`) se combina com elas. Isso foi decidido em conversa
com o usuário, depois de ler também docs/03 e docs/04:

- **Abordagem "delta desde o ano-base" (2026)**: `despesaFixaPct`/`markupPct`,
  como o empresário informa, já incluem impostos do ano-base (ver
  entrevistas, docs/04 seção 5). Sem dado para decompor esse percentual, o
  motor soma só a *variação* da carga tributária em relação a 2026 —
  `deltaTributo(ano) = tributoTotalPct(ano) − tributoTotalPct(2026)` — em vez
  de somar a carga tributária inteira de cada ano (o que exigiria saber
  quanto do percentual original já é imposto, dado que não existe).
- **`Ramo.aliquotaSugerida` / `entrada.aliquota` não entra na fórmula** —
  é só valor de referência/exibição. Quem calcula ano a ano é sempre o
  `ParametroTributario`.
- **Unidade dos percentuais do `ParametroTributario`**: porcentagem inteira
  (`18` = 18%, igual ao exemplo de seed do Documento 1), convertida para
  fração (`÷100`) dentro do motor antes de somar com `despesaFixaPct`/
  `margemAlvoPct`/`margemMinimaPct`, que já são fração decimal (`0.20` =
  20%). Não uniformizar sem atualizar as duas pontas.
- **Precisão numérica**: `number` nativo do JS, arredondado só na saída
  (`preco`: 2 casas, percentuais: 4 casas) — decisão explícita para não
  adicionar uma lib de decimal hoje; ver `licoes-aprendidas` se isso
  precisar mudar depois.
- **`cenarioRepasse` (Fase 3)** — os três valores calculam uma *fração do
  `deltaTributo(ano)` que é repassada ao preço* (o resto fica com a
  margem): `"integral"` = fração 1 sempre (comportamento original, preço
  absorve o delta inteiro de uma vez); `"absorcao"` = fração 0 sempre
  (preço nunca sobe por causa do delta, fica congelado no nível do
  ano-base; a margem cai o quanto o delta subir); `"gradual"` = fração
  cresce linearmente de 0 a 1 entre o ano-base e o **último ano presente
  em `parametros`** (hoje 2033 — fim da transição pela LC 214/2025, ver
  docs/05) — calculado a partir do array recebido, não hardcoded, para não
  quebrar se o seed algum dia esticar o cronograma.
  - **`piso` nunca usa a fração** — reflete sempre o `deltaTributo` cheio
    do ano, porque é a régua de "quanto custaria cobrir o imposto de
    verdade", independente da estratégia de repasse escolhida. Sem isso,
    o cenário "absorção" nunca dispararia alerta de margem, o que
    contradiz o próprio propósito do cenário (mostrar quando a estratégia
    deixa de ser sustentável).
  - **Só afeta `formulaTipo === "multiplicador"`.** Decisão deliberada:
    a fórmula de markup (`preco = custo × (1 + markupPct)`) já não inclui
    `deltaTributo` no preço por definição — isso é o próprio Teste 4
    ("aumento de carga, modelo markup: preço não muda"), a regra
    não-negociável mais importante da suíte. Se `cenarioRepasse`
    alterasse o preço do markup, o comportamento default ("integral")
    quebraria o Teste 4. Então, para negócios de markup, o preço
    permanece igual a "absorção total" sempre, qualquer que seja o
    `cenarioRepasse` pedido — o motor aceita o campo mas ele não muda o
    resultado. Ver `src/lib/motor.test.ts`, describe "cenários de repasse
    (Fase 3)", para os 3 testes que travam essa decisão (gradual e
    absorção convergindo/divergindo do integral no multiplicador; markup
    ignorando o campo nos três cenários).
  - Isso é uma decisão de produto/código, não depende de validação com o
    contador — o contador só valida os *números* de `ParametroTributario`
    (docs/05), não a estratégia de repasse.
- **`mensagemRecomendacao`** é gerada por `src/lib/frases.ts`
  (`recomendacaoParaAno`) — 4 frases fixas, prioridade: faixa inviável
  (piso > teto) > margem já furada > desconto disponível > sem margem de
  desconto (preço = piso). Uma camada de IA opcional pode redigir/refinar
  isso depois; não é dependência do caminho crítico.

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
- **A rota de simulação deve funcionar sem persistir nada** — hoje é
  `/api/simular-cenarios` (Fase 3; substituiu `/api/simular` da Fase 2).
  Calcular sob demanda é suficiente; salvar simulação é bônus.
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
npx vitest run           # roda os testes de aceitação do motor
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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
