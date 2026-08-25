# Equipe Real Tech — Dossiê Consolidado da Jornada

**Solveathon SESCAP 2026 · Londrina**
Contexto 01 — A Carga que Não se Repassa · Desafio 2 — Simulação Tributária e Precificação

*Base para o 2º Checkpoint (entrega até 19/08/2026) e para o Sprint Day (27/08/2026)*

---

## 1. O Hackathon RetailTech — Solveathon SESCAP 2026

O Solveathon SESCAP 2026 é uma jornada de inovação aplicada realizada em Londrina pelo SESCAP-LDR em corealização com o Sebrae/PR, com cerca de oito semanas de duração e foco nos desafios reais que a Reforma Tributária do Consumo — instituída pela Emenda Constitucional nº 132/2023 e regulamentada pela Lei Complementar nº 214/2025 — impõe às empresas de indústria, comércio e serviços da região. Diferente de uma maratona tradicional, a jornada é estruturada em etapas encadeadas: imersão profunda no problema (Discovery e Discovery Lab, em 08/08), ideação e modelagem da solução (15/08), dois checkpoints online de entrega (12/08 e 19/08) e uma triagem que seleciona até 10 das até 20 equipes inscritas para o Sprint Day. As propostas partem de 1 dos 3 contextos e de, no mínimo, 1 dos 9 desafios apresentados, e precisam ser escaláveis — aplicáveis a diferentes setores, não a uma única empresa. A avaliação final acontece no Sprint Day (27/08/2026), com pitch cronometrado de 3 minutos julgado por aplicabilidade, viabilidade, qualidade do MVP, validação com o mercado e clareza da apresentação. Os três primeiros colocados recebem premiação em dinheiro (R$ 1.500, R$ 1.000 e R$ 500) somada à participação gratuita em um programa de pré-incubação, e a propriedade intelectual das soluções permanece integralmente com as equipes criadoras.

## 2. Nossa Equipe

A Real Tech é a equipe nº 9 no sorteio do Circuito de Sabatina do 1º encontro. São cinco integrantes, dentro do limite do regulamento (mínimo 3, máximo 5), com perfis de desenvolvimento, produto e negócios, conforme a recomendação de multidisciplinaridade.

| Integrante | Papel na equipe |
|---|---|
| Guilherme Alima | Líder da equipe · Produto e desenvolvimento |
| Gustavo Machado | Integrante |
| Pedro Ruffo | Integrante · Validação com o Grupo In-Pacto |
| Otávio Poças | Integrante |
| Rafael Visconici | Integrante |

Contexto escolhido: Contexto 01 — A Carga que Não se Repassa. Desafio escolhido: Desafio 2 — Simular o impacto da nova carga tributária na margem e no preço, ano a ano.

## 3. Nossa Hipótese antes da 1ª Oficina

Antes de conversar com qualquer empresário, a equipe registrou por escrito o que acreditava ser verdade. Esse registro serve a dois propósitos: permitir comparar depois o que foi confirmado e o que foi derrubado, e evitar que a solução fosse desenhada antes do problema estar entendido.

### 3.1 Hipótese inicial (do problema)

> Empresas terão dificuldade para entender como a Reforma Tributária afetará suas margens e preços durante o período de transição, dificultando decisões como reajustar preços, reduzir custos ou mudar sua estratégia operacional.

### 3.2 Hipótese de solução

> Uma ferramenta que simula o impacto da Reforma Tributária na margem e no preço ao longo da transição e transforma os resultados em recomendações práticas para apoiar a tomada de decisão.

### 3.3 Exploração dos problemas

Levantamento feito pela equipe sobre o que, na prática, torna essa decisão difícil:

- Não é possível validar quanto a empresa precisa mudar na precificação sem utilizar muitos dados.
- Adaptação da empresa que utiliza o Simples Nacional à Reforma Tributária.
- Decidir o preço dos produtos.
- Decidir um preço que seja favorável em relação aos concorrentes.
- Calcular o impacto dos tributos no lucro da empresa.
- Ter um dado concreto e que vai realmente agregar à empresa.
- Como apoiar as decisões com dados reais.
- Saber decidir se muda o preço ou não.
- Saber qual é a decisão mais impactante para a empresa.

### 3.4 O que provaria que estávamos errados

Critérios de falseamento definidos antes da sabatina — se qualquer um deles se confirmasse com força, a equipe mudaria de direção.

**1. A principal preocupação não é margem/preço.** Se a maioria dos empresários apontasse como maior dor, por exemplo: adequação de ERP; emissão fiscal; burocracia; créditos; fluxo de caixa; fornecedores; e preço/margem praticamente não aparecessem, seria necessário reconsiderar o problema.

**2. O contador já resolve completamente o problema.** Se os empresários dissessem: "Meu contador já me entrega exatamente essa análise e eu não preciso fazer nada", existiria pouca oportunidade para um produto voltado diretamente ao empresário.

**3. Eles não precisam projetar nada.** Se a resposta fosse "quando chegar, eu vejo" ou "ainda é muito cedo para me preocupar", nosso senso de urgência estaria errado.

**4. Eles não tomam decisões com base nessa informação.** Se, mesmo sabendo o impacto tributário, o empresário não mudasse preço, fornecedor, produto ou operação, o simulador seria apenas um dashboard bonito, sem valor decisório.

**5. O dado necessário é impossível de obter.** Se para gerar uma simulação minimamente confiável fossem necessários: dezenas de dados; informações que o empresário não possui; integrações fiscais complexas; informações que apenas o contador consegue acessar; o MVP seria inviável dentro do prazo do Solveathon.

**6. Descobrirmos uma dor muito maior.** O critério mais importante. Se os empresários dissessem "preço não é meu problema, meu problema é X", seguiríamos X. Não temos compromisso com o Desafio 2 — nosso compromisso é encontrar o problema mais relevante que conseguimos resolver.

## 4. O que descobrimos na Oficina 1

1º Encontro — Discovery + Discovery Lab · 08 de agosto de 2026, das 08h às 12h30, no IPPOLON (UniFil, Londrina). A manhã teve duas partes: um Discovery dirigido, com palestra do contador especialista Jonathas Oliveira sobre os impactos práticos da Reforma e imersão nos 3 contextos e 9 desafios, seguido do Discovery Lab, um circuito de sabatina cronometrado (1 minuto de pergunta, 2 minutos de resposta) com três empresários convidados: Samir Nasser (BRN Holding — varejo, agro e imobiliário), Alexandro Zava (Grupo Voalle — software para provedores) e Jonathas Oliveira (Tetra Auditoria e Consultoria).

