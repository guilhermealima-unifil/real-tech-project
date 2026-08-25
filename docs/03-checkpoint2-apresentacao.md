# Real Tech — 2º Checkpoint

**Solveathon SESCAP 2026 · Londrina**

## A faixa viável de preço na transição do IBS/CBS

Contexto 01 — A Carga que Não se Repassa · Desafio 2 — Simulação Tributária

**Equipe**
Guilherme Alima (líder) · Gustavo Machado · Pedro Ruffo · Otávio Poças · Rafael Visconcini

---

## O Problema · 5 conversas em 5 empresas

### O empresário não trava na conta do imposto. Trava na decisão de preço.

Varejistas de pequeno e médio porte, sem estrutura fiscal própria, precisam ajustar preço e margem durante a transição do IBS/CBS sem repassar o aumento de forma abrupta ao cliente — e hoje decidem por percepção, não por dado.

**Mercado**
> "Quem define o preço é o mercado."
— Samir Nasser · BRN Holding

O maior custo não é fazer a conta do imposto — é o trabalho intelectual de decidir como reprecificar: quanto, quando e em qual produto.

**Fluxo de caixa**
> "Meu fornecedor pagou? Vou conseguir meu crédito?"
— Jonathas Oliveira · Tetra Auditoria

A Reforma não muda só quanto se paga, mas quando o dinheiro entra e sai. Crédito e split payment mexem no caixa, não só no fiscal.

**Regime tributário**
> "Será que vale a pena mudar de regime?"
— Alexandro Zava · Grupo Voalle

Simples ou Lucro Real deixa de ser escolha só fiscal: depende de quantos clientes são PJ e aproveitam crédito. Vira decisão de preço.

*A conta define o piso. O concorrente define o teto. A decisão vive no meio — e hoje é tomada de cabeça.*

---

## A Solução

### Onde o seu preço pode viver em cada ano da Reforma

O piso é a conta. O teto é o concorrente. A decisão vive no meio — e é esse espaço que a ferramenta desenha, ano a ano da transição, a partir dos mesmos campos que o empresário já usa hoje.

**01 · Entrada em 4 campos**
Custo, despesa fixa em %, margem-alvo e regime. As ferramentas do mercado pedem NCM, alíquota do DAS e RBT12.

**02 · A faixa viável**
Piso: a margem que você não fura. Teto: o preço que a praça suporta. Ano a ano até 2033.

**03 · Cenários de repasse**
Integral × gradual × absorção, sobrepostos à faixa. O caso dos cosméticos do Samir, em números.

**04 · Desconto e alerta**
Quanto dá para descontar antes de furar o piso, sobre as regras que a empresa declarou.

**05 · Impacto no caixa**
Não é só quanto se paga, é quando o dinheiro sai. Crédito e split payment no eixo do tempo.

**Proposta de valor**
> "Para o varejista sem estrutura fiscal própria, a Real Tech mostra a faixa entre a margem que ele não aceita furar e o preço que a praça suporta — em cada ano da Reforma, terminando em recomendação."

**Ordem de construção até o Sprint Day**
Motor tributário → preço e margem → recomendação → caixa → refinamento. O núcleo primeiro; o caixa entra assim que ele estiver de pé.

---

## Modelo de Negócio

### SaaS por assinatura, cobrado por CNPJ e por profundidade de decisão

**Diagnóstico — Grátis**
1 simulação por mês, 1 produto, cenário único.
*Aquisição: ninguém paga por uma ferramenta de Reforma antes de ver a própria margem na tela.*

**Essencial — R$ 79/mês**
1 CNPJ · cenários, desconto e alertas ilimitados.
*Perfil EletroLondrina: uma loja, um decisor, uma fórmula de preço.*

**Profissional — R$ 199/mês**
Até 3 CNPJs · mix de produtos e histórico de decisões.
*Perfil In-Pacto: recompõe margem entre itens e negocia com fornecedor.*

**Escritório — R$ 149/mês**
Até 10 CNPJs (+R$ 20 por CNPJ extra), relatório com a marca do escritório.
*R$ 14,90 por cliente atendido — o contador revende como serviço.*

