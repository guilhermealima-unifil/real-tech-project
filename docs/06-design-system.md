# Real Tech — Design System

Este documento registra, como fonte única, os padrões visuais e de
interação já em uso no produto (Tailwind CSS v4, componentes em
`src/components/` e `src/app/page.tsx`) — para que qualquer tela nova siga
o mesmo vocabulário em vez de inventar um novo estilo. Não é um redesign:
é a extração e a nomeação do que a Fase 1–5 já construiu, mais as lacunas
que valem a pena fechar antes do Sprint Day.

Princípio herdado do Documento 2 (seção 3) e do CLAUDE.md — **toda tela
termina em recomendação, não em gráfico solto** — vale também para o
design system: qualquer componente novo precisa ter um lugar claro para o
texto de recomendação, não só para o dado numérico.

---

## 0. Fundação de tokens (Real Tech Identity — nova nesta etapa)

Evolução visual proposta na auditoria "Real Tech Identity" (design lead,
pós-Sprint Day), em duas etapas: (1) fundação de tokens + shell global +
header, (2) redesign visual do wizard sobre essa fundação. **As duas já
foram implementadas.** Resultado, análise de desconto e os gráficos
continuam no padrão zinc puro descrito na seção 1 abaixo, que segue válida
só para eles até a próxima etapa de migração.

### Tokens

12 variáveis CSS em `src/app/globals.css`, claro e escuro, expostas como
utilitários Tailwind via `@theme inline` (ex.: `bg-primary`,
`text-text-secondary`, `border-border`). Cada token é redefinido dentro de
`@media (prefers-color-scheme: dark)` — como os utilitários só referenciam
a variável (nunca um hex fixo), eles se adaptam ao dark mode sozinhos, sem
precisar do prefixo `dark:` em cada uso (diferença importante em relação à
paleta zinc pura, que ainda exige o par claro/escuro manual em todo lugar).

| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `background` | `#F6F4F0` | `#0D0D0F` | fundo global (`body`) |
| `surface` | `#FFFFFF` | `#17161A` | header, container do wizard |
| `surface-elevated` | `#FCFBF8` + `shadow-elevated` | `#1E1D22` + sombra mais forte | resumo da Etapa 3 do wizard; Resultado ainda pendente |
| `border` | `#E2DED4` | `#2C2A30` | bordas de card, header, campos do wizard |
| `text-primary` | `#18171C` | `#F3F1EA` | texto principal |
| `text-secondary` | `#58554D` | `#A8A49B` | subtítulos |
| `muted` | `#8D897E` | `#6E6A62` | rótulos terciários, itens futuros do header |
| `primary` | `#0F4C57` | `#4FB6AE` | destaque de marca — uso restrito (ver regra abaixo) |
| `success` | `#1F8A5F` | `#3FBE83` | etapa concluída no stepper do wizard; Resultado ainda usa `emerald-*` |
| `warning` | `#A6690A` | `#E0A83D` | reservado; Resultado ainda usa `amber-*` |
| `danger` | `#B02E26` | `#E2564C` | erros de validação do wizard; Resultado ainda usa `red-*` |
| `focus` | = `primary` | = `primary` | `:focus-visible` global + foco por borda nos campos do wizard |

**Regra de uso do `primary`:** é a única cor de marca do produto — reservada
para "onde a decisão/atenção está": item de navegação ativo e etapa atual
do stepper no header/wizard, carta selecionada na escolha de fórmula, anel
de foco dos campos. O botão "Nova simulação" (header e wizard) e os botões
"Continuar"/"Simular faixa viável" usam tinta neutra (`text-primary`/
`background`), não `primary`, de propósito — para o teal não se diluir
antes do momento que mais importa (o preço recomendado, ainda pendente de
migração). Não é usada para status — isso continua sendo
`success`/`warning`/`danger`.

### Tipografia numérica

Classe utilitária `font-figures` (`@utility` em `globals.css`):
`font-family: var(--font-mono)` (Geist Mono, já carregado, antes sem uso) +
`font-variant-numeric: tabular-nums`. Em uso no wizard: valor digitado e
afixo (R$/%/dias) de todo `CampoNumerico`, alíquota sugerida do ramo,
números do resumo da Etapa 3 e números dos círculos do stepper. Ainda não
aplicada no Resultado (pendente, junto com o resto da migração daquela
área).