### 4.1 A pergunta que fizemos no Discovery Lab

> Levando em consideração o que foi dito sobre margem de lucro, você consegue nos dar um exemplo de situação real que já aconteceu, ou até mesmo hipotética, pensando nos dois contextos das suas empresas — Simples Nacional e Lucro Real — sobre algum gargalo real hoje que dificulta ou até impede sua empresa de aplicar novas soluções, como a simulação dessa margem que o Jonathas exemplificou? E como você toma decisões tributárias e de precificação considerando as dificuldades e as ferramentas que tem disponíveis — quais seriam essas ferramentas?

### 4.2 O que ouvimos

**Samir Nasser — visão do empresário de varejo**

O processo de precificação descrito segue aproximadamente este caminho: o fornecedor passa a tabela de preços, a empresa considera os impostos, consulta a contabilidade, aplica a margem de contribuição mínima, chega a um preço sugerido e o compara com o mercado. O ponto central é que o preço sugerido não necessariamente vira o preço final:

> Quem define o preço é o mercado.

Se o concorrente vende mais barato, aumentar o preço pode simplesmente fazer a empresa perder vendas. E o maior custo, segundo ele, não é fazer a conta do imposto — é o trabalho intelectual de decidir como reprecificar: aumentar quanto? De uma vez ou aos poucos? Aceito perder margem? O que meus concorrentes vão fazer?

O exemplo concreto que ele trouxe foi o setor de cosméticos em São Paulo, após um aumento de tributação. A maioria das empresas repassou quase tudo de uma vez (de R$ 100 para algo entre R$ 115 e R$ 119). Uma empresa optou pelo repasse gradual e, segundo o relato, teve cerca de 11% de crescimento nas vendas durante o período de adaptação. Depois o mercado se equalizou, mas o exemplo mostra que a forma de repassar o aumento produz resultados comerciais diferentes.

Ferramentas que ele usa: tabela de preços do fornecedor, sistema interno, contabilidade, dados tributários, margem mínima, acompanhamento do mercado e um banco de dados/processamento interno para apuração de créditos, principalmente no contexto do Lucro Real.

**Jonathas Oliveira — visão fiscal, contábil e financeira**

No Lucro Real, a estrutura existe: contabilidade, acompanhamento das notas fiscais, processamento interno, banco de dados, cálculo dos créditos e análise tributária. Empresas maiores conseguem colocar gente e estrutura em cima do problema — o que levanta imediatamente a pergunta: e a empresa pequena, que não tem essa estrutura?

Sobre crédito tributário, ele explicou que hoje emitir ou receber uma nota não significa necessariamente conseguir saber toda a situação tributária do fornecedor. Com a Reforma, o pagamento efetivo do tributo passa a importar para o aproveitamento do crédito em determinadas situações, o que gera uma preocupação: "meu fornecedor pagou? Eu vou conseguir meu crédito?" — algo que afeta não só o fiscal, mas o caixa.

**Alexandro Zava — regime tributário e perfil de cliente**

A contribuição central foi a pergunta "será que vale a pena mudar de regime?". Uma empresa do Simples pode ter clientes pessoa física/consumidor final ou clientes PJ que aproveitam créditos, e isso muda a vantagem econômica de cada regime. Não existe resposta universal: em um caso pode ser melhor ficar no Simples com preço mais competitivo; em outro, migrar para o regime híbrido e gerar créditos para clientes PJ. Depende do perfil da empresa e dos seus clientes.

**Três descobertas transversais**

- **O caixa entra na conta.** A Reforma não muda apenas quanto imposto se paga, mas quando o dinheiro entra e sai. Preço + imposto + crédito + timing = decisão financeira. Uma empresa pouco capitalizada sofre muito com isso.
- **O varejo trabalha com margem apertada e produtos quase commodity.** Se você vende o mesmo refrigerante que os mercados A, B, C e D, não dá para dizer "meu imposto aumentou, agora custa R$ 12". Aumentar preserva margem mas pode perder vendas; manter preserva competitividade mas destrói margem; aumentar parcialmente tenta equilibrar. É exatamente aí que uma ferramenta de decisão faz sentido.
- **IA sem regras específicas erra.** Perguntar a uma IA genérica "qual preço devo colocar?" ignora margem mínima, tipo de cliente, impostos, região, produto, concorrência e regras da empresa. O caminho é: a empresa define suas regras → o sistema entende as variáveis → o motor calcula → a IA interpreta os cenários.

**Como resolvem hoje**

| Problema | Como resolvem atualmente |
|---|---|
| Preço do produto | Tabela do fornecedor + sistema |
| Impostos | Contabilidade / sistema |
| Margem | Sistema / contabilidade |
| Crédito tributário | Banco de dados / processamento interno |
| Reforma | Contador + sistemas + acompanhamento |
| Mercado | Concorrentes / preço praticado |
| Decisão estratégica | Pessoas / o próprio empresário |
| Empresas maiores | Estrutura fiscal e contábil interna |

A lacuna que aparece: os sistemas conseguem fazer cálculos, mas quem transforma esses cálculos em uma decisão estratégica de preço é sempre uma pessoa — e, na empresa pequena, essa pessoa é o dono, acumulando essa função com todas as outras.

### 4.3 Preenchimento do Formulário do 1º Checkpoint

Entrega realizada até 12/08/2026, às 23h59, via Google Forms. Respostas registradas:

**3 — Contexto escolhido pela equipe**
Contexto 1: A Carga que Não se Repassa.

**4 — Desafio(s) escolhido(s)**
Desafio 2 — Simulação Tributária e Precificação (Contexto 1).

**5 — Problema central**
Como poderíamos ajudar varejistas de pequeno e médio porte, nos regimes do Simples Nacional e Lucro Real, a ajustar preços e margens durante a transição do IBS/CBS, sem repassar impactos tributários de forma abrupta ao cliente e sem depender de uma estrutura fiscal própria?

**6 — Pergunta 1 (Lacuna de Processo)**
Quando precisa tomar uma decisão importante para a empresa, especialmente envolvendo finanças ou impostos, como você avalia as opções? Quais informações ou ferramentas utiliza?

**7 — Pergunta 2 (Lacuna de Impacto)**
O que você gostaria de entender melhor sobre os impactos da Reforma Tributária para tomar decisões mais seguras?

