# Real Tech — Verificação Final e Testes Manuais

**Data da auditoria: 25/08/2026** (véspera do Sprint Day de 26/08 e do
Pitch de 27/08). Este documento consolida uma verificação completa do
estado atual do repositório: testes automatizados, varredura de bugs,
Clean Code/arquitetura, funções, componentes, UI, UX, design e
responsividade — e fecha com 3 testes manuais para rodar contra o deploy
em produção (`https://real-tech-project.vercel.app`).

**Veredito resumido:** o núcleo do produto (motor, faixa viável, três
cenários de repasse, desconto, recomendação, impacto no caixa) está
implementado, testado e funcionando — as Fases 1 a 5 descritas no
`CLAUDE.md` estão de fato fechadas no código. Nenhum item da lista "não
cortável" (docs/00, seção 7: faixa viável, desconto, recomendação) está
faltando ou quebrado. O que restava: (1) um gap funcional real (`regime`
não influenciava o cálculo, embora a especificação dissesse que deveria)
— **resolvido removendo o campo até a regra ser validada com o contador**
(ver seção 3 e docs/05), (2) lacunas de robustez/acessibilidade — também
**corrigidas** (ver seções 4 e 5), e (3) a validação humana dos
parâmetros tributários com o contador, já conhecida e fora do escopo de
código (docs/05).

---

## 1. Testes automatizados

```
npx vitest run   → 15 testes passando (1 arquivo, src/lib/motor.test.ts)
npx eslint .      → sem erros
npx tsc --noEmit  → sem erros de tipo
npm run build     → build de produção concluído sem erros
```

Os 8 testes de aceitação do Documento 0 (seção 6) — incluindo o Teste 4
("aumento de carga no modelo markup: preço não muda, lucro cai"), o mais
importante da suíte — continuam passando, mais os 7 testes adicionais das
Fases 3 e 5 (cenários de repasse e impacto no caixa).

## 2. Bugs corrigidos nesta auditoria

Dois bugs de baixo risco, sem nenhuma decisão de produto envolvida, foram
corrigidos diretamente:

- **`src/app/layout.tsx`** — `<html lang="en">` com todo o conteúdo em
  português → corrigido para `lang="pt-BR"` (afeta leitores de tela e
  SEO).
- **`src/app/globals.css`** — `body { font-family: Arial, ... }`
  sobrescrevia a fonte Geist carregada em `layout.tsx` (a variável
  `--font-sans` nunca chegava a ser aplicada) → corrigido para usar
  `var(--font-sans)` primeiro.

## 3. Gap funcional — resolvido (campo removido, aguardando o contador)

### `regime` (Simples Nacional / Lucro Real) é coletado mas não afeta o cálculo

O Documento 2 (seção 2.1) é explícito: *"regime — muda o tratamento
tributário e entra como parâmetro do cálculo"*. Isso se repete em mais 6
lugares nos documentos (docs/03, docs/04). No código atual, `regime`
percorre todo o caminho — formulário (`page.tsx`) → validação
(`validacao.ts`) → API (`simular-cenarios/route.ts`) → `SimularEntrada` em
`motor.ts` — e **nunca é lido dentro de `simular()`**. O resultado numérico
é idêntico entre "Simples" e "Lucro Real" para os mesmos outros campos.

**Por que importa:** a tela apresenta um seletor "Regime tributário" como
se ele mudasse o preço/margem — para quem testar clicando entre as duas
opções sem alterar mais nada, o resultado não muda, o que pode ser lido
como bug pelo jurado no Q&A.

**Decisão tomada em 25/08/2026:** remover o campo do formulário, da
validação, da rota e do motor até que a regra de como o regime deveria
mudar o cálculo (ex.: crédito de PIS/Cofins não-cumulativo só existe no
Lucro Real; Simples recolhe por DAS unificado) seja decidida com o
contador — em vez de manter um campo que aparenta funcionalidade que não
existe. Detalhe da decisão, a pergunta específica registrada para o
Sprint Day e o caminho para reintroduzir o campo depois: **docs/05, seção
"Campo `regime`..."**.

