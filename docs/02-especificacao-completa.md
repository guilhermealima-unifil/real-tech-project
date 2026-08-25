# Real Tech — Especificação Completa da Implementação

**Solveathon SESCAP 2026 · Equipe Real Tech · Sprint Day: 27/08/2026**

Este documento reúne tudo o que a equipe precisa ter claro para implementar, testar e apresentar o produto até quinta-feira: dados, telas, backend, banco, testes, validações, roteiro de apresentação, a importância do produto e situações reais de uso. Ele parte do Plano de Implementação, do Dossiê consolidado e do material do 2º Checkpoint, adaptando tudo para a arquitetura escolhida (Vercel + Prisma + PostgreSQL) descrita no Documento 1.

---

## 1. Visão geral e importância do produto

**A pergunta que a Real Tech responde e que nenhuma outra ferramenta responde:** dado o meu custo, a minha margem mínima e o preço que a praça pratica, onde o meu preço pode viver em cada ano da transição do IBS/CBS — e quanto de desconto eu posso dar antes de furar o piso?

Isso nasceu de cinco conversas reais (Samir Nasser da BRN Holding, Jonathas Oliveira da Tetra Auditoria, Alexandro Zava do Grupo Voalle, mais as entrevistas próprias com a EletroLondrina e o Grupo In-Pacto). A descoberta central: **o empresário não trava na conta do imposto — trava na decisão de preço.** O contador já entrega a apuração; ninguém entrega a decisão.

A pesquisa de concorrência (Omie, Carmelitas Contabilidade, Tributos.io, Preço Certo, Gerapreço, ERPs como Bling e Bluesoft) confirmou que **calcular o imposto virou commodity** — inclusive de graça. O que continua vazio: nenhuma ferramenta pergunta o preço do concorrente (o teto), nenhuma trata desconto, nenhuma trata compensação de margem entre produtos, e nenhuma termina em recomendação — todas terminam em um número e um "consulte um profissional".

**Proposta de valor:** para o varejista de pequeno e médio porte que precisa decidir preço durante a transição do IBS/CBS e não tem estrutura fiscal própria, a Real Tech mostra a faixa viável de preço — entre a margem que ele não aceita furar e o preço que a praça suporta — em cada ano da Reforma, e termina em uma recomendação, sem transferir a decisão de volta para o escritório de contabilidade.

**Por que isso importa de verdade (não é feature de hackathon):** o exemplo do Samir sobre os cosméticos em São Paulo mostra a diferença em dinheiro real — a empresa que repassou o aumento de forma gradual teve cerca de 11% de crescimento em vendas no período de adaptação, enquanto quem repassou tudo de uma vez perdeu competitividade. É a diferença entre uma decisão tomada "de cabeça" (nas palavras do In-Pacto: "continuar trabalhando e rezar para ser melhor") e uma decisão tomada com dado.

---

## 2. Quais dados o sistema precisa

### 2.1 Dados de entrada do usuário (por simulação)

| Campo | Obrigatório | Descrição |
|---|---|---|
| `custoCompra` | Sim | Custo do produto já com frete, IPI e Substituição Tributária, conforme a nota de compra. |
| `ramo` | Sim | Escolhido em lista curta (Eletrodomésticos e móveis / Material elétrico e construção / Vestuário e calçados). Preenche a alíquota sugerida automaticamente. |
| `aliquota` | Não | Sugerida pelo ramo, mas editável — quem já sabe o número exato (porque o contador informou) sobrepõe o valor estimado. |
| `formulaTipo` | Sim | "Sua margem já inclui impostos e despesas?" — define se o cálculo usa a fórmula multiplicador (EletroLondrina) ou markup (In-Pacto). |
| `despesaFixaPct` | Sim, se `formulaTipo = multiplicador` | Comissão, água, luz, aluguel, impostos, como percentual sobre o custo. |
| `markupPct` | Sim, se `formulaTipo = markup` | Percentual único que já embute despesas e lucro. |
| `margemAlvoPct` | Sim | A margem de lucro que o empresário busca hoje. |
| `margemMinimaPct` | Sim | A margem abaixo da qual ele não aceita vender — é o piso. |
| `regime` | Sim | Simples Nacional ou Lucro Real — muda o tratamento tributário e entra como parâmetro do cálculo, não como resposta pronta sobre trocar de regime. |
| `tetoPraca` (mín/máx) | Não, mas é o diferencial | Faixa aproximada do preço que a concorrência pratica — o único dado que os dois empresários entrevistados pediram por conta própria. |
| `cenarioRepasse` | Sim (default "integral") | Integral, gradual ou absorção — como o aumento de carga tributária é repassado ao preço ao longo dos anos. |