**8 — Pergunta 3 (Lacuna Emocional)**
Pensando na Reforma Tributária, o que mais preocupa sua empresa hoje? Por que isso preocupa vocês? Se conseguir, dá para dar um exemplo concreto?

**9 — Pergunta 4 (Lacuna de Restrição)**
Pensando em uma situação real em que sua empresa precisou lidar com uma mudança tributária, o que dificultou ou impediu vocês de fazer algo diferente? A falta de tempo, o custo, dificuldade na equipe ou alguma outra coisa?

**10 — Pergunta 5 (Lacuna de Consequência)**
Desde que você começou a acompanhar a Reforma Tributária, houve alguma decisão da empresa que vocês adiaram, mudaram ou tomaram por causa dela? O que aconteceu?

**11 — Dor mapeada antes da conversa**
Empresas de varejo (Simples Nacional e Lucro Real) não têm como simular, de forma simples e acessível, o impacto da nova carga tributária (IBS/CBS) na sua margem e no seu preço de venda ano a ano. Assim, tomam decisões de precificação pelo "feeling", sem dados, correndo o risco de repassar o tributo de forma equivocada e perder competitividade.

**12 — A fala do empresário confirmou ou descartou a hipótese?**
Confirmou parcialmente.

**13 — Manteve o foco ou mudou de direção?**
Mantivemos o foco no problema original (Desafio 2), mas ampliamos sua compreensão. As entrevistas reforçaram que mudanças tributárias tornam a formação e a revisão de preços uma decisão complexa, que exige análise de margem, regras tributárias e comportamento do mercado. Também identificamos que essa decisão está relacionada ao fluxo de caixa e, para empresas do Simples, pode envolver a escolha do regime tributário. Não houve mudança de direção, mas aprofundamento.

**14 — O que descobrimos de novo**
Duas dimensões que não estavam na hipótese inicial. Primeira: precificação e fluxo de caixa estão diretamente relacionados — não basta saber quanto o tributo ou crédito representa, é necessário entender quando esse impacto ocorre no caixa, especialmente diante das mudanças no modelo de créditos e do split payment. Segunda: para empresas do Simples, a precificação pode estar ligada à própria escolha do regime tributário; dependendo do perfil dos clientes e do aproveitamento de créditos, permanecer no Simples com preço mais competitivo pode ser mais vantajoso do que migrar.

**15 — Caminho de solução mais promissor**
Desenvolver um simulador de margem e preço durante a transição do IBS/CBS, capaz de comparar diferentes cenários de decisão. Além do impacto do repasse tributário no preço e na margem, a ferramenta deverá considerar o efeito temporal no fluxo de caixa e, para empresas do Simples, permitir a comparação entre permanecer no regime atual com ajustes de preço ou optar por um regime diferente. Assim o simulador deixa de ser apenas uma calculadora e passa a apoiar decisões estratégicas de precificação.

## 5. Validação com empresas reais

Entre o 1º e o 2º encontro, a equipe aplicou as perguntas de validação com duas empresas reais fora do evento, conforme orientação da organização. As duas conversas foram escolhidas por representarem perfis diferentes de varejo: uma loja de eletrodomésticos e móveis e um distribuidor de materiais elétricos.

### 5.1 EletroLondrina (conversa com a Tia Cida, via WhatsApp)

A precificação da loja é feita pelo Pardal, responsável pela tabela de preços. A fórmula relatada é direta:

> Custo do produto com frete, IPI e Substituição Tributária, se houver (todos os impostos que vêm na nota de compra) + despesas fixas (comissão do vendedor, água, luz, aluguel, impostos que vamos pagar), algo em torno de 20% + margem de lucro que varia em torno de 35%.

Outros pontos registrados na conversa:

- O sistema utilizado para registrar os produtos é o Sistema da Ceprodac.
- O preço do concorrente não entra no cálculo dentro do sistema — mas entra na hora de fechar a venda: "sempre na hora de fechar venda, se tiver perdendo, olha".
- Decisões difíceis de preço acontecem com frequência: "sim, muitas vezes".
- O preço de venda é custo da mercadoria + impostos + despesas + lucro. Quando é preciso reduzir algo, o que cai é o lucro — na prática, dando mais desconto.
- A maior dificuldade é o preço da concorrência: se ficar mais caro que a praça, o produto não vende.
- Quando sacrifica a margem de um produto, a empresa tenta recuperar a margem em outro produto.

Leitura da equipe: a EletroLondrina já tem uma fórmula de custo estruturada e um sistema para aplicá-la. O que ela não tem é apoio para a decisão que vem depois da fórmula — quanto sacrificar, em qual produto, e como recompor essa margem em outro item. A prática de "sacrificar aqui e recuperar ali" é exatamente a decisão que a Reforma vai tornar mais frequente e mais arriscada.

### 5.2 Grupo In-Pacto (entrevista conduzida pelo Pedro com sua gestora)

| Pergunta | Resposta |
|---|---|
| Como define preço | O mercado comanda o preço de venda. Dentro da empresa, comprar bem é o mais importante: os preços variam diariamente, mas a compra permanece no valor pago e mantido em estoque — então é possível vender mais caro tendo pago barato. |
| Exemplo real de produto | Não foi possível obter um produto específico, mas o markup mínimo é de 30%, chegando a 40% ou mais em alguns produtos. Comprando por R$ 100 e vendendo por R$ 130, dentro desses 30 estão impostos, funcionário, água, luz e demais despesas. |
| O que acontece quando o custo muda | Segue-se o padrão do mercado: se aumenta, aumentamos; se diminui, mantemos ou reduzimos um pouco, porque não se pode perder a margem. No caso do fio de cobre, se o fornecedor habitual aumenta e outro mantém o valor, troca-se de fornecedor e ainda assim aumenta-se o preço. |
| Quem ajuda a decidir | O mercado, o valor de compra e a relação de confiança e atendimento com o fornecedor. Nem sempre o melhor é o preço — proatividade também pesa. |
| Ferramentas que usa | Contabilidade. A gestora financeira acompanha de perto os assuntos da nova Reforma e serve de apoio interno. |
| Onde sente dificuldade | "Não é uma dificuldade, mas perante a nova reforma e a precificação acredito que o que precisamos fazer é continuar trabalhando e rezar para ser melhor." |
| O "botão mágico" antes de precificar | Saber o preço que todos os maiores concorrentes estão praticando, para saber como se posicionar. Observação do entrevistador: ela não olha só os concorrentes — parte do preço de compra e do mínimo de 30% de lucro; o dado do concorrente serviria para subir o preço um pouco, quando possível. |