## 4. Robustez e tratamento de erro (Clean Code) — corrigido

Todos os itens abaixo foram implementados após a primeira rodada desta
auditoria (mesma sessão), com `npx vitest run`, `npx eslint .`,
`npx tsc --noEmit` e `npm run build` limpos depois da mudança:

- **Fetches em `page.tsx` agora checam `response.ok`** antes de tentar
  interpretar a resposta como JSON, e o `.catch` de `/api/parametros`
  deixou de estar vazio — falha ao carregar ramos ou parâmetros aparece
  na lista de erros do formulário em vez de sumir silenciosamente. Um
  `cancelado` flag no `useEffect` evita `setState` depois de desmontar.
- **Rotas de API (`ramos`, `parametros`, `simular-cenarios`) agora têm
  `try/catch` em volta das chamadas Prisma**, devolvendo `{ erros: [...] }`
  com status 500 em vez de deixar o erro de conexão escapar como página
  padrão do Next (que o cliente tentaria interpretar como JSON).
- **Corrida de estado corrigida** com um contador de requisição
  (`requisicaoIdRef`): `carregarCasoReal` invalida qualquer simulação
  ainda em voo, e `simular()` ignora respostas cuja requisição não é mais
  a mais recente antes de aplicar `setState`.
- **Type assertion sem validação removida** — `data.cenarios as
  Record<CenarioRepasse, ResultadoAno[]>` virou uma checagem de formato em
  runtime (`isRespostaCenariosValida`) que rejeita e mostra erro amigável
  se o contrato da API não bater, em vez de propagar um shape errado para
  os componentes de gráfico.
- **Tipos duplicados consolidados**: `FormulaTipo` e `CenarioRepasse`
  agora só existem em `src/lib/motor.ts`; `src/lib/validacao.ts` os
  importa em vez de redeclarar, e `page.tsx` importa ambos de
  `@/lib/motor` em vez de redeclarar localmente. (`Regime` foi removido
  por completo do código nesta mesma sessão — ver seção 3.)

## 5. Acessibilidade e responsividade — corrigido

Também implementados nesta sessão, com a mesma bateria de verificação
limpa depois da mudança:

- **Cores dos gráficos SVG agora seguem o dark mode**: a linha de preço,
  o ponto/texto do ano selecionado e o contorno da barra selecionada
  trocaram `fill`/`stroke` fixos (`#18181b`, `#71717a`, `#e4e4e7`) por
  classes Tailwind (`fill-zinc-900 dark:fill-zinc-50`, etc.) — o anel em
  volta do ponto agora usa `stroke-white dark:stroke-zinc-950` para
  continuar "recortando" o ponto do fundo em ambos os temas.
- **Alvos de toque ampliados**: cada ano/barra ganhou uma área de toque
  invisível (`<rect fill="transparent">`) do tamanho de toda a coluna do
  gráfico, não só do ponto/barra visível — o elemento clicável real ficou
  bem maior que o desenho, sem mudar a aparência.
- **Texto do SVG aumentado** (rótulos de ano de 12→15, rótulos de eixo de
  11→13, nos dois gráficos) — mitiga a perda de legibilidade em mobile.
  Ressalva: como o texto ainda escala junto com o `viewBox` (decisão
  deliberada de manter SVG próprio, sem lib de gráfico — ver
  `CLAUDE.md`), isto reduz o problema mas não o elimina por completo;
  uma correção definitiva exigiria desacoplar o texto da escala do
  gráfico (ex.: overlay HTML), fora do escopo desta rodada.
- **Elementos do gráfico agora respondem a teclado**: cada ano/barra tem
  `role="button"`, `tabIndex`, `aria-label` e `onKeyDown` (Enter/Espaço)
  — dá para trocar o ano selecionado sem mouse/toque.