### 2.2 Dados de configuração (versionados, não digitados pelo usuário)

- **Parâmetros tributários por ano (2026–2033):** alíquotas de CBS, IBS, e a curva de saída de PIS/Cofins/ICMS/ISS, com data de vigência e fonte declaradas (LC 214/2025 e parâmetros do Comitê Gestor do IBS). É o ativo do produto — a resposta honesta para "e se a regra mudar?".
- **Tabela de ramos:** os três ramos do MVP (regime padrão) com alíquota sugerida e rótulo. Ramos mistos (mercado/alimentos, farmácia) ficam fora do MVP porque exigem mix de alíquota por item — a tela deve declarar isso, não fingir que cobre tudo.
- **Frases fixas de recomendação:** o motor de regras decide qual alerta disparar; as frases são escritas junto do motor (não improvisadas depois) e servem de esqueleto para a camada de IA opcional.

### 2.3 Dados de saída (por ano, de 2026 a 2033)

`preço`, `margem resultante`, `tributo total`, `piso`, `teto`, `faixa` (piso até teto), `desconto máximo`, `alerta` (booleano) e `mensagem de recomendação`.

---

## 3. Telas do produto

O plano original é enfático: **toda tela termina em recomendação, não em gráfico** — a tentação de virar dashboard é um risco explícito assumido pela equipe.

1. **Tela de entrada (4 a 6 campos).** Custo, ramo (com alíquota sugerida e opção de ajustar), tipo de fórmula (multiplicador/markup), despesa ou markup, margem-alvo, margem mínima, regime, teto da praça (opcional). Um botão "carregar caso real" pré-popula com EletroLondrina ou In-Pacto para a demonstração.
2. **Tela da faixa viável.** O gráfico principal: piso e teto desenhados ano a ano até 2033, com escala automática pela faixa (não a partir de zero) — porque a faixa costuma ser estreita (ex.: 3% de folga no caso EletroLondrina) e uma escala fixa a esconderia.
3. **Tela de cenários de repasse.** Os três cenários (integral, gradual, absorção) sobrepostos à faixa, com um seletor. É o trecho mais importante da demonstração (1:15–2:40 no roteiro) — sem ele, perde-se o coração do pitch.
4. **Tela de desconto.** Um controle deslizante ou campo "desconto pedido pelo cliente (%)" que mostra, ano a ano, se esse desconto ainda cabe dentro do piso — e em que ano ele deixa de caber.
5. **Painel de recomendação.** Sempre visível, nunca uma tela separada de "resultado numérico solto" — a frase de recomendação (gerada pelo motor de regras, redigida ou refinada pela IA) acompanha qualquer uma das telas acima.
6. **Tela de impacto no caixa (Fase 5, se o núcleo estiver pronto).** Quando o crédito tributário entra, considerando o timing do split payment — a dor levantada pelo Jonathas Oliveira ("meu fornecedor pagou? vou conseguir meu crédito?").
7. **(Opcional/stretch) Histórico de simulações.** Lista de simulações salvas por empresa, útil para mostrar que o produto persiste decisões ao longo da transição — só faz sentido agora que existe banco de dados; no plano original client-side isso não seria demonstrável.

---

## 4. Funções de backend

Implementadas como API routes na Vercel (Next.js App Router), conforme detalhado no Documento 1.

