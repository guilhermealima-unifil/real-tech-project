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

## 1. Cor

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
- Não existe token de cor de marca própria — todo o produto usa a paleta
  padrão zinc/emerald/red/amber do Tailwind. Aceitável para o Sprint Day;
  primeira coisa a revisar se o produto for além do hackathon.
