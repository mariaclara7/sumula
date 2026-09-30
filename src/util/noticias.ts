import type { Artilheiro, DesempenhoPorTempo, LinhaClassificacao, Resultado, Time } from '../api/tipos'

export type TipoNoticia = 'embalado' | 'alerta' | 'artilharia' | 'virada'

export type Noticia = {
  tipo: TipoNoticia
  texto: string
  /** Para onde a notícia leva ao clicar. */
  link: string
}

/** Quantos resultados iguais seguidos o time tem no fim da lista (a mais recente é a última). */
export function sequenciaAtual(resultados: Resultado[], resultado: Resultado) {
  let quantidade = 0
  for (let i = resultados.length - 1; i >= 0 && resultados[i] === resultado; i--) quantidade++
  return quantidade
}

/** O time com a maior sequência atual do resultado; em empate, o mais bem colocado. */
function maiorSequencia(linhas: LinhaClassificacao[], resultado: Resultado) {
  let melhor: { linha: LinhaClassificacao; quantidade: number } | undefined
  for (const linha of linhas) {
    const quantidade = sequenciaAtual(linha.ultimosResultados, resultado)
    if (quantidade > 0 && (!melhor || quantidade > melhor.quantidade)) melhor = { linha, quantidade }
  }
  return melhor
}

type Entrada = {
  /** Tabela geral, em ordem de posição. */
  linhas: LinhaClassificacao[]
  artilharia?: Artilheiro[]
  tempos?: DesempenhoPorTempo[]
  times?: Map<number, Time>
}

/**
 * Manchetes da "caixa de entrada" da classificação, geradas a partir dos dados da rodada.
 * Cada tipo só aparece quando há algo a dizer (ex.: uma sequência de pelo menos 3 vitórias).
 */
export function gerarNoticias({ linhas, artilharia, tempos, times }: Entrada): Noticia[] {
  const noticias: Noticia[] = []

  const vitorias = maiorSequencia(linhas, 'vitoria')
  if (vitorias && vitorias.quantidade >= 3) {
    const { linha, quantidade } = vitorias
    const onde = linha.posicao === 1 ? 'segue na ponta' : `está em ${linha.posicao}º`
    noticias.push({
      tipo: 'embalado',
      texto: `${linha.time.nomeCurto} vence o ${quantidade}º jogo seguido e ${onde}`,
      link: `/times/${linha.time.id}`,
    })
  }

  const derrotas = maiorSequencia(linhas, 'derrota')
  if (derrotas && derrotas.quantidade >= 3) {
    const { linha, quantidade } = derrotas
    noticias.push({
      tipo: 'alerta',
      texto: `${linha.time.nomeCurto} perde a ${quantidade}ª seguida e está em ${linha.posicao}º lugar`,
      link: `/times/${linha.time.id}`,
    })
  }

  const [primeiro, segundo] = artilharia ?? []
  if (primeiro && primeiro.gols > 0) {
    const vantagem = segundo ? primeiro.gols - segundo.gols : primeiro.gols
    const time = times?.get(primeiro.timeId)
    const texto =
      vantagem > 0
        ? `${primeiro.nome} chega a ${primeiro.gols} gols e abre ${vantagem} de vantagem`
        : `${primeiro.nome}${time ? `, do ${time.nomeCurto},` : ''} divide a artilharia com ${primeiro.gols} gols`
    noticias.push({ tipo: 'artilharia', texto, link: '/artilharia' })
  }

  const reiDaVirada = [...(tempos ?? [])].sort((a, b) => b.viradasAFavor - a.viradasAFavor)[0]
  if (reiDaVirada && reiDaVirada.viradasAFavor >= 2) {
    noticias.push({
      tipo: 'virada',
      texto: `${reiDaVirada.time.nomeCurto} é o time que mais vira no 2º tempo: ${reiDaVirada.viradasAFavor} jogos`,
      link: '/tempos',
    })
  }

  return noticias
}