### Shell global

`src/app/layout.tsx` passou a montar a estrutura
`<SimulationProvider><Header /><main>{children}</main></SimulationProvider>` —
`SimulationProvider` subiu de `page.tsx` para o layout porque o `Header`
precisa do mesmo estado compartilhado (saber quando mostrar "Nova
simulação"). `<main>` fixa largura máxima de `840px`, gutters `px-6` e
espaçamento vertical `gap-8` — antes isso vivia dentro de `page.tsx`; agora
é herdado por qualquer conteúdo que passe a existir no futuro.

### Header

`src/components/shell/Header.tsx`. Marca "Real Tech" (com "Real" na cor
`primary` — o nome do produto é também o nome da moeda que ele precifica).
"Simulador" é o único item de navegação real (`<Link href="/">`,
`aria-current="page"`). "Histórico" e "Como funciona" ainda não têm rota —
aparecem como texto simples com selo "em breve", **nunca como link/botão**:
um controle desabilitado fingindo ser navegação é pior do que informação
sem controle nenhum. "Nova simulação" só aparece quando
`ui.etapaAtual === "resultado"` (reaproveita `novaSimulacao()` do
`SimulationProvider`, mesma ação do botão que já existia dentro de
`ResultadoSimulacao`) — fica oculta durante o wizard para não convidar a
descartar dados que o usuário ainda está preenchendo.

### Wizard

`src/components/simulacao/{SimulacaoWizard,IndicadorEtapas,EtapaOperacao,
EtapaMargens,EtapaMercado}.tsx`, mais dois arquivos novos de apoio:
`CampoNumerico.tsx` (rótulo + input com afixo R$/%/dias + texto de ajuda,
usado por todo campo numérico) e `estiloCampo.ts` (3 constantes de classe
— rótulo, select, texto de ajuda — para o select de ramo e o fieldset de
fórmula nunca divergirem do `CampoNumerico`). Container do wizard:
`surface`/`border`, `rounded-xl` (12px, acima do `rounded-lg` de 8px usado
no resto do produto — reserva o raio maior para a superfície de maior
destaque). `IndicadorEtapas`: `bg-success` para etapa concluída,
`bg-primary` para a atual, `border-border` para futuras — continua um
`<nav>`/`<ol>` não-interativo, nunca clicável. A pergunta sobre fórmula
(Etapa 1) virou duas "cartas" clicáveis (`border-primary bg-primary/5`
quando selecionada) em vez de radio nu. Casos reais (EletroLondrina/
In-Pacto) rebaixados para `border-border text-muted` — antes tinham
praticamente o mesmo peso do botão "Continuar".

---

## 1. Cor (padrão anterior — ainda em uso no Resultado e nos gráficos)

Paleta neutra em **zinc** (Tailwind) + 3 cores semânticas. Nenhuma cor de
marca própria foi definida ainda — o produto usa só a paleta padrão do
Tailwind, o que é adequado para um MVP de hackathon, mas é o primeiro
ponto a decidir se o produto continuar depois do Sprint Day.

| Papel | Token Tailwind | Uso no código |
|---|---|---|
| Fundo da página | `bg-zinc-50` / `dark:bg-black` | `page.tsx` (`<div className="flex flex-1 flex-col ...">`) |
| Fundo de cartão/seção | `bg-white` / `dark:bg-zinc-950` | formulário, painel de faixa viável, impacto no caixa |
| Borda padrão | `border-zinc-200` / `dark:border-zinc-800` | todos os cartões |
| Texto primário | `text-zinc-900` / `dark:text-zinc-50` | títulos, valores |
| Texto secundário | `text-zinc-600` / `dark:text-zinc-400` | subtítulos, legendas |
| Texto terciário / hint | `text-zinc-500` / `dark:text-zinc-400`, `text-zinc-400` no rodapé | rótulos de dado, nota de estimativa |
| Ação primária | `bg-zinc-900 text-white` / `dark:bg-zinc-50 dark:text-zinc-900` | botão "Simular faixa viável" |
| Ação secundária | `border-zinc-300 text-zinc-700` / `dark:border-zinc-700 dark:text-zinc-300` | botões "carregar caso real", cenário não selecionado |
| **Positivo / dentro da faixa / protegido** | `emerald-600`/`emerald-300`/`#059669` | linha do piso no gráfico, painel sem alerta, chip "desconto cabe", barra "protegido" no impacto no caixa |
| **Negativo / alerta / risco** | `red-600`/`red-300`/`#dc2626`/`#b91c1c` | painel com alerta, chip "desconto não cabe", ponto do gráfico em alerta, linha do teto |
| **Atenção / em risco (não é erro)** | `amber-600`/`#d97706` | barra "em risco" no impacto no caixa |

**Regra de uso:** vermelho é reservado para "a margem mínima foi furada ou
a faixa é inviável" (alerta do motor, `alertaDisparado`). Âmbar é
"depende de terceiro, mas não é um erro do usuário" (crédito sob risco no
split payment). Não trocar os dois — são semânticas diferentes na
narrativa do produto (ver `docs/02`, seção 2.3 e `CLAUDE.md`, Fase 5).

**Lacuna encontrada:** as cores dentro dos SVGs (`FaixaViavelChart.tsx`,
`ImpactoCaixaChart.tsx`) são hex fixos (`#18181b`, `#71717a`, `#e4e4e7`)
que não trocam com o dark mode — hoje ficam escuras sobre um fundo
`dark:bg-zinc-950`, quase ilegíveis. Ver seção 6 (achados).

---

## 2. Tipografia

- Fonte: **Geist Sans** (texto) e **Geist Mono** (não usada ainda em
  nenhuma tela — carregada mas sem aplicação visível; candidata natural
  para valores monetários/tabulares no futuro).
- Escala em uso (Tailwind): `text-2xl font-semibold` (H1), `text-lg
  font-semibold` (H2 de seção), `text-base font-medium` (frase de
  recomendação), `text-sm` (rótulos de campo, corpo padrão), `text-xs`
  (legendas, badges, rodapé).
- Peso: `font-semibold` para títulos e valores-destaque (`dd`), `font-medium`
  para rótulos e ações, `font-normal` (padrão) para texto corrido.

---

## 3. Espaçamento e forma

- Espaçamento entre seções da página: `gap-8` (`page.tsx` `<main>`).
- Padding interno de cartão: `p-6` (formulário, seções); `p-5` (painel de
  recomendação); `p-3` (lista de erros, mensagem de caixa).
- Border-radius: `rounded-lg` para cartões/seções, `rounded-full` para
  botões e badges de cenário, `rounded` (padrão, 0.25rem) para inputs e
  chips de ano.
- Grid do formulário: `grid-cols-1 sm:grid-cols-2` — 1 coluna até 640px,
  2 colunas a partir daí. É o único breakpoint usado no projeto inteiro.

---

## 4. Componentes

### Botão primário
```
rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white
hover:bg-zinc-800 disabled:opacity-50
dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200
```
Uso: ação principal de cada tela (hoje só "Simular faixa viável").

### Botão secundário / pill de seleção
```
rounded-full border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700
hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900
```
Estado ativo (ex.: cenário selecionado): inverte para
`bg-zinc-900 text-white` / `dark:bg-zinc-50 dark:text-zinc-900`.

### Campo de formulário
```
label: flex flex-col gap-1 text-sm
span (rótulo): font-medium text-zinc-700 dark:text-zinc-300
input/select: rounded border border-zinc-300 px-3 py-2
              dark:border-zinc-700 dark:bg-zinc-900
```
Hint abaixo do campo (ex.: alíquota sugerida, nota de estimativa):
`text-xs text-zinc-500 dark:text-zinc-400`.

### Cartão / seção
```
rounded-lg border border-zinc-200 bg-white p-6
dark:border-zinc-800 dark:bg-zinc-950
```

### Painel de alerta (recomendação)
Duas variantes por estado, nunca uma terceira cor:
```
sem alerta:  border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40
com alerta:  border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40
```

### Chip de ano (desconto cabe / não cabe)
```
rounded px-2 py-1 text-xs font-medium
cabe:      bg-emerald-600/15 text-emerald-800 dark:text-emerald-300
não cabe:  bg-red-600/15 text-red-800 dark:text-red-300
```

### Gráfico (SVG customizado, sem lib externa)
Decisão de produto registrada no CLAUDE.md — SVG próprio, escala
automática pela faixa de dados (não a partir de zero). Convenções:
- `viewBox` fixo (760×320 faixa viável, 760×260 impacto no caixa),
  renderizado com `className="w-full h-auto"` para responsividade.
- Linha de piso: verde sólido (`#059669`, `strokeWidth 2`).
- Linha de teto: vermelho tracejado (`#b91c1c`, `strokeDasharray "6 4"`).
- Linha de preço: preto/quase-preto sólido, mais grosso (`#18181b`,
  `strokeWidth 2.5`) — é a linha "principal".
- Ponto selecionado: raio maior (7 vs 5) + contorno branco mais grosso.
- Ano em alerta: ponto preenchido em vermelho (`#dc2626`) em vez de preto.

---

## 5. Responsividade e dark mode — padrão a seguir

- **Breakpoint único (`sm:`, 640px):** simples o bastante para o escopo
  atual (1 tela). Se novas telas adicionarem tabelas ou layouts mais
  densos, valerá introduzir `md:`/`lg:` — não antes disso.
- **Dark mode via `dark:` do Tailwind** (segue `prefers-color-scheme`,
  configurado em `globals.css`) — todo componente Tailwind novo deve vir
  com o par claro/escuro desde o commit inicial, não como ajuste
  posterior. Exceção conhecida: cores fixas dentro de `<svg>` (ver seção 6).
- **`w-full h-auto` em SVG com `viewBox`** é o padrão correto para gráfico
  responsivo neste projeto — manter para qualquer novo gráfico custom.

---

## 6. Achados corrigidos nesta auditoria

- `src/app/layout.tsx`: `<html lang="en">` → `lang="pt-BR"` (conteúdo
  100% em português; afeta leitores de tela e SEO).
- `src/app/globals.css`: `body { font-family: Arial, Helvetica, sans-serif; }`
  sobrescrevia a fonte Geist carregada em `layout.tsx` (a variável
  `--font-sans` nunca era aplicada) — corrigido para
  `font-family: var(--font-sans), Arial, Helvetica, sans-serif;`.

## 7. Lacunas conhecidas

As lacunas de dark mode, toque, teclado, ARIA e contraste levantadas na
primeira rodada desta auditoria foram corrigidas na mesma sessão — ver
`docs/07-verificacao-final.md`, seção 5, para o detalhamento do que
mudou em cada componente. O que continua em aberto, por exigir uma
mudança maior de arquitetura do gráfico (fora do escopo de um ajuste de
estilo):

- **Texto dentro do SVG ainda escala junto com o `viewBox`** — os
  tamanhos de fonte foram aumentados (mitigação), mas o texto continua
  proporcionalmente menor em telas pequenas porque ainda faz parte do
  mesmo sistema de coordenadas escalado do gráfico. Uma correção
  definitiva (tamanho de fonte constante independente do zoom do SVG)
  exigiria desacoplar o texto do `viewBox` — ex.: um overlay HTML
  posicionado sobre o SVG, ou trocar para uma lib de gráfico — o que
  contradiria a decisão deliberada de manter um SVG próprio, sem
  dependência externa (`CLAUDE.md`).
- ~~Não existe token de cor de marca própria~~ — **resolvido na etapa
  "Real Tech Identity — fundação"** (seção 0): 12 tokens claro/escuro +
  shell + header, com o wizard já migrado sobre essa fundação. O que falta
  agora é só a segunda metade da migração — Resultado, análise de desconto
  e os gráficos continuam no zinc/emerald/red/amber cru descrito na
  seção 1, por decisão explícita de escopo (fundação + wizard primeiro,
  Resultado depois).
- Gráficos (`FaixaViavelChart`, `ImpactoCaixaChart`) continuam com hex fixo
  dentro do `<svg>`, ilegível no dark mode — não tratado ainda (fora de
  escopo das duas etapas da seção 0); é o próximo item de maior impacto.