### 5.3 Padrões que se repetem nas duas empresas

- **Existe uma fórmula, e ela é simples.** Custo de compra com impostos da nota + despesas fixas em percentual + margem-alvo. Não é preciso pedir dezenas de dados ao empresário para reproduzir esse cálculo — o que derruba o critério de falseamento nº 5.
- **A margem-alvo é um número conhecido e defendido.** 35% na EletroLondrina, 30% de markup mínimo no In-Pacto. É um parâmetro que a empresa já tem na cabeça e que pode ser o eixo do simulador.
- **O teto é o mercado, não a conta.** "Se ficar mais caro que a praça, o produto não vende" e "o mercado comanda o preço" dizem a mesma coisa que o Samir: a conta define o piso, o concorrente define o teto, e a decisão vive no meio.
- **O ajuste real acontece por desconto e por compensação entre produtos.** Nas duas empresas o que cede é o lucro, e a recomposição é feita em outro item do mix — uma decisão que hoje é tomada de cabeça, sem simulação.
- **O contador não resolve a decisão.** Ele apoia o cálculo e a interpretação das regras, mas quem decide preço é o empresário — o que derruba o critério de falseamento nº 2.
- **A urgência existe, mas é difusa.** A resposta "continuar trabalhando e rezar para ser melhor" mostra que a preocupação é real e que hoje não há instrumento nenhum para tratá-la — o que é, na prática, a nossa oportunidade.

## 6. Soluções — funcionalidades e priorização

Na Oficina 2 (15/08, Sebrae Londrina), a dinâmica 1-4-ALL gerou uma lista de funcionalidades candidatas, e cada uma foi avaliada de 1 a 5 em três critérios: impacto no problema central (valor), viabilidade de implementação (esforço × tempo até o Sprint Day) e potencial de demonstração (diferencial e apresentação para a banca). Abaixo, cada funcionalidade é apresentada com o motivo pelo qual ela existe — sempre ancorado no que foi ouvido nas entrevistas — e com a leitura da equipe sobre sua prioridade.

### 6.1 Núcleo — o que precisa existir para a solução ter valor

**Entrada em 4 campos (originalmente "calcular margem a partir de informações simples")**
Impacto 5 · Viabilidade 3 · Demonstração 4 — a funcionalidade mais bem posicionada do conjunto. O empresário informa o custo de compra, as despesas fixas em percentual, a margem-alvo e o regime, e o sistema devolve preço e margem sob as regras de cada ano da transição. A palavra "simples" não é enfeite: as duas entrevistas mostraram que a fórmula usada na prática cabe em três ou quatro campos (o "20% de despesa + 35% de margem" da EletroLondrina, o "markup mínimo de 30%" do In-Pacto). A pesquisa de concorrência (seção 7) confirmou que esse é o ponto de ruptura real do mercado: as ferramentas gratuitas existentes pedem alíquota efetiva do DAS, PIS, COFINS, ISS, ICMS, IPI, NCM, percentual de aproveitamento de crédito e RBT12 — dados que o varejista simplesmente não tem na cabeça.

**Faixa viável de preço — piso de margem e teto da praça**
Funcionalidade criada após a pesquisa de concorrência, não estava na tabela original. É a resposta ao pedido que apareceu nas duas entrevistas de forma independente: a gestora do In-Pacto disse que gostaria de saber o preço que os maiores concorrentes praticam, e a EletroLondrina disse que se ficar mais caro que a praça, o produto não vende. Em vez de tentar coletar preço de concorrente — o que seria caro e frágil —, o sistema pede ao empresário a faixa de preço da praça que ele já observa no dia a dia e a usa como restrição superior. O resultado é uma faixa: o piso é a margem mínima que ele não aceita furar, o teto é o preço que o mercado suporta, e a simulação mostra o que acontece com essa faixa em cada ano do IBS/CBS. Nenhuma ferramenta pesquisada faz isso.

**Comparação de cenários de repasse**
Impacto 5 · Viabilidade 2 · Demonstração 5 — o maior potencial de demonstração de toda a lista. O empresário compara lado a lado: repassar o aumento integralmente, repassar de forma gradual ou absorver parte na margem, vendo o efeito de cada escolha sobre preço, margem e competitividade ao longo dos anos. Nasce diretamente do caso do Samir sobre os cosméticos em São Paulo: as empresas que repassaram tudo de uma vez e a que repassou gradualmente chegaram a resultados comerciais diferentes, com cerca de 11% de crescimento nas vendas para quem escalonou. É importante notar a diferença em relação ao que já existe no mercado: as ferramentas gratuitas aceitam um percentual de repasse e devolvem um resultado; aqui, três estratégias são simuladas ao mesmo tempo e ao longo do tempo, e comparadas contra a faixa viável.

**Cenário de desconto**
Impacto 3 · Viabilidade 4 · Demonstração 3 — alta viabilidade e ligação direta com a prática relatada. A Tia Cida foi clara: quando é preciso ceder, o que cai é o lucro, "dando mais desconto". O In-Pacto opera com a mesma lógica ao defender o markup mínimo. Simular o desconto máximo possível antes de furar a margem mínima, ano a ano da transição, é barato de construir e fala a língua do vendedor no balcão. Foi também a única funcionalidade do conjunto que não encontrou equivalente em nenhuma ferramenta pesquisada.

**Alertas e recomendações**
Impacto 4 · Viabilidade 3 · Demonstração 4 — a camada que transforma número em decisão. Avisos do tipo "neste cenário sua margem cai abaixo do seu mínimo de 30%" ou "este reajuste coloca o produto acima da faixa que você definiu como praça". O Samir foi explícito ao dizer que o maior custo não é fazer a conta do imposto, mas o trabalho intelectual de decidir como reprecificar. A pesquisa de concorrência reforçou o ponto: todas as ferramentas encontradas terminam em um número acompanhado de um aviso para procurar um profissional. Nenhuma termina em uma decisão. Aqui também vale a ressalva feita na oficina sobre IA: a recomendação nasce das regras que a própria empresa declarou, e o modelo de linguagem apenas interpreta e explica o que o motor determinístico calculou.

### 6.2 Cobertura e experiência — o que amplia o alcance

