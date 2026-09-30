import { describe, expect, it } from 'vitest'
import type { Artilheiro, DesempenhoPorTempo, LinhaClassificacao, Resultado } from '../api/tipos'
import { gerarNoticias, sequenciaAtual } from './noticias'

const V: Resultado = 'vitoria'
const E: Resultado = 'empate'
const D: Resultado = 'derrota'

const linha = (id: number, nome: string, posicao: number, ultimosResultados: Resultado[]) =>
  ({ posicao, time: { id, nome, nomeCurto: nome, sigla: nome.slice(0, 3), escudo: null }, ultimosResultados }) as LinhaClassificacao

const artilheiro = (nome: string, gols: number): Artilheiro => ({
  jogadorId: gols,
  nome,
  timeId: 1,
  jogos: 20,
  gols,
  assistencias: 0,
  penaltis: 0,
})

describe('sequenciaAtual', () => {
  it('conta só a sequência mais recente (o fim da lista)', () => {
    expect(sequenciaAtual([D, V, V, V], V)).toBe(3)
    expect(sequenciaAtual([V, V, E], V)).toBe(0)
    expect(sequenciaAtual([], V)).toBe(0)
  })
})

describe('gerarNoticias', () => {
  const linhas = [
    linha(1, 'Flamengo', 1, [V, V, V, V, V]),
    linha(2, 'Palmeiras', 2, [E, V, V, V, E]),
    linha(14, 'Corinthians', 14, [D, D, D, D, D]),
  ]

  it('escreve as manchetes a partir dos dados', () => {
    const noticias = gerarNoticias({
      linhas,
      artilharia: [artilheiro('Kevin Viveros', 18), artilheiro('Pedro', 16)],
      tempos: [{ time: linhas[1].time, viradasAFavor: 4 } as DesempenhoPorTempo],
    })

    expect(noticias.map((n) => [n.tipo, n.texto, n.link])).toEqual([
      ['embalado', 'Flamengo vence o 5º jogo seguido e segue na ponta', '/times/1'],
      ['alerta', 'Corinthians perde a 5ª seguida e está em 14º lugar', '/times/14'],
      ['artilharia', 'Kevin Viveros chega a 18 gols e abre 2 de vantagem', '/artilharia'],
      ['virada', 'Palmeiras é o time que mais vira no 2º tempo: 4 jogos', '/tempos'],
    ])
  })

  it('não inventa notícia quando não há o que dizer', () => {
    const calmas = [linha(1, 'A', 1, [V, E, V]), linha(2, 'B', 2, [D, E, D])]
    expect(gerarNoticias({ linhas: calmas, artilharia: [], tempos: [] })).toEqual([])
  })

  it('avisa quando a artilharia está dividida', () => {
    const [noticia] = gerarNoticias({ linhas: [], artilharia: [artilheiro('A', 9), artilheiro('B', 9)] })
    expect(noticia.texto).toBe('A divide a artilharia com 9 gols')
  })
})
