# Real Tech — instruções operacionais

## Produto

O Real Tech ajuda varejistas a decidir onde o preço pode viver durante a
transição do IBS/CBS (2026–2033), considerando custo, margem mínima e preço da
praça. A aplicação compara preço, margem, desconto seguro e impacto no caixa e
termina em recomendações baseadas no motor determinístico.

## Stack atual

- Next.js (App Router), TypeScript e diretório `src/`.
- Tailwind CSS.
- Prisma ORM `7.10.0` com PostgreSQL e `@prisma/adapter-pg`.
- Vitest.
- npm.

## Validação oficial

Execute as verificações relevantes para a mudança. Antes de concluir uma
alteração de aplicação, a bateria completa é:

```bash
npx vitest run
npx eslint .
npx tsc --noEmit
npm run build
```

Não declare sucesso sem executar as verificações pertinentes e relatar
claramente qualquer etapa que não pôde ser executada.

## Invariantes não negociáveis

- Não altere regras tributárias sem justificativa explícita e alinhamento com
  o usuário. Os parâmetros continuam provisórios até validação contábil,
  conforme `docs/05-parametros-tributarios-provisorios.md`.
- `src/lib/motor.ts` e seus testes são a autoridade executável do cálculo. O
  motor deve permanecer puro e determinístico, sem banco ou rede.
- Uma camada futura de IA pode interpretar resultados calculados; nunca pode
  inventar números ou regras tributárias.
- Snapshots históricos são lidos como foram persistidos. Nunca chame o motor
  para recalculá-los durante a leitura.
- Mudanças de schema devem gerar migrations versionadas. Não use `prisma db
  push` para evoluir o schema deste projeto.
- Preserve autenticação, isolamento por usuário e verificações de ownership em
  qualquer leitura ou escrita persistida.
- As duas fórmulas existentes, multiplicador e markup, têm semânticas
  diferentes. No markup, os cenários de repasse não alteram o preço por
  definição atual do motor.
- Percentuais persistidos usam `Decimal`, nunca `Float`. Respeite as unidades
  usadas em cada contrato antes de converter valores.
- Toda análise deve terminar em uma recomendação compreensível; não transforme
  o produto em um dashboard de gráficos soltos.

## Regras de trabalho

- Leia o código e os testes relevantes antes de presumir comportamento.
- Faça mudanças pequenas, verificáveis e restritas ao pedido.
- Não implemente funcionalidades extras nem faça refactors sem necessidade.
- Não instale ou atualize dependências sem necessidade e justificativa.
- Não faça commit ou push salvo quando o usuário solicitar explicitamente.
- Nunca exponha secrets ou connection strings completos em comandos, logs ou
  respostas.
- Antes de alterar código Next.js, consulte a documentação correspondente em
  `node_modules/next/dist/docs/`; esta versão pode divergir de conhecimento
  anterior sobre APIs e convenções.

## Precedência das fontes

### Comportamento executável

1. Código atual.
2. Testes atuais.
3. Documentação vigente e específica do assunto.
4. Documentação histórica.

Uma divergência entre código e teste não autoriza escolher silenciosamente um
deles: identifique o conflito e alinhe a regra antes de mudar comportamento.

### Regras tributárias

1. Código e testes implementados descrevem o comportamento atual.
2. `docs/05-parametros-tributarios-provisorios.md` contém as ressalvas humanas
   e contábeis vigentes.
3. `docs/02-especificacao-completa.md`, `docs/03-checkpoint2-apresentacao.md` e
   `docs/04-dossie-consolidado.md` são contexto histórico quando conflitarem
   com decisões posteriores.

O comportamento atual não torna os parâmetros fiscais definitivos; a
pendência de validação contábil permanece.

### Produto e arquitetura

- Decisões mais recentes comprovadas pelo código, testes e documentação
  vigente prevalecem.
- `docs/03` e `docs/04` preservam discovery, entrevistas e evidências, mas não
  necessariamente representam a arquitetura atual.
- Registre e comunique conflitos relevantes em vez de reintroduzir uma decisão
  histórica silenciosamente.

## Mapa de documentação progressiva

Leia somente o material necessário para a tarefa:

- **Produto, discovery, pitch e evidências:**
  `docs/03-checkpoint2-apresentacao.md` e
  `docs/04-dossie-consolidado.md`.
- **Regras tributárias, parâmetros provisórios, regime e split payment:**
  `docs/05-parametros-tributarios-provisorios.md`.
- **Design, UX, tokens, responsividade e gráficos:**
  `docs/06-design-system.md`.
- **Plano e especificação histórica:** `docs/00-plano-implementacao.md` e
  `docs/02-especificacao-completa.md`.
- **Setup histórico de Vercel, PostgreSQL e Prisma:**
  `docs/01-passo-a-passo-vercel-prisma.md`; confirme comandos e convenções
  contra o código atual e as skills Prisma antes de aplicá-los.
- **Registro de verificação anterior e roteiro manual:**
  `docs/07-verificacao-final.md`; trate contagens e estado de implementação
  como retrato do momento em que foi escrito.
- **Contratos executáveis do motor:** `src/lib/motor.ts` e testes associados.
- **Schema e persistência:** `prisma/schema.prisma`, migrations e testes/API
  atuais.

## Skills

- Use uma skill específica quando o catálogo indicar correspondência clara
  com a tarefa.
- Carregue o `SKILL.md` e suas referências progressivamente; não abra todas as
  skills em toda tarefa.
- Skills locais do Real Tech prevalecem sobre exemplos genéricos quando houver
  uma decisão específica já registrada no projeto.
- Para manter Codex e Claude Code alinhados, qualquer mudança conceitual numa
  skill Real Tech em `.agents/skills` deve ser auditada e, quando pertinente,
  aplicada semanticamente à equivalente em `.claude/skills`. Diferenças devem
  se limitar a mecanismos próprios de cada ferramenta.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