**Cobrir Lucro Real e Simples Nacional**
Impacto 5 · Viabilidade 1 · Demonstração 4 — impacto alto, viabilidade baixa, e agora também baixa diferenciação. A comparação entre regimes foi a contribuição do Alexandro na sabatina, mas a pesquisa de concorrência mostrou que ela já é oferecida gratuitamente por pelo menos três ferramentas, incluindo o simulador de um escritório de contabilidade. A decisão da equipe é distinguir dois conceitos que estavam colados: o regime como parâmetro entra no MVP (é o quarto campo de entrada e altera todo o cálculo), enquanto a comparação lado a lado entre regimes fica como roadmap.

**Compensação de margem entre produtos (mix)**
Não estava na tabela original, mas é uma das práticas mais concretas que a validação revelou: a EletroLondrina sacrifica a margem de um produto e tenta recuperá-la em outro. É a decisão que o dono toma na prática e que nenhuma ferramenta apoia. Fica como objetivo secundário (stretch) do Sprint Day, com escopo mínimo de dois produtos, porque exige cadastro e o benefício não é demonstrável em poucos segundos.

**Histórico de preços**
Impacto 3 · Viabilidade 2 · Demonstração 4 — guardar as simulações e as decisões tomadas para acompanhar o repasse ao longo da transição. Faz sentido conceitual, porque a transição é longa e o repasse gradual só funciona se houver acompanhamento. Mas depende de uso continuado, o que não é demonstrável em um pitch de 3 minutos.

**Responsividade**
Impacto 4 · Viabilidade 3 · Demonstração 2 — o empresário de varejo decide preço no balcão, no celular, no meio do expediente. Funciona mais como requisito de qualidade da interface do que como funcionalidade a ser apresentada: é obrigatória para o produto ser usado, mas não é o que convence a banca.

**Velocidade**
Impacto 2 · Viabilidade 5 · Demonstração 2 — a funcionalidade mais fácil de garantir e a de menor impacto isolado. Vale como meta de projeto (a simulação precisa responder em segundos, não em minutos), não como item de escopo.

**O sistema precisa ser simples**
Impacto 1 · Viabilidade 5 · Demonstração 3 — o menor score da tabela, e por um motivo justo: simplicidade não é uma funcionalidade, é uma restrição que atravessa todas as outras. Vale registrar, porém, que aquilo que a equipe pontuou como restrição interna virou, depois da pesquisa de concorrência, o principal argumento comercial do produto: é a barreira de entrada que faz as ferramentas gratuitas existentes serem inutilizáveis pelo público-alvo. Como escopo, ela continua embutida em "entrada em 4 campos"; como posicionamento, ela é o diferencial.

**Preço em duas camadas**
Impacto 2 · Viabilidade 2 · Demonstração 4 — separar preço de tabela e preço negociado/praticado. Conversa com o comportamento observado (o preço do sistema não é o preço da venda), mas exige mais modelagem do que entrega no prazo. Fica registrada como evolução — em parte, a faixa viável já cobre a intuição por trás dela.

### 6.3 Resumo das notas

| Funcionalidade | Impacto | Viabilidade | Demonstração | Score |
|---|---|---|---|---|
| Entrada em 4 campos | 5 | 3 | 4 | 60 |
| Comparação de cenários de repasse | 5 | 2 | 5 | 50 |
| Alertas e recomendações | 4 | 3 | 4 | 48 |
| Cenário de desconto | 3 | 4 | 3 | 36 |
| Responsividade | 4 | 3 | 2 | 24 |
| Histórico de preços | 3 | 2 | 4 | 24 |
| Cobrir Lucro Real e Simples Nacional | 5 | 1 | 4 | 20 |
| Velocidade | 2 | 5 | 2 | 20 |
| Preço em duas camadas | 2 | 2 | 4 | 16 |
| O sistema precisa ser simples | 1 | 5 | 3 | 15 |

O score é o produto das três notas — critério escolhido porque penaliza funcionalidades desequilibradas: uma ideia de impacto máximo e viabilidade 1 não sobe no ranking apenas por ser desejável. A faixa viável e a compensação de mix não constam da tabela porque surgiram depois da Oficina 2, a partir da pesquisa de concorrência descrita na seção 7.

## 7. Concorrência — o que já existe no mercado

Levantamento feito entre a Oficina 2 e o 2º Checkpoint. O resultado obrigou a equipe a reposicionar o produto: a hipótese de que "não existe ferramenta que simule o impacto da Reforma na margem" é falsa. Existem várias, algumas gratuitas, e uma delas é mantida por um escritório de contabilidade.

### 7.1 O que foi encontrado

- **Omie — simulador gratuito da Reforma Tributária.** Não entrega uma fotografia de um único ano: acompanha toda a curva de transição, mostrando o comportamento dos tributos ano a ano a partir de 2026. É um ERP de grande porte oferecendo a simulação como isca de aquisição.
- **Carmelitas Contabilidade — simulador gratuito, o concorrente mais próximo.** Compara a carga atual com cenários de 2026 a 2033, tem modo avançado com NCM/NBS, Fator R e comparação entre Simples, Presumido e Real, e inclui um bloco de impacto no preço de venda que projeta quanto seria necessário repassar, total ou parcialmente, para manter a margem. É, em essência, o MVP que a equipe havia desenhado.
- **Tributos.io — calculadora gratuita.** Traz evolução por ano, um módulo de preço e margem e trilhas separadas para Simples, Lucro Presumido e Lucro Real.
- **Preço Certo — plataforma de precificação com consultoria.** Usa exatamente o mesmo enquadramento que a equipe havia escolhido: posiciona que o contador cuida do fiscal e do passado, enquanto eles cuidam da decisão e do futuro. O núcleo da oferta não é software, é o especialista que valida a decisão junto com o cliente, e o preço é sob medida pelo volume de pedidos.
- **Gerapreço (Prolucro) — precificador.** Gera o preço de cada produto e permite simular preços diferentes para orientar o vendedor. A consultoria associada parte de R$ 1.500.
- **ERPs (Bling, Omie, Bluesoft, entre outros).** Vêm incorporando a Reforma à rotina de precificação e ao recálculo de margem. O Bluesoft, por exemplo, publicou recentemente a integração da Reforma com a precificação de produtos, atualizando o cálculo de margem líquida.

### 7.2 O que isso derruba

Três premissas da equipe caíram de uma vez:

- "Ninguém simula o impacto da Reforma na margem" — simulam, inclusive de graça.
- "Ninguém projeta ano a ano até 2033" — projetam, inclusive ERPs de grande porte.
- "A comparação entre regimes é nosso diferencial" — é gratuita em pelo menos três ferramentas, e uma delas é de um escritório de contabilidade.

