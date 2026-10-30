# Contexto do projeto

Este documento junta o que foi decidido, de onde vieram os dados e o que falta para a LP substituir o site atual. Atualizado em 29/10/2026.

## Objetivo

Deixar o ecossistema AdBrain com acabamento mais premium sem trocar a identidade visual. A LP precisa vender rápido: a pessoa bate o olho e entende o que o produto faz, para quem é e como começar.

- **Público:** agências de marketing, assessorias e gestores de tráfego.
- **Ação principal:** criar a conta e testar por 7 dias.
- **Ação secundária:** falar com o time pelo WhatsApp, pensada para operações com mais de 25 clientes ou mais de 25 pessoas no time.

## Identidade (não mudar)

É a identidade que já está nos vídeos e posts do AdBrain.

| Item | Valor |
|---|---|
| Logo | Ícone oficial do site: quadrado ciano `#22d3ee` com o cérebro em traço escuro, criado pelo Murilo (`assets/adbrain-logo.svg`) |
| Fundo | navy `hsl(222 47% 5%)` |
| Acento | ciano `hsl(190 95% 55%)` |
| Gradiente | 120°: ciano → azul `hsl(210 95% 60%)` → violeta `hsl(250 85% 72%)` |
| Tipografia | Sora em peso forte (700 no hero e no CTA final, 600 nos títulos); JetBrains Mono nos rótulos |
| Botões | pílula branca, que vira gradiente no hover |

Regras de texto: sem travessões, sem frases de efeito vazias, sem caixas e cards desnecessários.

Regra visual ("menos cara de IA"): evitar cards com borda brilhante, pílulas e caixas em volta de tudo. O cadastro segue um estilo editorial: o formulário fica direto no fundo, os campos têm só a linha de baixo, os passos usam números "01 02 03" com divisórias finas, e as regras de senha são texto que acende.

## Estrutura da LP

1. **Hero:** "Todas as contas dos seus clientes. Uma lista do que fazer hoje."
   - À direita, um painel com Meta Ads e Google Ads conectados → AdBrain → "Onde agir hoje" por cliente.
   - Abaixo dos botões, a faixa "Integra com" e o selo Google Partner.
2. **Frase central:** "Seus anúncios já têm dados. O AdBrain transforma esses dados em decisões."
   - As duas palavras se pintam em degradê conforme a rolagem.
   - Embaixo vem a faixa com os logos oficiais e o Google Partner.
3. **Processo:** réplica da 2ª seção do site atual. O texto troca a cada capítulo e o painel do produto se transforma junto.
   - Capítulos: integrações → dados → interpretação → recomendação → acompanhamento → carteira → relatórios.
   - **Aprovado pelo time.**
4. **Para quem:** "Feito para quem gerencia anúncios de vários clientes", com agências, assessorias e gestores.
5. **Planos:** seletor mensal/anual e a faixa "Mais de 25 clientes ou mais de 25 pessoas no time? → Fale com a gente".
6. **CTA final:** "Os dados dos seus clientes já estão falando. Está na hora de ouvir."

Há um CTA em todas as seções. Todos levam ao cadastro (`signup.html`), e o "Fale com a gente" leva ao WhatsApp. No celular aparece uma barra fixa com "Fale com a gente" e "Testar grátis". O processo, no celular, não usa painel fixo: cada capítulo mostra o texto e, logo abaixo, a própria tela do produto (as cenas são clonadas por JS), para a rolagem fluir sem sobreposição.

## Fontes dos dados (tudo tirado do produto, nada inventado)

O site atual é um SPA. Os textos foram extraídos do bundle `adbrain.com.br/assets/index-*.js`.

- **Planos founding:**
  - Gestor Solo: R$ 147, 3 clientes, 1 usuário, 150 créditos
  - Agência: R$ 297, 10 clientes, 3 usuários, 500 créditos
  - Agência Pro: R$ 497, 25 clientes, 5 usuários, 1.200 créditos, vários workspaces
- **Anual:** mensal × 12 × 0,85 (desconto de 15%, mesma conta do app). Equivale a R$ 124,95 / 252,45 / 422,45 por mês, cobrado R$ 1.499,40 / 3.029,40 / 5.069,40 por ano.
- **WhatsApp oficial:** https://wa.me/message/EJFPOSDFKM4EI1
- **Cadastro atual** (adbrain.com.br/signup): nome completo, CPF, e-mail, senha (8+ caracteres, maiúscula, minúscula e número) e confirmação de senha. Também traz a "garantia de reembolso por 7 dias após a primeira cobrança".
- **Logos:**
  - Meta: Simple Icons, pintado com o azul oficial `#0081FB`
  - Google Ads e "G" do Google: Wikimedia Commons
  - Google Partner: o Murilo é Google Partner

## Histórico das rodadas

| Versão | Pasta | O que mudou |
|---|---|---|
| v1 | `versoes/v1-longa` | Primeira versão premium com GSAP: 10 seções e o mascote |
| v2 | `versoes/v2-curta` | Mais curta (venda mais rápida). O mascote saiu e entrou o cérebro de nós |
| v3 | `versoes/v3-fluxo` | Integrações em destaque e linguagem para agências. O time não gostou dos nós e pediu algo menos 3D |
| v4 | `versoes/v4-puture` | Scroll story do site atual + referência visual Puture (awwwards) e tiles flutuantes |
| v5 / v6 | raiz | Identidade da v3 de volta, logo oficial, sem tiles, degradê em "dados/decisões", anual, faixa +25, CTAs em todas as telas, painel no hero, logos Meta/Google + Google Partner e cadastro novo |

## Pendências antes de ir ao ar

1. **O cadastro ainda não cria conta.** `createAccount` em `signup.js` está vazia. Ela precisa chamar o mesmo signup do app (Supabase Auth) que roda em adbrain.com.br/signup, enviando nome, CPF, e-mail, senha, `plano` e `ciclo`.
2. **"Confirme sua senha":** foi trocado pelo botão de mostrar a senha. Se o time preferir, dá para voltar com o campo.
3. **Selo Google Partner:** hoje é um selo montado com o "G". Trocar pelo selo oficial do perfil do Murilo no Google Partners.
4. **TikTok Ads, CRM e Automações:** aparecem como "Próximas". Falta confirmar se estão mesmo no roadmap.
5. **Clientes e números do hero e do processo** (Loja Aurora, Clínica Norte, "12 contas"…): são ilustrativos, tirados da demo do site atual.
6. **Hero:** o time quer mandar outra referência para o visual da primeira dobra. A tipografia foi aprovada.
