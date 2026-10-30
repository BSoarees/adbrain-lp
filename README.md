# AdBrain.ai · LP premium

Proposta da nova landing page do AdBrain.ai, a plataforma de inteligência para mídia paga do ecossistema Crxate. Ela mantém a identidade visual atual da marca e muda o acabamento: animações com GSAP, uma narrativa mais rápida e linguagem para agências, assessorias e gestores de tráfego.

- **LP:** `index.html`
- **Cadastro:** `signup.html`. É uma versão melhorada de adbrain.com.br/signup.
- **Versões anteriores, para comparar:** `versoes/`

O histórico das decisões, as fontes de dados e o que falta para ir ao ar estão em [CONTEXTO.md](CONTEXTO.md).

## Rodar local

Não precisa de build. É HTML, CSS e JS puros.

```bash
npx http-server -p 5173 -c-1
# http://localhost:5173
```

## Estrutura

```
index.html      LP (hero, frase, processo em 7 capítulos, para quem, planos, CTA)
styles.css      estilos da LP (tokens de cor e tipografia no :root)
main.js         animações (GSAP + ScrollTrigger + Lenis), preços mensal/anual, scroll story
signup.html     cadastro no mesmo visual da LP
signup.css      estilos do cadastro (reaproveita os tokens de styles.css)
signup.js       validação, plano escolhido (?plano=&ciclo=) e envio (createAccount)
assets/         logo oficial do AdBrain (adbrain-logo.svg) e logos Meta/Google em assets/logos/
versoes/        v1 a v4, as rodadas anteriores
```

Bibliotecas carregadas por CDN: GSAP 3.12.5 com ScrollTrigger (cdnjs) e Lenis 1.1.13 (unpkg). Fontes: Sora e JetBrains Mono (Google Fonts).

## Publicação

Publicado no GitHub Pages a partir da branch `main`. Cada push na `main` atualiza o site.
