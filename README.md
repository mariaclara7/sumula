# Súmula

Site de estatísticas do futebol brasileiro, começando pelo Brasileirão Série A 2026.
Os dados vêm da [api-sumula](https://github.com/mariaclara7/api-sumula).

**Stack:** Vite + React + TypeScript + Tailwind CSS v4, React Router e TanStack Query.

## Páginas

| Rota | O que mostra |
|---|---|
| `/` | Card do líder (clique para confete), "caixa de entrada" com manchetes geradas a partir dos dados da rodada e classificação com filtros de turno (geral, 1º, 2º), mando (todos, casa, fora) e tempo de jogo (jogo todo, só o 1º tempo, só o 2º tempo), zonas de Libertadores/rebaixamento, nota OVR e forma recente. Ao trocar o filtro, as linhas deslizam para a nova posição e mostram ▲▼ em relação à tabela normal. Os filtros ficam na URL, então dá para compartilhar o link. |
| `/simulador?rodada=:n` | Simulador no estilo do GE: jogos disputados travados, palpite nos que faltam e a tabela recalculada a cada placar, com ▲▼ em relação à tabela de verdade. Botões para preencher com o palpite da Súmula e para limpar. Os palpites ficam salvos no navegador (`localStorage`). O botão "Compartilhar simulação" gera um link com os palpites dentro (`?p=`, veja `src/util/compartilhar.ts`); quem abre vê a simulação travada e pode copiá-la para os próprios palpites. A tabela é calculada no navegador (`src/util/classificacao.ts`) com os mesmos critérios de desempate da API. |
| `/chances` | Chance de cada time ser campeão, ir para a Libertadores, Pré-Libertadores, Sul-Americana ou cair, a partir de 10.000 simulações dos jogos restantes feitas pela API. Embaixo, "A matemática": o que já está decidido (Campeão, Rebaixado, Garantido...) e quantos pontos garantem título e permanência. |
| `/estatisticas` | Resumo da liga (gols por jogo, vitórias de mandante e visitante, +2,5 gols, ambos marcam), destaques de sequências e tabelas ordenáveis de gols e sequências por time. |
| `/evolucao?times=:id,:id&medida=pontos` | Posição ou pontos rodada a rodada de até 5 times no mesmo gráfico. Sem escolha, mostra os 4 primeiros. Cada time fica com a mesma cor enquanto estiver selecionado, mesmo se outro sair. |
| `/tempos` | 1º x 2º tempo: gols por tempo, viradas e pontos ganhos ou perdidos depois do intervalo. Quando a API tem os gols com minuto (plano pago do football-data.org), mostra também um mapa de calor dos gols por faixa de 15 minutos. |
| `/times/:id` | Resumo do time: posição, aproveitamento, gráfico da posição rodada a rodada, chances até o fim com a distribuição da posição final, desempenho por recorte, números da temporada (matemática, gols e sequências), 1º x 2º tempo (com a matriz "intervalo → final" e, se houver, os gols por faixa de minuto), últimos e próximos jogos, com o palpite da Súmula em cada jogo que falta. |
| `/confronto?a=:id&b=:id` | Comparador: confronto direto na temporada e 8 números lado a lado (pontos, gols, chances...). Sem times na URL, compara o "meu time" (ou o líder) com o líder. |
| `/artilharia` | Pódio dos 3 primeiros em cards de jogador e a lista completa. Clicar num jogador abre o card com atributos e números. |

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
O modo escuro segue a preferência do sistema até a pessoa usar o botão Escuro/Claro; a escolha e o "meu time"
(destacado nas tabelas) ficam salvos no navegador.

As cores de cada clube ficam em `src/util/cores.ts`, porque a API não as fornece. As notas no estilo de game
(OVR do time, ataque, defesa e atributos dos jogadores) são fórmulas simples sobre os números reais, em `src/util/notas.ts`.
Números que contam e barras que crescem respeitam o "reduzir movimento" do sistema.

## Publicação (Cloudflare Pages, gratuito)

1. No [Cloudflare Pages](https://pages.cloudflare.com), conecte este repositório.
2. Configuração de build: comando `npm run build`, pasta de saída `dist`.
3. Variável de ambiente `VITE_API_URL` com o endereço da API no Render (ex.: `https://api-sumula.onrender.com`).
4. Adicione o endereço do site em `Cors__Origens__0` na API.

O Cloudflare Pages já entrega o `index.html` para rotas como `/times/123`, então a navegação direta funciona.
