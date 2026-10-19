# Estúdio de Posts

App Next.js (só front-end) para gerenciar templates de posts, pilares, público e samples, e gerar sugestões com a sua própria chave (OpenAI, Anthropic ou Google).

## Rodar

```bash
npm install
npm run dev     # http://localhost:3000
```

## Como funciona

- **Configurações**: escolha o provedor, cole a chave e clique em *Conectar*. O app busca os modelos atuais e oferece três atalhos (Rápido, Médio, Parrudo) mais uma lista completa.
- **Armazenamento**: tudo (chave, templates editados, pilares, público, samples) fica no `localStorage` do navegador, na chave `estudio-de-posts:v1`.
- **Chamadas**: vão direto do navegador para o provedor. Não há servidor nem backend.
- Anthropic usa o cabeçalho `anthropic-dangerous-direct-browser-access`, necessário para chamadas do navegador.

## Estrutura

- `lib/models.ts`: busca de modelos e escolha por faixa
- `lib/llm.ts`: chamada de texto para cada provedor
- `lib/prompts.ts`: prompts de sugestões, post completo e sub-pilares
- `lib/store.tsx`: estado e persistência
- `lib/templates.ts`: os 200 templates padrão
- `components/`: uma tela por arquivo