- **Seletor de cenário virou um padrão ARIA de tabs completo**: os botões
  têm `id`/`aria-controls` ligando ao painel do gráfico
  (`role="tabpanel"`), `tabIndex` correto (só a aba ativa é alcançável por
  Tab) e navegação por setas esquerda/direita entre os três cenários.
- **Desconto máximo por ano agora é visível sem hover**: cada chip mostra
  o percentual diretamente (segunda linha, texto menor) em vez de só no
  `title` — acessível em touch, não só com mouse.
- **Campos "mínimo"/"máximo" do teto da praça** ganharam `<label>`
  associado com texto em `sr-only` (mantendo o `placeholder` visível),
  em vez de depender só do `placeholder` para identificação.
- **Feedback de "Carregando ramos…"** adicionado ao lado dos botões de
  caso real enquanto `/api/ramos` ainda não respondeu.
- **Contraste do rodapé corrigido** — trocado `text-zinc-400
  dark:text-zinc-500` por `text-zinc-500 dark:text-zinc-400` (a versão
  clara passa a ter ~4,6:1 de contraste sobre `bg-zinc-50`, dentro do
  mínimo de 4.5:1 para texto pequeno).
- Bônus relacionado, corrigido junto: o campo numérico de desconto pedido
  em `PainelRecomendacao` agora limita (`clamp`) o valor entre 0 e 100 ao
  digitar diretamente, igual ao que o `range` ao lado já impunha.

Detalhamento completo dos tokens de cor/tipografia/componente e o
catálogo de padrões visuais já em uso: **[docs/06-design-system.md](06-design-system.md)**.

## 6. O que está confirmadamente pronto

- Motor de cálculo (`src/lib/motor.ts`) — função pura, sem dependência de
  banco/rede, 15 testes passando, incluindo os 8 de aceitação e o Teste 4
  (a regra não-negociável mais importante da suíte).
- As duas fórmulas de preço (multiplicador e markup) corretamente
  diferenciadas.
- Três cenários de repasse (integral/gradual/absorção), com convergência
  correta em 2033 e comportamento de "ignorar cenário no markup"
  confirmado por teste.
- Desconto máximo por ano, painel de recomendação sempre visível (nunca
  vira "gráfico solto"), impacto no caixa (split payment) com frases
  fixas para os 3 casos (protegido/em risco/misto).
- API routes (`/api/ramos`, `/api/parametros`, `/api/simular-cenarios`)
  validam entrada, checam `entraNoMvp`, rejeitam ramo inexistente/margem
  mínima maior que a alvo.
- Build de produção limpo, deploy já validado ao vivo contra a Vercel
  (`CLAUDE.md`, Fase 4) batendo os casos reais (EletroLondrina R$155,00,
  In-Pacto R$130,00).
- `.env`/`.env.local` fora do controle de versão; variáveis confirmadas em
  Production (registrado no `CLAUDE.md`).

## 7. Pendências que continuam fora do escopo de código

- Validação das alíquotas dos 3 ramos e dos parâmetros 2026–2033 com um
  contador (docs/05) — checklist e roteiro de perguntas já prontos, só
  falta a conversa humana.
- Persistência de simulações (`/api/simulacoes`, `/api/empresas`) — bônus
  documentado, não bloqueia o Pitch (docs/00, seção 7).

---

## 8. Design System

Um design system foi extraído e documentado a partir dos padrões já em
uso no código (cores, tipografia, espaçamento, componentes, convenções de
gráfico, dark mode) — ver **[docs/06-design-system.md](06-design-system.md)**.
Não é um redesign: é a fonte única de verdade para qualquer tela nova
seguir o mesmo vocabulário visual já validado nas Fases 2–5.

---

## 9. Três testes manuais para rodar no deploy (Vercel)

Rode contra `https://real-tech-project.vercel.app`, na ordem abaixo.
Os dois primeiros usam os casos reais das entrevistas — os números
esperados vêm diretamente dos Testes de Aceitação 1, 2 e 4 (docs/00,
seção 6), então servem também como confirmação de que o banco de produção
está com o seed correto.