| Endpoint | Método | Função |
|---|---|---|
| `/api/ramos` | GET | Lista os ramos do MVP com alíquota sugerida. |
| `/api/parametros` | GET | Lista os parâmetros tributários de 2026 a 2033, com versão e data de vigência. |
| `/api/simular` | POST | Executa `simular(entrada, parametros)` e devolve preço, margem, piso, teto, faixa e desconto máximo para cada ano — sem persistir nada. É o endpoint usado durante a digitação/ajuste ao vivo. |
| `/api/simulacoes` | GET, POST | Lista simulações salvas de uma empresa / cria e persiste uma nova simulação (grava `Simulacao` + calcula e opcionalmente grava `ResultadoAnual`). |
| `/api/simulacoes/[id]` | GET, DELETE | Recupera uma simulação salva (recalculando os resultados a partir dos parâmetros atuais) ou remove. |
| `/api/empresas` | GET, POST | Cadastro simples de empresa/CNPJ — opcional para o Sprint Day, necessário para o modelo Escritório (multi-CNPJ) do roadmap. |

**Função central do motor (`lib/motor.ts`), pura e testável sem banco:**

```
simular(entrada, parametros) → { preco, margem, tributo, piso, teto, faixa, descontoMaximo }
```

Regra crítica herdada do plano original: **as duas fórmulas de preço precisam ser suportadas, não uma.** A EletroLondrina soma despesa e margem sobre o custo (`preco = custo × (1 + despesaPct + margemPct)`); o In-Pacto aplica markup único que já embute tudo (`preco = custo × (1 + markupPct)`). A diferença não é cosmética: no primeiro modelo um aumento de imposto entra no preço; no segundo, ele come o lucro diretamente. Um seletor "sua margem já inclui impostos e despesas?" decide qual fórmula usar — errar isso quebra o cálculo para metade do público entrevistado.

---

## 5. Banco de dados — tabelas e campos

Esquema completo (Prisma) no Documento 1, seção 6. Resumo do papel de cada tabela:

| Tabela | Papel |
|---|---|
| `Ramo` | Os ramos do MVP e a alíquota sugerida de cada um (o mecanismo que substitui pedir NCM ao usuário). |
| `ParametroTributario` | Uma linha por ano (2026–2033), com CBS, IBS, PIS/Cofins e ICMS/ISS, versão e data de vigência — o ativo que responde "e se a regra mudar?". |
| `Empresa` | CNPJ, nome, ramo e regime — permite múltiplas simulações por empresa e é o que viabiliza o plano Escritório (multi-CNPJ) do modelo de negócio. |
| `Simulacao` | Uma "rodada" de entrada do usuário: custo, fórmula, despesas/markup, margens, regime, teto da praça, cenário de repasse escolhido. |
| `ResultadoAnual` | Uma linha por ano por simulação, com o resultado do motor (preço, margem, piso, teto, desconto máximo, alerta, recomendação). Pode ser recalculada a qualquer momento — persistir é o que permite mostrar histórico. |

Campos monetários e percentuais usam `Decimal`, nunca `Float` — um produto que existe para proteger margem não pode introduzir erro de arredondamento no próprio motor.

---

## 6. Testes com empresas reais que precisamos fazer

### 6.1 Testes de aceitação (motor de cálculo), com os números já coletados

Estes já existem no Plano de Implementação e devem virar testes automatizados (Vitest ou Jest) antes de qualquer tela ser construída — "se o motor não passar nestes, ele está errado":

1. EletroLondrina, fórmula multiplicador: custo 100, despesa 20%, margem 35% → preço = R$ 155,00 (confirmado pela empresária: entre R$ 155 e R$ 160).
2. In-Pacto, fórmula markup: custo 100, markup 30% → preço = R$ 130,00.
3. Aumento de carga tributária (+1 p.p.) no modelo multiplicador → o preço sobe; a margem-alvo em reais é preservada.
4. Aumento de carga tributária (+1 p.p.) no modelo markup → **o preço não muda; o lucro cai.** Este é o teste mais importante: prova que o motor entendeu que as duas empresas calculam de formas diferentes.
5. Desconto no piso: preço praticado = piso → desconto máximo = 0%.
6. Piso acima do teto: teto informado abaixo do piso do ano → faixa negativa e alerta disparado.
7. Continuidade da transição: qualquer entrada, anos 2026→2033, sem nenhum salto que os parâmetros não expliquem.
8. Faixa estreita legível: piso 155, teto 160 (3% de folga) → a banda continua visível no gráfico e o desconto máximo sai correto.

