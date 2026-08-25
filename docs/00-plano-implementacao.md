# Real Tech — Plano de Implementação (Atualizado)

**Solveathon SESCAP 2026 · Contexto 01 · Desafio 2 · Do dia de hoje (25/08) ao Pitch (27/08)**

Este plano substitui, na parte de arquitetura e cronograma, o *Plano de Implementação* original entregue no 2º Checkpoint. Ele mantém intactos o motor de cálculo, os testes de aceitação e o roteiro de demonstração já validados — o que muda é a stack (agora Vercel + Prisma ORM + PostgreSQL, em vez de "sem backend, sem banco") e as datas, recalculadas a partir de hoje. Os detalhes técnicos de cada etapa estão nos outros dois documentos da equipe: o **Documento 1 (Passo a Passo Vercel + Prisma + Postgres)** cobre o "como fazer" da infraestrutura, e o **Documento 2 (Especificação Completa)** cobre o "o que construir" — dados, telas, endpoints, banco, testes e apresentação. Este plano é o que amarra os dois em um cronograma executável.

---

## 1. Objetivo

Chegar ao Pitch (27/08) com uma ferramenta que responde a uma pergunta que nenhuma outra responde: dado o meu custo, a minha margem mínima e o preço que a praça pratica, onde o meu preço pode viver em cada ano da transição do IBS/CBS — e quanto de desconto eu posso dar antes de furar o piso?

O plano é organizado para que exista uma versão demonstrável o quanto antes dentro da janela disponível, em vez de um sistema completo que só funciona na última hora — o mesmo princípio do plano original, agora aplicado a um cronograma mais curto.

---

## 2. Janela de tempo real disponível

Segundo o regulamento do Solveathon SESCAP 2026, o Sprint Day acontece nos dias **26/08** (construção presencial) e **27/08** (Pitch, com avaliação final e premiação no mesmo dia). Isso deixa a equipe com uma janela bem mais curta do que os "8 dias" do plano original:

| Data | Janela | O que precisa estar pronto ao final |
|---|---|---|
| **Hoje, 25/08 (terça)** | Preparação final, fora do evento | Fase 1 completa: motor de cálculo, parâmetros tributários, schema do banco e seed. Idealmente também o banco criado na Vercel e testado. |
| **26/08 (quarta) — Sprint Day, dia de construção** | Presencial, dia inteiro | Telas (faixa viável, cenários, desconto), API routes conectadas, recomendação, deploy funcionando. |
| **27/08 (quinta) — Pitch** | Presencial | Ensaio cronometrado pela manhã, congelamento do código, Pitch de 3 minutos + até 3 minutos de perguntas da banca. |

Isso muda a ordem de prioridade em relação ao plano original: o que antes era "Fase 1 sem interface, 3 dias" agora precisa acontecer **hoje**, porque amanhã já é o único dia de construção presencial que resta antes do Pitch.

---

## 3. Decisões técnicas (atualizadas)

### 3.1 Arquitetura com backend, banco e Prisma

Ao contrário do plano original — que evitava backend, banco e login de propósito, para a demonstração não depender do wi-fi do local —, a equipe decidiu seguir com **Vercel (API routes) + Prisma ORM + PostgreSQL (Prisma Postgres via Vercel Marketplace)**. O passo a passo completo está no Documento 1. Essa é uma troca consciente: ganha-se histórico, multi-CNPJ e uma demonstração de profundidade técnica maior; perde-se a garantia de que o app funciona sem rede. A mitigação está na seção 8 deste plano.

### 3.2 O motor continua sendo o núcleo, e continua isolado

O motor de cálculo (`simular()`) deve continuar sendo uma função pura em TypeScript (`lib/motor.ts`), sem nenhuma dependência de banco ou rede — só muda que agora ela roda no servidor (dentro das API routes), em vez de rodar direto no navegador. Isso preserva a decisão mais importante do plano original: **a Fase 1 é a única em que estar errado destrói o pitch**, e ela precisa continuar testável isoladamente, sem interface, sem banco.

### 3.3 Parâmetros separados do motor, agora também no banco

O arquivo de parâmetros versionado (alíquotas e regras de 2026 a 2033) continua sendo o ativo do produto. A diferença é que agora ele vive na tabela `ParametroTributario` do banco (ver Documento 1, seção 6), populada via seed a partir dos mesmos dados que estariam no JSON do plano original. A tela continua exibindo a data de vigência usada — isso não muda.

### 3.4 A alíquota continua sendo sugerida por ramo, não digitada

Decisão inalterada e central para o diferencial do produto: o empresário escolhe o ramo numa lista curta (Eletrodomésticos e móveis, Material elétrico e construção, Vestuário e calçados) e o sistema sugere a alíquota, editável. Pedir NCM ao usuário mataria o diferencial que a pesquisa de concorrência confirmou ser único no mercado.

### 3.5 As duas fórmulas de preço continuam obrigatórias

