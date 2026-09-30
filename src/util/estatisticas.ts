import type { PerfilGols, ResumoLiga, TipoSequencia } from '../api/tipos'

export const ROTULO_SEQUENCIA: Record<TipoSequencia, string> = {
  vitorias: 'Vitórias seguidas',
  invencibilidade: 'Invencibilidade',
  semVencer: 'Sem vencer',
  derrotas: 'Derrotas seguidas',
  marcando: 'Jogos marcando',
  semSofrerGol: 'Sem sofrer gol',
}

/** Sequências boas primeiro; as ruins ganham destaque vermelho quando estão em andamento. */
export const SEQUENCIA_RUIM: Record<TipoSequencia, boolean> = {
  vitorias: false,
  invencibilidade: false,
  semVencer: true,
  derrotas: true,
  marcando: false,
  semSofrerGol: false,
}

/** Parte de um total em percentual inteiro; 0 jogos dá 0%. */
export function percentual(parte: number, total: number) {
  return total === 0 ? 0 : Math.round((parte * 100) / total)
}

export function mediaPorJogo(gols: number, jogos: number) {
  return jogos === 0 ? 0 : gols / jogos
}

export function formatarMedia(media: number) {
  return media.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Indicadores de gols de um time, ao lado do mesmo número na liga inteira. */
export function indicadoresDeGols(gols: PerfilGols, liga: ResumoLiga) {
  // Na liga, cada jogo tem dois times: a média por time é metade dos gols por jogo.
  const mediaLigaPorTime = mediaPorJogo(liga.gols, liga.jogos * 2)

  return [
    {
      rotulo: 'Gols marcados por jogo',
      valor: formatarMedia(mediaPorJogo(gols.golsPro, gols.jogos)),
      liga: formatarMedia(mediaLigaPorTime),
    },
    {
      rotulo: 'Gols sofridos por jogo',
      valor: formatarMedia(mediaPorJogo(gols.golsContra, gols.jogos)),
      liga: formatarMedia(mediaLigaPorTime),
    },
    {
      rotulo: 'Sem sofrer gol',
      valor: `${gols.semSofrerGol} (${percentual(gols.semSofrerGol, gols.jogos)}%)`,
      liga: null,
    },
    {
      rotulo: 'Sem marcar',
      valor: `${gols.semMarcar} (${percentual(gols.semMarcar, gols.jogos)}%)`,
      liga: null,
    },
    {
      rotulo: 'Mais de 2,5 gols',
      valor: `${percentual(gols.maisDeDoisGolsEMeio, gols.jogos)}%`,
      liga: `${percentual(liga.maisDeDoisGolsEMeio, liga.jogos)}%`,
    },
    {
      rotulo: 'Ambos marcam',
      valor: `${percentual(gols.ambosMarcam, gols.jogos)}%`,
      liga: `${percentual(liga.ambosMarcam, liga.jogos)}%`,
    },
  ]
}