### 6.2 Validação humana, fora do código, antes de congelar

- **Validar as alíquotas dos três ramos do MVP com um contador** — o Jonathas Oliveira (Tetra) é o contato natural, já presente na jornada. Um número errado aqui não quebra a lógica do motor, mas quebra a credibilidade se um jurado conferir.
- **Testar a demonstração completa com o dado real da EletroLondrina e do In-Pacto**, comparando a saída do sistema com o que as duas empresas relataram nas entrevistas (a faixa R$ 155–160 e o markup de 30%/40%).
- **Rodar o roteiro cronometrado de 3 minutos** com dados semeados conferidos, incluindo o cenário de rede instável (já que a arquitetura agora depende de backend + banco).

---

## 7. Perguntas e validações

### 7.1 Perguntas que ainda precisam de resposta antes do Sprint Day (herdadas do Plano)

- Validar as alíquotas dos três ramos com um contador.
- Perguntar disposição a pagar às duas empresas entrevistadas (EletroLondrina e In-Pacto) — nenhuma das cinco conversas realizadas até agora tocou em preço de assinatura.
- Confirmar com um escritório contábil se ele revenderia a ferramenta à própria carteira de clientes — a evidência hoje é de comportamento de mercado (outro escritório já mantém um simulador gratuito como isca), não de conversa direta.

### 7.2 Perguntas de validação de produto, para conversas rápidas antes de quinta

Se houver tempo para mais uma rodada de conversa com qualquer varejista (mesmo fora das duas empresas já entrevistadas), estas perguntas continuam sendo as mais produtivas, na mesma lógica das lacunas usadas na Oficina 1:

1. Quando você precisa decidir preço, quais informações ou ferramentas você usa hoje?
2. O que você gostaria de entender melhor sobre os impactos da Reforma Tributária para tomar decisões mais seguras?
3. Pensando em uma situação real de mudança tributária, o que dificultou ou impediu vocês de agir diferente?
4. Desde que você começou a acompanhar a Reforma, alguma decisão da empresa foi adiada, mudada ou tomada por causa dela?
5. Quanto vale, em reais, errar 1 ponto percentual de margem no seu faturamento mensal? (Essa pergunta sustenta o argumento de preço do plano Essencial a R$ 79/mês.)

### 7.3 Validações de entrada (implementadas no backend, não só na UI)

- `custoCompra > 0`.
- `0 ≤ despesaFixaPct/markupPct/margemAlvoPct/margemMinimaPct ≤ 100` (ou o limite superior que fizer sentido — markup pode passar de 100% em alguns ramos).
- `margemMinimaPct ≤ margemAlvoPct` — não faz sentido a margem mínima ser maior que a margem-alvo.
- Se `tetoPracaMin` e `tetoPracaMax` informados: `tetoPracaMin ≤ tetoPracaMax`.
- `ano` sempre entre 2026 e 2033 — qualquer simulação fora desse intervalo deve ser rejeitada, não silenciosamente ignorada.
- `ramo` deve existir na tabela `Ramo` e ter `entraNoMvp = true`; se o usuário tentar simular um ramo misto (mercado, farmácia), a resposta deve declarar explicitamente que esse ramo ainda não é suportado, em vez de aplicar a alíquota errada.
- Alerta de confiança: sempre que `aliquota` não for sobrescrita pelo usuário, a tela deve deixar visível que o valor é uma estimativa por ramo, não um número exato — é o discurso do "a precisão do centavo é trabalho do contador".

---

## 8. Como apresentar

