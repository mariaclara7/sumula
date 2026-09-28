# Súmula

Site de estatísticas do futebol brasileiro, começando pelo Brasileirão Série A 2026.
Os dados vêm da [api-sumula](https://github.com/mariaclara7/api-sumula).

**Stack:** Vite + React + TypeScript + Tailwind CSS v4, React Router e TanStack Query.

## Páginas

| Rota | O que mostra |
|---|---|
| `/` | Classificação com filtros de turno (geral, 1º, 2º) e mando (todos, casa, fora), zonas de Libertadores/rebaixamento e forma recente. Os filtros ficam na URL, então dá para compartilhar o link. |
| `/times/:id` | Resumo do time: posição, aproveitamento, gráfico da posição rodada a rodada, desempenho por recorte, últimos e próximos jogos. |
| `/confronto?a=:id&b=:id` | Confronto direto entre dois times na temporada. |
| `/artilharia` | Artilheiros com gols, assistências e pênaltis. |

## Rodando na sua máquina

Suba a api-sumula antes (ela roda em `http://localhost:5080`). Depois:

```bash
npm install
npm run dev      # http://localhost:5173
```

Em desenvolvimento, o Vite encaminha `/api` para a API local (veja `vite.config.ts`).

```bash
npm test         # testes (Vitest)
npm run lint     # oxlint
npm run build    # checagem de tipos + build de produção em dist/
```

## Estrutura

```
src/
  api/          cliente HTTP, tipos das respostas e hooks do TanStack Query
  componentes/  peças reutilizáveis (tabela, gráfico, lista de partidas...)
  paginas/      uma por rota
  util/         formatação de datas, saldo, percentual
  config.ts     competição, temporada e zonas da tabela
  index.css     cores do tema claro e escuro
```

As cores ficam só em `src/index.css`, como variáveis usadas pelo Tailwind (`bg-superficie`, `text-texto-2`...).
O modo escuro segue a preferência do sistema.

## Publicação (Cloudflare Pages, gratuito)

1. No [Cloudflare Pages](https://pages.cloudflare.com), conecte este repositório.
2. Configuração de build: comando `npm run build`, pasta de saída `dist`.
3. Variável de ambiente `VITE_API_URL` com o endereço da API no Render (ex.: `https://api-sumula.onrender.com`).
4. Adicione o endereço do site em `Cors__Origens__0` na API.

O Cloudflare Pages já entrega o `index.html` para rotas como `/times/123`, então a navegação direta funciona.