### 7.3 O que continua vazio

A análise campo a campo das ferramentas gratuitas revelou onde a oportunidade real está, e ela é mais estreita e mais defensável do que a hipótese original:

- **Todas exigem dados fiscais que o varejista não tem.** Para usar o simulador mais completo é preciso informar alíquota efetiva do DAS, PIS, COFINS, ISS, ICMS, IPI, NCM, percentual de aproveitamento de crédito, RBT12 e folha de 12 meses. A Tia Cida não sabe nenhum desses números — ela sabe custo, despesa fixa e margem.
- **Nenhuma pergunta o preço do concorrente.** Todas modelam o piso (custo + imposto + margem) e ignoram o teto. Foi o único dado que as duas empresas entrevistadas pediram espontaneamente.
- **Nenhuma trata desconto.** É onde a margem efetivamente morre no varejo, segundo as duas entrevistas, e não existe em nenhuma ferramenta encontrada.
- **Nenhuma trata compensação de margem entre produtos.** A prática de sacrificar um item e recuperar em outro não é apoiada por nada.
- **Nenhuma termina em decisão.** Todas encerram em um número e em um aviso para procurar um profissional. Nenhuma declara uma recomendação, porque nenhuma conhece as regras da empresa.

### 7.4 Reposicionamento

O cálculo do imposto virou commodity e não é mais um diferencial defensável. A equipe move o produto de "simulador tributário" para "faixa viável de preço": o piso é a margem mínima que a empresa não aceita furar, o teto é o preço que a praça suporta, e a ferramenta mostra o que acontece com essa faixa em cada ano da transição — e o que o desconto faz com ela. É um espaço que a pesquisa não encontrou ocupado.

| Ferramenta | Calcula imposto | Sugere preço | O que falta |
|---|---|---|---|
| Simuladores gratuitos (Omie, Carmelitas, Tributos.io) | Sim | Parcial | Exigem parâmetros fiscais; sem teto de praça, sem desconto, sem recomendação |
| Precificadores (Preço Certo, Gerapreço) | Parcial | Sim | Decisão vem do consultor humano; custo e implantação fora do alcance da PME |
| ERPs (Bling, Omie, Bluesoft) | Sim | Sim | Exigem cadastro completo da operação; a decisão continua com o dono |
| Real Tech | Sim | Sim | 4 campos, teto da praça, desconto e recomendação declarada |

Observação estratégica: o fato de o simulador mais completo encontrado ser mantido por um escritório de contabilidade, como ferramenta de captação de clientes, é a evidência de mercado mais forte a favor do modelo de distribuição adotado na seção 9 — escritórios contábeis querem entregar esse tipo de análise e estão dispostos a construir ferramenta própria para isso.

## 8. Proposta de Valor

Modelagem feita na Etapa 3 da Oficina 2, a partir do Canvas da Proposta de Valor, e revisada após a pesquisa de concorrência.

### 8.1 Perfil do cliente

| Bloco | Conteúdo |
|---|---|
| Tarefas do cliente | Decidir preço e desconto durante a transição do IBS/CBS sem perder competitividade nem furar a margem mínima. |
| Dores | Incerteza sobre a Reforma; risco de perder margem; falta de estrutura fiscal própria; não saber quanto o concorrente vai cobrar; não conseguir usar as ferramentas existentes por não ter os dados que elas pedem. |
| Ganhos | Segurança e confiança; saber quanto cobrar e quanto pode descontar; manter a margem e evitar perdas. |

### 8.2 Mapa de valor

| Bloco | Conteúdo |
|---|---|
| Produtos e serviços | Simulador de faixa viável de preço: piso de margem e teto de praça, ano a ano da transição, com comparação de cenários de repasse e simulação de desconto. |
| Aliviadores de dores | Pede 4 campos, não parâmetros fiscais. Testa cenários antes da decisão. Trata o desconto, que é onde a margem morre. |
| Criadores de ganho | Termina em recomendação declarada, não em número. Previsibilidade e preservação da margem. Alerta quando um cenário viola as regras que a própria empresa definiu. |

### 8.3 Declaração da proposta de valor

> Para o varejista de pequeno e médio porte que precisa decidir preço durante a transição do IBS/CBS e não tem estrutura fiscal própria, a Real Tech mostra a faixa viável de preço — entre a margem que ele não aceita furar e o preço que a praça suporta — em cada ano da Reforma, e termina em uma recomendação, sem transferir a decisão de preço para o escritório de contabilidade.

## 9. Modelo de Negócios (Canvas BMG)

Preenchido na Etapa 3 da Oficina 2 e revisado depois da pesquisa de concorrência. A mudança estrutural em relação à versão da oficina é a promoção do escritório de contabilidade de parceiro a canal de distribuição, o que torna o modelo de dois lados e altera cinco dos nove blocos.

| Bloco | Conteúdo |
|---|---|
| 1. Segmentos de clientes | Dois lados. (a) Varejistas de pequeno e médio porte, Simples Nacional e Lucro Real, que decidem preço sem estrutura fiscal própria — o usuário final. (b) Escritórios de contabilidade que atendem carteiras de PMEs e querem entregar análise de precificação sem construir ferramenta própria — o canal. |
| 2. Proposta de valor | Para o varejista: a faixa viável de preço em cada ano da transição, a partir de 4 campos, terminando em recomendação. Para o escritório: um serviço consultivo pronto para vender à carteira, com relatório sob a marca do escritório, sem custo de desenvolvimento. |
| 3. Canais | Plataforma web self-service, com o plano gratuito como porta de entrada. Escritórios de contabilidade como canal indireto — o escritório assina, aplica na carteira e revende como serviço. Eventos e entidades do setor (SESCAP, CRC-PR, associações comerciais). Conteúdo sobre a transição como aquisição orgânica. |
| 4. Relacionamento | Varejista: self-service, com suporte por WhatsApp e e-mail. Escritório: relação assistida, com material de apresentação para a carteira e um ponto de contato dedicado. Redes sociais para conteúdo. |
| 5. Fontes de receita | Assinatura mensal em quatro níveis: Diagnóstico (grátis), Essencial (R$ 79), Profissional (R$ 199) e Escritório (R$ 149 por carteira de até 10 CNPJs, R$ 20 por CNPJ adicional). Alternativa ao plano Escritório para quem não quer revender: indicação com 20% recorrente sobre o que o cliente indicado pagar. |
| 6. Recursos principais | O ativo central é a base de parâmetros da transição (alíquotas e regras de 2026 a 2033), versionada e atualizável — é ela que dá confiabilidade ao motor. Além disso: o motor de cálculo determinístico, o time de desenvolvimento e a base de conhecimento tributário. |
| 7. Atividades principais | Manter a base de parâmetros atualizada conforme o Comitê Gestor do IBS e a Receita Federal publicam regras — esta é a atividade que sustenta o produto no tempo. Desenvolvimento e manutenção, análise de feedback e suporte ao canal contábil. |
| 8. Parcerias principais | Escritórios de contabilidade (canal e validação técnica das regras). Entidades do setor contábil e do varejo para acesso ao mercado (SESCAP, CRC-PR, associações comerciais). Sebrae e UniFil como apoio de incubação. |
| 9. Estrutura de custos | Infraestrutura enxuta, porque o cálculo roda no navegador do cliente. Tokens de IA (apenas na camada de interpretação). Desenvolvimento e manutenção. Consultoria tributária para validar os parâmetros a cada mudança normativa. Custo de canal (comissão ou desconto ao escritório) e marketing. |