### 8.1 Roteiro cronometrado (3 minutos)

| Tempo | O que acontece na tela e o que é dito |
|---|---|
| 0:00–0:30 | O problema, na voz de quem vive: "se ficar mais caro que a praça, o produto não vende." O piso é a conta; o teto é o concorrente. |
| 0:30–1:15 | Carrega o caso real da loja (EletroLondrina, pré-carregado). Os campos, o ramo sugerindo a alíquota, e o preço da praça. A faixa aparece, ano a ano, e vai estreitando. |
| 1:15–2:00 | Os três cenários sobrepostos. O gradual mantém a loja dentro da faixa por mais tempo — o caso dos cosméticos do Samir, agora em números (~11% de crescimento em vendas). |
| 2:00–2:40 | O momento do desconto: o cliente pede 10%; o alerta dispara mostrando em que ano a margem mínima é furada. Nenhuma ferramenta do mercado responde a isso. |
| 2:40–3:00 | A recomendação em uma frase, e o fechamento: "o cálculo virou commodity, a decisão não." |

Cada minuto corresponde a uma fase de construção — se a fase de cenários (1:15–2:40) não ficar pronta, é o coração da apresentação que se perde, não um detalhe.

### 8.2 O que dizer sobre precisão (evita ataque do júri no Q&A)

Não afirmar que a simulação é exata. A frase testada e que resiste a pergunta de jurado: *"A precisão do centavo é trabalho do contador. A nossa precisão é a da decisão: com uma faixa de alíquota razoável, você já sabe se pode dar 10% de desconto ou não. Errar 1 ponto na alíquota não muda essa resposta — errar o teto da praça muda."*

### 8.3 Critérios de avaliação do Sprint Day, para calibrar ênfase no pitch

Aplicabilidade, viabilidade, qualidade do MVP, validação com o mercado e clareza da apresentação. Isso significa: mostrar dado real das entrevistas (validação), mostrar o produto funcionando ao vivo com o caso real (MVP), e ser objetivo no tempo (clareza) pesam tanto quanto a sofisticação técnica do backend novo.

### 8.4 Risco novo introduzido pela arquitetura com backend

O plano original evitava banco e login justamente para a demonstração não depender do wi-fi do local. Com Vercel + Postgres, essa proteção desaparece. Mitigações recomendadas para o dia: testar a conexão no local do evento com antecedência (ou usar o hotspot do celular como plano B), e ter prints/vídeo de backup da tela funcionando, caso a rede falhe durante os 3 minutos.

---

## 9. Qual a importância — recapitulando o porquê

- **A dor é real e validada, não hipotética:** cinco conversas independentes (três na sabatina do evento, duas entrevistas próprias) convergem no mesmo ponto — a decisão de preço, não o cálculo do imposto, é onde o empresário trava.
- **O diferencial é defensável, não só de discurso:** a pesquisa de concorrência mapeou especificamente o que falta em cada categoria de ferramenta existente (simuladores gratuitos, precificadores, ERPs) e a Real Tech é a única linha que marca "sim" em calcular imposto, sugerir preço e ainda cobrir teto de praça, desconto e recomendação declarada.
- **O modelo de negócio já nasce com um canal validado por comportamento de mercado:** o simulador gratuito mais completo encontrado na pesquisa é mantido por um escritório de contabilidade como isca de clientes — evidência de que escritórios contábeis querem entregar esse tipo de análise e prefeririam comprar pronto a construir.
- **O timing é o do evento:** Solveathon SESCAP, promovido pela entidade de classe dos próprios contadores — posicionar o escritório contábil como canal, não concorrente, é coerente com o ecossistema em que o produto nasceu.

---

## 10. Situações reais em que a Real Tech ajudaria uma empresa