### Teste 1 — Caso EletroLondrina: faixa viável, cenários e desconto

1. Abra o site, clique em **"Carregar caso EletroLondrina"**.
2. Clique em **"Simular faixa viável"**.
3. No ano **2026**, confirme: **Preço = R$ 155,00** e a mensagem de
   recomendação mostra um desconto máximo disponível (não deve dizer que
   a margem já está furada).
4. Alterne entre os três botões de cenário (**Repasse integral / Repasse
   gradual / Absorção**) com o ano 2033 selecionado — o preço deve mudar
   entre os cenários (gradual e absorção devem mostrar um preço diferente
   do integral nos anos intermediários, mas convergir perto de 2033).
5. No painel de recomendação, arraste o controle de **desconto pedido**
   até **10%** — confirme que a lista de anos abaixo mostra claramente a
   partir de que ano (se houver) o desconto deixa de caber, com os chips
   trocando de verde para vermelho.

**O que reportar se falhar:** preço diferente de R$155,00 em 2026 (banco
com seed desatualizado ou motor quebrado); cenários com preços idênticos
entre si (regressão na Fase 3); desconto não muda o resultado exibido.

### Teste 2 — Caso In-Pacto: markup, impacto no caixa e alerta

1. Clique em **"Carregar caso Grupo In-Pacto"** e depois em **"Simular
   faixa viável"**.
2. No ano **2026**, confirme: **Preço = R$ 130,00**.
3. Alterne entre os três cenários de repasse — diferente do Teste 1, o
   **preço não deve mudar** em nenhum ano (é a regra do modelo markup,
   Teste 4 dos testes de aceitação — o aumento de carga tributária come a
   margem, não o preço).
4. Role até a seção **"Impacto no caixa"**. Compare a barra de **2026**
   (deve mostrar bem mais laranja/âmbar — "em risco" — que verde) com a
   barra de **2033** (deve ser praticamente só verde — "protegido").
   Selecione cada ano e confirme que a frase abaixo do gráfico muda de
   acordo (2026 fala em depender do fornecedor recolher; 2033 fala em
   proteção total pelo split payment).
5. Aumente a margem mínima para um valor próximo de 30% (o piso do caso)
   e observe se em algum ano próximo de 2033 o alerta (borda/fundo
   vermelho do painel) chega a disparar.

**O que reportar se falhar:** preço mudando entre cenários (quebraria a
regra mais importante do produto); barras do impacto no caixa iguais em
todos os anos; frase de recomendação do caixa não muda ao trocar de ano.

### Teste 3 — Faixa inviável, responsividade e modo escuro

1. Com qualquer caso carregado (ou dados próprios), preencha o campo
   **"Preço da praça (máximo)"** com um valor claramente abaixo do preço
   calculado (ex.: se o piso ficar perto de R$155, informe R$100 como
   teto). Simule novamente.
2. Confirme que o painel de recomendação fica **vermelho** e a frase
   explica que mesmo no piso o preço fica acima do que a praça pratica.
3. Redimensione a janela do navegador para a largura de um celular
   (ou abra o site direto no celular) e confirme: o formulário empilha em
   1 coluna, o gráfico continua legível (sem cortar texto ou vazar da
   tela), e você consegue tocar nos pontos do gráfico para trocar o ano
   selecionado.
4. Ative o modo escuro do sistema operacional (ou do navegador) e recarregue
   a página — confirme que o texto continua legível em todos os cartões;
   preste atenção especial à linha de preço e ao ponto do ano selecionado
   dentro do gráfico da faixa viável (era um ponto que ficava quase
   invisível no escuro antes da correção desta auditoria — ver seção 5).

**O que reportar se falhar:** alerta não dispara com teto abaixo do piso;
qualquer texto cortado/ilegível no celular; elementos do gráfico
invisíveis ou com contraste ruim no modo escuro.