**Por que R$ 79 faz sentido**
Loja com R$ 80 mil de faturamento ao mês: 1 ponto de margem vale R$ 800. O plano custa um décimo disso. Evitou um erro de 0,1 p.p. em um mês — pagou o ano inteiro de assinatura.

**O contador é canal, não concorrente**
O simulador gratuito mais completo que encontramos é mantido por um escritório de contabilidade, como isca de clientes. Escritórios já querem entregar essa análise — e alguns estão construindo ferramenta por conta própria. Vender pronto sai mais barato para eles do que construir.

**Segmento**
Dois lados: varejista PME (usuário) e escritório contábil (canal que revende à carteira).

*Preços são hipótese da equipe — disposição a pagar ainda não foi testada com os empresários.*

---

## Diferenciais

### O cálculo virou commodity. A decisão, não.

Simular o imposto ano a ano já existe — de graça, em ERP e até em site de escritório contábil. Todas param no número e mandam procurar um profissional.

| O que já existe no mercado | Calcula imposto | Sugere preço | O que falta |
|---|---|---|---|
| Simuladores gratuitos da Reforma (Omie · Carmelitas · Tributos.io) | Sim | Parcial | Exigem NCM, alíquota do DAS, RBT12. Sem teto de praça, sem desconto, sem recomendação |
| Precificadores (Preço Certo · Gerapreço) | Parcial | Sim | A decisão vem do consultor humano. Implantação e custo fora do alcance da PME |
| ERPs (Bling · Omie · Bluesoft) | Sim | Sim | Exigem o cadastro completo da operação. A decisão continua com o dono |
| **Real Tech** | Sim | Sim | 4 campos · teto da praça · desconto · recomendação declarada |

*Ninguém pergunta o preço do concorrente — o único dado que os dois empresários que entrevistamos pediram por conta própria.*

**4 campos, não 12**
Custo, despesa, margem e regime. Só o que ele já sabe de cabeça.

**Piso e teto juntos**
A conta define o piso; a praça define o teto. Só nós desenhamos os dois.

**O desconto entra**
É onde a margem morre no varejo, e não existe em nenhuma ferramenta.

**Termina em decisão**
Alerta sobre as regras da empresa, não "consulte um profissional".

---

## Evidências

### Cinco conversas. Duas hipóteses nossas derrubadas.

3 empresários da sabatina (comuns a todas as equipes) + 2 entrevistas próprias, fora do evento

| Quem | O que ouvimos | O que mudou no produto |
|---|---|---|
| Samir Nasser · BRN Holding · varejo | Repasse gradual x integral gerou resultado comercial diferente: ~11% de crescimento em vendas no caso dos cosméticos | Deixou de ser calculadora e virou comparador de cenários |
| Jonathas Oliveira · Tetra · contábil | Crédito passa a depender do recolhimento do fornecedor — mexe no caixa, não só no fiscal | Entrou o eixo temporal: não é só quanto, é quando |
| Alexandro Zava · Voalle · serviços | Mudar de regime depende de quantos clientes são PJ e aproveitam crédito — não há resposta universal | Regime virou parâmetro da simulação, não resposta pronta |
| EletroLondrina · entrevista própria | "Se ficar mais caro que a praça, não vende." Preço = custo + ~20% despesa + ~35% margem. Quando cede, cede o lucro — via desconto | Confirmou a entrada em 4 campos e originou o cenário de desconto e confirmou que o teto da praça é informável |
| Grupo In-Pacto · entrevista própria | Markup mínimo de 30%. "O mercado comanda o preço." Sobre a Reforma: "continuar trabalhando e rezar para ser melhor" | Margem-alvo virou o eixo do simulador |

**O que caiu**
- "O contador já resolve isso" — ele apoia o cálculo, mas quem decide preço é o dono, todo dia.
- "Vai exigir dados demais" — a fórmula que eles usam de verdade cabe em 4 campos.
- "O preço do concorrente é difícil de obter" — chega sozinho. "Hoje mesmo passei preço de um cabo, cliente disse que tinha mais barato."

**O que ainda falta validar**
- Disposição a pagar — nenhuma das 5 conversas tocou em preço de assinatura.
- Se o escritório contábil realmente revende à carteira — a evidência hoje é de mercado, não de conversa com escritório.