### 9.1 Por que o contador é canal, e não concorrente

- **A pergunta é outra.** O escritório responde "quanto vou pagar de imposto". O produto responde "quanto eu cobro e quanto posso descontar". Nenhuma das duas empresas entrevistadas pede preço ao contador — pedem apuração.
- **O mercado já mostrou o comportamento.** O simulador gratuito mais completo encontrado na pesquisa é mantido por um escritório de contabilidade como ferramenta de captação. Escritórios querem entregar esse tipo de análise e alguns estão construindo ferramenta própria para isso — vender a ferramenta pronta é mais barato para eles do que construir.
- **A economia fecha para o escritório.** R$ 149 por mês para uma carteira de 10 clientes é R$ 14,90 por cliente atendido, valor que se recupera cobrando qualquer honorário consultivo adicional.
- **O contexto do evento pesa.** O Solveathon é realizado pelo SESCAP, entidade do setor contábil. Posicionar o escritório como parte da solução é coerente com o ecossistema em que o negócio nasceria.

### 9.2 Justificativa dos preços

A métrica de cobrança é CNPJ e profundidade de decisão, não número de usuários — no varejo pequeno, quem decide preço é uma pessoa só. A âncora é o prejuízo evitado: em uma loja com R$ 80 mil de faturamento mensal, 1 ponto percentual de margem vale R$ 800. O plano Essencial custa um décimo disso, ou seja, evitar um erro de 0,1 ponto de margem em um único mês paga a assinatura. O plano gratuito existe porque a dor é difusa — a resposta do In-Pacto sobre a Reforma foi "continuar trabalhando e rezar para ser melhor", o que não é uma frase de quem já tem orçamento reservado para o problema. Os valores são hipótese: nenhuma das cinco conversas tocou em disposição a pagar, e essa é a validação prioritária do próximo ciclo.

## 10. O que iremos implementar

O escopo foi recortado por dois critérios simultâneos: resolve a dor validada e cabe em uma demonstração de 3 minutos. Depois da pesquisa de concorrência, um terceiro critério entrou: não construir o que já existe de graça.

### 10.1 Escopo do MVP

- **Entrada em 4 campos.** Custo de compra com os impostos da nota, percentual de despesas fixas, margem-alvo e regime tributário. Nada além do que a EletroLondrina e o In-Pacto já usam na própria fórmula.
- **Faixa viável de preço.** A tela principal. O empresário informa também a faixa de preço da praça que já observa; o sistema desenha o piso (margem mínima) e o teto (praça) e mostra o que acontece com o espaço entre os dois em cada ano de 2026 a 2033.
- **Três cenários de repasse comparados.** Integral, gradual e absorção na margem, simulados ao mesmo tempo e ao longo de toda a transição, sobrepostos à faixa viável.
- **Simulação de desconto.** Qual o desconto máximo possível antes de furar a margem mínima, em cada ano — a decisão que o vendedor toma no balcão e que nenhuma ferramenta pesquisada apoia.
- **Alertas e recomendação.** Motor de regras determinístico sobre as restrições declaradas pela empresa, com uma camada de linguagem que apenas interpreta e explica o que o motor calculou.
- **Impacto no caixa.** Faz parte da solução apresentada à banca e entra na construção assim que o núcleo estiver de pé. A dor foi levantada pelo Jonathas na sabatina e é a razão de o eixo do produto ser temporal — apresentá-la como parte da solução é coerente com o problema que a equipe declarou entender.

### 10.2 Ordem de construção

A apresentação do 2º Checkpoint mostra a visão da solução; esta seção declara em que ordem ela será construída. A distinção importa porque o critério II da triagem avalia se a ideia pode ser desenvolvida e testada — declarar a sequência é o que demonstra viabilidade, e é também o que protege a equipe de chegar ao Sprint Day com uma funcionalidade bonita e o núcleo incompleto.

1. Motor de cálculo tributário funcionando e testado.
2. Preço, margem e faixa viável funcionando.
3. Desconto e recomendação funcionando.
4. Impacto no caixa, assim que os três anteriores estiverem de pé.
5. Refinamento e camada de texto por IA, por último.

A regra que orienta a ordem: chegar ao dia 26 com os itens 1 a 3 impecáveis e sem caixa significa ter produto. Chegar com um módulo de caixa bonito e a simulação principal frágil significa ter uma demonstração vistosa de uma solução fraca.

### 10.3 Objetivo secundário (só se houver tempo)

Compensação de margem entre dois produtos: sacrificar um item e recuperar em outro, como a EletroLondrina faz hoje manualmente.

### 10.4 Fora do escopo, e por quê

- **Comparação lado a lado entre regimes.** Já existe gratuitamente em pelo menos três ferramentas. Construir seria gastar o tempo mais escasso do projeto para empatar. O regime continua entrando como parâmetro do cálculo.
- **Histórico de decisões.** Só tem valor com uso continuado; não demonstrável.
- **Integração com ERP, SPED ou XML.** Descartada por princípio: o público-alvo é exatamente quem não tem essa estrutura, e é essa exigência que torna as ferramentas concorrentes inutilizáveis para ele.

### 10.5 Riscos assumidos

