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

## Publicação

O site e os dados ficam na **Cloudflare**, em dois Workers só com arquivos estáticos (grátis e sem limite de
visitas para arquivos estáticos):

| Worker | O que tem | Quem publica |
|---|---|---|
| `sumula` | o site (pasta `dist/`, veja `wrangler.jsonc`) | workflow **Publicar** deste repositório, a cada push na `main` |
| `sumula-dados` | a "API pré-calculada": um `.json` para cada endereço que o site usa | workflow **Coletor** da [api-sumula](https://github.com/mariaclara7/api-sumula), a cada 3 horas |

Em produção o site é gerado com `VITE_API_ESTATICA=true`: em vez de chamar a API ao vivo, lê os arquivos
(`src/api/rotas.ts` monta o nome de cada um). Não há banco em produção: a coleta usa um Postgres descartável
que só existe durante o workflow.

### Passo a passo

**1. Conta na Cloudflare (grátis)**

- **Cloudflare** ([dash.cloudflare.com](https://dash.cloudflare.com)): crie a conta e abra uma vez
  *Workers & Pages*, para a Cloudflare criar o seu endereço `*.workers.dev`. Depois:
  - copie o **Account ID** (aparece na lateral de *Workers & Pages*);
  - em *My Profile → API Tokens → Create Token*, use o modelo **Edit Cloudflare Workers**, escolha a sua conta e
    crie. Copie o token (ele só aparece uma vez).

**2. Secrets no GitHub** (*Settings → Secrets and variables → Actions → New repository secret*)

- `api-sumula`: `FOOTBALL_DATA_TOKEN`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
- `sumula` (este): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

**3. Primeira publicação**

1. Em `api-sumula`, aba *Actions* → **Coletor** → *Run workflow*. No fim do passo "Publica na Cloudflare" aparece
   o endereço dos dados, algo como `https://sumula-dados.SEU-NOME.workers.dev`.
2. Aqui em `sumula`, *Settings → Secrets and variables → Actions → Variables*, crie a variável
   `SUMULA_API_URL` com esse endereço.
3. Aba *Actions* → **Publicar** → *Run workflow*. O site fica em `https://sumula.SEU-NOME.workers.dev`.

**4. Domínio `.com.br`**

1. No [registro.br](https://registro.br), procure e registre o domínio (cerca de R$ 40 por ano, com CPF).
2. Na Cloudflare, *Add a domain* → digite o domínio → plano **Free**. Ela mostra dois *nameservers*
   (ex.: `ana.ns.cloudflare.com`).
3. No registro.br, no painel do domínio, troque os servidores DNS pelos dois da Cloudflare. Se o DNSSEC estiver
   ligado no registro.br, desligue antes (dá para religar depois pela Cloudflare).
4. Quando a Cloudflare mostrar o domínio como **Active** (de minutos a algumas horas):
   - coloque o domínio em `routes` no `wrangler.jsonc` deste repositório (o domínio e o `www`) e no
     `publicacao/wrangler.jsonc` da api-sumula (`dados.` + domínio). Hoje estão com `brasumula.com.br`;
   - troque a variável `SUMULA_API_URL` para `https://dados.brasumula.com.br`;
   - rode **Coletor** e depois **Publicar**. A Cloudflare cria o DNS e o certificado (HTTPS) sozinha.

   Não crie registros DNS (A ou CNAME) para esses endereços na mão: a Cloudflare recusa ligar o Worker
   num nome que já tem registro.

### Testar a produção na sua máquina

```bash
# na api-sumula: gera os arquivos e sobe o Worker de dados
Exportacao__Saida=publicacao/saida dotnet run --project src/Sumula.Exportador
cd publicacao && npx wrangler dev --port 8787

# aqui: gera o site em modo estático e sobe o Worker do site
VITE_API_URL=http://127.0.0.1:8787 VITE_API_ESTATICA=true npm run build
npx wrangler dev --port 8788   # http://127.0.0.1:8788
```