EletroLondrina (multiplicador: `preço = custo × (1 + despesaPct + margemPct)`) e In-Pacto (markup: `preço = custo × (1 + markupPct)`) precisam das duas ser suportadas — é o Caso de Teste 4 que prova que o motor entendeu o problema, e continua sendo o teste mais importante da suíte.

### 3.6 A IA fica fora do caminho crítico

Mantido do plano original: o motor de regras decide qual alerta disparar; um modelo de linguagem, se usado, apenas redige a explicação. As frases fixas continuam sendo escritas junto do motor, na Fase 1, não na última fase. Isso também está alinhado ao item 12.1 do regulamento do Solveathon, que permite uso de IA para acelerar o desenvolvimento do protótipo.

---

## 4. Fases (cronograma recalculado)

| Quando | Fase | Entrega concreta | Onde está o "como" |
|---|---|---|---|
| **Hoje, 25/08** | 1 · Motor, parâmetros e banco | Schema Prisma aplicado, banco criado na Vercel, seed rodado (ramos, parâmetros 2026–2033, casos reais EletroLondrina e In-Pacto), função `simular()` escrita e testada com os 8 casos de aceitação (seção 6), frases fixas de recomendação escritas. **Sem interface ainda.** | Documento 1, seções 2 a 11 |
| **26/08 — Sprint Day (manhã)** | 2 · API routes + tela da faixa viável | Endpoints `/api/ramos`, `/api/parametros`, `/api/simular` funcionando. Tela com os campos de entrada, o seletor de ramo, o campo do teto da praça e o gráfico de faixa ano a ano. **A partir daqui já existe algo demonstrável de ponta a ponta.** | Documento 2, seções 3 e 4 |
| **26/08 — Sprint Day (tarde)** | 3 · Cenários e desconto | Os três cenários de repasse (integral, gradual, absorção) sobrepostos à faixa; controle de desconto com o limite da margem mínima. **Este é o coração da apresentação (1:15–2:40 do roteiro) — se atrasar, é o que menos pode ser cortado.** | Documento 2, seção 3 |
| **26/08 — Sprint Day (fim da tarde/noite)** | 4 · Regras, recomendação e deploy | Motor de alertas conectado às frases da Fase 1; deploy funcionando na Vercel com o banco de produção populado. | Documento 1, seções 12–13 |
| **26/08 (noite) — se sobrar tempo** | 5 · Caixa e refinamento | Impacto no caixa (crédito e split payment no eixo do tempo), só se as fases 1 a 4 estiverem fechadas. Camada de IA como refinamento opcional, com cache das respostas usadas na demonstração. | Documento 2, seções 3 e 4 |
| **27/08 (manhã)** | 6 · Ensaio | Roteiro cronometrado (seção 8), dados semeados conferidos em produção, teste de rede no local do evento, ensaio completo com tempo medido, congelamento do código. | Documento 2, seção 8 |
| **27/08** | Pitch | 3 minutos de apresentação + até 3 minutos de perguntas da banca (regulamento, item 8.4). | — |

A regra que orienta tudo continua a mesma do plano original: **chegar ao fim do dia 26 com o núcleo (motor + faixa + cenários + desconto + recomendação) impecável e sem o módulo de caixa significa ter produto.** Chegar com um módulo de caixa bonito e a simulação principal frágil significa ter uma demonstração vistosa de uma solução fraca.

---

## 5. Ordem de construção dentro do Sprint Day (26/08)

1. Motor de cálculo tributário funcionando e testado (deve já estar pronto de hoje, 25/08).
2. Backend (API routes) e banco conectados — `POST /api/simular` retornando os mesmos números dos testes de aceitação.
3. Tela de entrada + faixa viável de preço.
4. Cenários de repasse comparados + desconto.
5. Alertas e recomendação.
6. Impacto no caixa — só começa com os itens 1 a 5 fechados.
7. Refinamento visual e camada de IA — por último.

---

## 6. Testes de aceitação (não mudam, viram testes automatizados hoje)

Escritos com os números reais das entrevistas. Devem ser implementados como testes automatizados (Vitest ou Jest) sobre `lib/motor.ts` **hoje**, antes de qualquer linha de tela ser escrita amanhã — se o motor não passar nestes, ele está errado:

| # | Caso | Entrada | Esperado |
|---|---|---|---|
| 1 | EletroLondrina, multiplicador | custo 100, despesa 20%, margem 35% | preço = R$ 155,00 (confirmado por ela: 155 a 160) |
| 2 | In-Pacto, fórmula de markup | custo 100, markup 30% | preço = R$ 130,00 |
| 3 | Aumento de carga, multiplicador | mesmo caso 1 com alíquota +1 p.p. | o preço sobe; a margem-alvo em reais é preservada |
| 4 | Aumento de carga, modelo markup | mesmo caso 2 com alíquota +1 p.p. | o preço não muda; **o lucro cai** |
| 5 | Desconto no piso | preço praticado = piso | desconto máximo = 0% |
| 6 | Piso acima do teto | teto informado abaixo do piso do ano | faixa negativa e alerta disparado |
| 7 | Continuidade da transição | qualquer entrada, anos 2026→2033 | nenhum salto não explicado pelos parâmetros |
| 8 | Faixa estreita legível | piso 155, teto 160 (3% de folga) | a banda continua visível no gráfico e o desconto máximo sai correto |