- **As regras da transição ainda mudam.** Alíquotas e regras de crédito estão sendo consolidadas pelo Comitê Gestor do IBS. Mitigação: os parâmetros ficam em um arquivo versionado e editável, separado do motor, e a tela declara a data de vigência usada.
- **A tentação de virar dashboard.** O critério de falseamento nº 4 continua valendo: se a simulação não muda uma decisão de preço, desconto ou mix, ela não tem valor. Toda tela termina em recomendação, não em gráfico.
- **O caixa consumir o tempo do núcleo.** É o risco criado pela decisão de incluí-lo na solução apresentada. Mitigação: ele é o quarto item da ordem de construção e só começa quando os três primeiros estiverem funcionando e testados.
- **A recomendação ficar para o fim.** A recomendação é o principal diferencial e não pode depender da última fase. Mitigação: as frases do motor de regras são escritas junto com o motor de cálculo, na primeira fase, com os números preenchidos por interpolação. A camada de IA passa a ser refinamento opcional, não dependência.
- **O teto depende do usuário informar — testado em 19/08 e confirmado.** Era o maior risco da solução. As duas empresas responderam no mesmo dia que o preço do concorrente chega sozinho, pelo cliente: a EletroLondrina relatou que os próprios clientes falam, porque hoje cotam por internet e WhatsApp em todo lugar e citam o preço na hora de fechar; o In-Pacto relatou que clientes novos orçam em vários lugares e a empresa pergunta os preços. Ambas sabem a referência, não o valor exato — por isso o campo pede uma faixa aproximada, e não um número preciso. O risco caiu; permanece a ressalva de que a ferramenta não coleta preço de concorrente, apenas transforma em restrição de cálculo algo que o empresário já ouve todo dia.
- **Disposição a pagar não foi validada.** Nenhuma das cinco conversas tocou em preço de assinatura.
- **O mercado está se movendo rápido.** ERPs e escritórios lançaram simuladores nos últimos meses. A defesa não é o cálculo, é o recorte de decisão e a simplicidade de entrada.

## 11. Plano de implementação

Do 2º Checkpoint (19/08) ao Sprint Day (27/08). O plano é organizado para que, a qualquer momento a partir do dia 24, exista uma versão demonstrável — em vez de um sistema completo que só funciona na última hora.

### 11.1 Decisões técnicas

- **Sem backend, sem banco, sem login.** Todo o cálculo é aritmética determinística e roda no navegador. Três razões: a demonstração não depende do wi-fi do local, não há tempo para infraestrutura em 8 dias, e o MVP genuinamente não precisa de servidor. Isso também zera o custo de infraestrutura no modelo de negócio.
- **Parâmetros da transição em arquivo versionado, separado do motor.** Um arquivo de configuração com as alíquotas e regras de cada ano de 2026 a 2033. É o ativo do produto e a resposta honesta à pergunta "e se a regra mudar?".
- **Stack independente do Kairon.** Conforme a regra de originalidade do regulamento e a decisão da equipe de manter os projetos separados. Sugestão: Vite + React + TypeScript, gráficos em SVG ou Recharts, deploy estático.
- **A IA fica fora do caminho crítico.** O motor de regras decide; o modelo de linguagem apenas redige a explicação. A chamada tem resposta em cache para os casos da demonstração, de modo que uma falha de rede nunca quebre o pitch.
- **Dados semeados.** A aplicação abre com os casos reais da EletroLondrina e do In-Pacto pré-carregados. A demonstração começa em um caso concreto, não em um formulário vazio.

### 11.2 Fases

| Data | Fase | Entrega concreta |
|---|---|---|
| Até 19/08 | 0 · Checkpoint | Apresentação em PDF (até 6 slides) e Canvas BMG atualizado com os quatro planos e o canal contábil. Nenhuma linha de código. |
| 20 a 22/08 | 1 · Motor e frases | Arquivo de parâmetros 2026–2033 e função pura de simulação (entrada, ano → preço, margem, tributo). As frases fixas de recomendação são escritas aqui, junto do motor, e não na última fase. Testes unitários com os números reais das duas entrevistas: 20% de despesa e 35% de margem da EletroLondrina, markup de 30% do In-Pacto. Sem interface. |
| 23 a 24/08 | 2 · Tela da faixa viável | Os 4 campos, o campo de preço da praça e o gráfico de faixa ano a ano. A partir daqui já existe algo demonstrável. |
| 25/08 | 3 · Cenários e desconto | Os três cenários de repasse sobrepostos à faixa e o controle de desconto com o limite de margem mínima. |
| 25/08 | 4 · Regras e recomendação | Motor de alertas sobre as restrições declaradas. As frases de recomendação já existem desde a Fase 1; aqui elas são conectadas aos cenários. |
| 26/08 | 5 · Caixa e refinamento | Impacto no caixa, se as fases anteriores estiverem fechadas. Depois, camada de texto por IA como refinamento, com cache das respostas da demonstração. |
| 27/08 manhã | 6 · Ensaio | Roteiro cronometrado, dados semeados conferidos, ensaio completo com tempo medido. Congelamento do código. |

Se houver atraso em qualquer fase, o corte acontece pela ordem inversa: primeiro a compensação de mix, depois a camada de texto por IA (as frases fixas do motor já cobrem a função), depois o módulo de caixa, depois o terceiro cenário de repasse. A faixa viável, o desconto e a recomendação não são cortáveis — são o produto.

### 11.3 Roteiro da demonstração (3 minutos)

| Tempo | O que acontece na tela e o que é dito |
|---|---|
| 0:00–0:30 | O problema, na voz de quem vive. A frase da EletroLondrina: se ficar mais caro que a praça, o produto não vende. O piso é a conta; o teto é o concorrente. |
| 0:30–1:15 | Carrega o caso real da loja. Quatro campos e o preço da praça. A faixa viável aparece, ano a ano, até 2033 — e vai estreitando. |
| 1:15–2:00 | Os três cenários de repasse sobrepostos. O gradual mantém a loja dentro da faixa por mais tempo — é o caso dos cosméticos que o Samir contou, agora em números. |
| 2:00–2:40 | O momento do desconto. O cliente pede 10%; o alerta dispara mostrando em que ano a margem mínima é furada. Nenhuma ferramenta do mercado responde a isso. |
| 2:40–3:00 | A recomendação em uma frase e o fechamento: o cálculo virou commodity, a decisão não. |

Cada minuto do roteiro corresponde a uma fase do plano, o que permite avaliar o risco de forma direta: se a Fase 3 não ficar pronta, perde-se o trecho de 1:15 a 2:40, que é o coração da apresentação.