1. **Negociação de desconto no balcão.** Um cliente da EletroLondrina pede 10% de desconto em um produto. Hoje a vendedora decide "de cabeça" se cede; com a Real Tech, o sistema mostra em segundos se aquele desconto ainda respeita a margem mínima em 2026 e em quais anos seguintes ele deixaria de caber.
2. **Reprecificação depois de um aumento de imposto no fornecedor.** Quando o custo de compra sobe (ex.: alíquota de ICMS/IBS muda em determinado ano da transição), a loja recalcula a faixa viável imediatamente, em vez de esperar o fechamento do mês para descobrir que vendeu abaixo da margem mínima.
3. **Decisão entre repasse integral, gradual ou absorção antes de uma campanha sazonal.** Como no caso real dos cosméticos relatado pelo Samir: escalonar o aumento em vez de repassar tudo de uma vez pode significar ~11% a mais de vendas no período de adaptação — decisão que hoje é tomada por intuição.
4. **Compra de mercadoria com margem apertada (caso do fio de cobre do In-Pacto).** Quando um fornecedor aumenta o preço e outro mantém, a empresa troca de fornecedor e ainda assim precisa reajustar o preço final — a ferramenta mostra até onde esse reajuste pode ir sem furar o markup mínimo de 30%.
5. **Planejamento de fluxo de caixa quando o crédito tributário depende do fornecedor.** A dor levantada pelo Jonathas Oliveira — "meu fornecedor pagou? vou conseguir meu crédito?" — vira uma simulação temporal: a empresa vê quando o dinheiro de fato entra, não só quanto vai pagar de imposto.
6. **Avaliação de troca de regime tributário (Simples x Lucro Real).** Como no caso do Alexandro Zava (Grupo Voalle): uma empresa com muitos clientes PJ que aproveitam crédito pode ganhar migrando de regime; uma com clientes majoritariamente pessoa física pode perder. A ferramenta usa o regime como parâmetro de simulação em vez de dar uma resposta genérica.
7. **Entrada de um produto novo no mix, sem histórico de preço.** O lojista informa custo, ramo e margem-alvo de um item novo e já recebe a faixa viável ano a ano, sem precisar "sentir no mercado" por meses até acertar o preço.
8. **Compensação de margem entre produtos.** Prática que a EletroLondrina já faz manualmente — sacrificar a margem de um item para recuperar em outro — vira uma decisão simulada em vez de feita de memória.
9. **Preparação para uma negociação com um cliente grande (grande volume, pede desconto agressivo).** Antes de sentar para negociar, o vendedor simula o desconto máximo sustentável para aquele pedido específico, ano a ano, e entra na negociação com um número, não com uma sensação.
10. **Escritório de contabilidade atendendo a carteira inteira de clientes PME.** Em vez de cada cliente ligar perguntando "quanto devo aumentar o preço", o escritório roda a simulação para vários CNPJs de uma vez (plano Escritório) e entrega um relatório com a própria marca — transformando uma dúvida recorrente em um serviço cobrável.
11. **Avaliação do impacto de uma mudança de regra do Comitê Gestor do IBS no meio da transição.** Como os parâmetros tributários ficam versionados e separados do motor, quando a alíquota de um ano específico mudar oficialmente, basta atualizar a tabela `ParametroTributario` — todas as simulações já cadastradas passam a refletir a regra nova automaticamente, sem precisar refazer nada manualmente.
12. **Planejamento antes de uma data sazonal de alto volume (Black Friday, Dia das Mães etc.).** A empresa testa antecipadamente diferentes níveis de desconto de campanha contra a faixa viável de cada ano, decidindo o teto de desconto da campanha antes de anunciar preços, em vez de descobrir depois que vendeu no prejuízo.

---

## Referências internas

Este documento e o Documento 1 se apoiam integralmente no material já produzido pela equipe: o *Plano de Implementação — Real Tech* (decisões técnicas, motor de cálculo, fases e testes de aceitação), o *Dossiê consolidado da jornada* (entrevistas, pesquisa de concorrência, canvas de proposta de valor e BMG) e a apresentação do *2º Checkpoint*. Qualquer divergência entre este documento e aquele material deve ser resolvida a favor dos números e citações originais das entrevistas — este documento apenas reorganiza e adapta para a arquitetura com backend.