O caso 4 continua sendo o mais importante: é o que prova que o motor entendeu que as duas empresas entrevistadas calculam preço de formas diferentes.

---

## 7. Ordem de corte, se houver atraso

Igual ao plano original, com um item novo por causa da arquitetura:

1. Compensação de mix entre produtos (nunca esteve no MVP).
2. Camada de texto por IA (as frases fixas do motor já cobrem a função).
3. Módulo de caixa.
4. Terceiro cenário de repasse (ficar só com integral × gradual, se necessário).
5. **Persistência de histórico de simulações** (novo, por causa do banco) — em último caso, o app pode rodar consultando o banco só para ramos e parâmetros, calculando tudo sob demanda sem salvar simulações, se isso for o que falta para não perder tempo com bugs de gravação no dia da apresentação.

**Não são cortáveis:** a faixa viável, o desconto e a recomendação. São o produto — e são exatamente o que o Desafio 2 do regulamento pede.

---

## 8. Roteiro da demonstração (3 minutos)

| Tempo | O que acontece na tela e o que é dito |
|---|---|
| 0:00–0:30 | O problema, na voz de quem vive: "se ficar mais caro que a praça, o produto não vende." O piso é a conta; o teto é o concorrente. |
| 0:30–1:15 | Carrega o caso real da loja (EletroLondrina, pré-carregado no banco). Os campos, o ramo sugerindo a alíquota, e o preço da praça. A faixa aparece, ano a ano, e vai estreitando. |
| 1:15–2:00 | Os três cenários sobrepostos. O gradual mantém a loja dentro da faixa por mais tempo — o caso dos cosméticos do Samir, agora em números (~11% de crescimento em vendas). |
| 2:00–2:40 | O momento do desconto. O cliente pede 10%; o alerta dispara mostrando em que ano a margem mínima é furada. |
| 2:40–3:00 | A recomendação em uma frase, e o fechamento: "o cálculo virou commodity, a decisão não." |

Cada minuto corresponde a uma fase de construção. Se a Fase 3 (cenários e desconto) não ficar pronta, perde-se o trecho de 1:15 a 2:40 — o coração da apresentação.

---

## 9. Riscos

| Risco | Mitigação |
|---|---|
| A janela real até o Sprint Day é muito menor que a do plano original (1 dia de preparação + 1 dia de construção presencial). | Fase 1 precisa estar pronta hoje, fora do horário do evento — é a única forma de o dia 26 render. |
| O app agora depende de rede para falar com o banco (Postgres na Vercel) — o plano original evitava isso de propósito. | Testar a conexão no local do evento com antecedência ou usar hotspot do celular como plano B; ter prints/vídeo de backup da tela funcionando. |
| Alíquota errada por ramo. | Validar os três ramos com um contador (Jonathas Oliveira, Tetra) antes do Pitch; campo editável pelo usuário. |
| As duas fórmulas de preço não serem suportadas corretamente. | Caso de Teste 4; seletor "sua margem já inclui impostos e despesas?". |
| A recomendação ficar para o fim. | Frases fixas escritas na Fase 1, junto do motor — hoje, não amanhã. |
| O caixa consumir o tempo do núcleo. | É o item 6 da ordem de construção; só começa com os itens 1 a 5 fechados. |
| A tentação de virar dashboard. | Toda tela termina em recomendação, não em gráfico. |
| Bug de gravação no banco no dia da apresentação (novo, por causa do backend). | `/api/simular` deve funcionar mesmo sem persistir nada — calcular sob demanda é suficiente para o Pitch; salvar simulações é bônus, não requisito do roteiro de 3 minutos. |
| Disposição a pagar não foi validada. | Fora do escopo técnico, mas vale perguntar informalmente antes do Pitch, se houver contato com as empresas entrevistadas. |

---

## 10. Pendências antes do Sprint Day (26/08)

- Validar as alíquotas dos três ramos com um contador — o Jonathas Oliveira (Tetra) é o contato natural.
- Rodar os 8 testes de aceitação da seção 6 e confirmar que todos passam, especialmente os casos 1, 2 e 4.
- Criar o banco na Vercel e rodar o seed em produção (ver Documento 1, seções 2 e 11) — não deixar para a manhã do dia 26.
- Testar `POST /api/simular` end-to-end (do navegador até o banco) pelo menos uma vez hoje, para não descobrir problema de infraestrutura só amanhã.
