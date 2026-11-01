import { describe, expect, it } from 'vitest'
import type { Partida } from '../api/tipos'
import { calcularBolao, jogoFechado, palpitesMexidosEmJogosFechados, pontosDoPalpite, rodadaDeInicio } from './bolao'

const H = 3_600_000
const AGORA = Date.parse('2026-11-10T20:00:00Z')

function jogo(id: number, rodada: number, data: string, gols?: [number, number], status?: Partida['status']): Partida {
  return {
    id,
    rodada,
    data,
    status: status ?? (gols ? 'encerrada' : 'agendada'),
    mandanteId: 1,
    visitanteId: 2,
    golsMandante: gols?.[0] ?? null,
    golsVisitante: gols?.[1] ?? null,
    golsMandanteIntervalo: null,
    golsVisitanteIntervalo: null,
    temResultado: !!gols,
  }
}

describe('pontos do palpite', () => {
  const fim = jogo(1, 33, '2026-11-07T19:00:00Z', [2, 1])
  it('3 no placar exato, 1 no resultado, 0 no erro', () => {
    expect(pontosDoPalpite(fim, { mandante: 2, visitante: 1 })).toBe(3)
    expect(pontosDoPalpite(fim, { mandante: 3, visitante: 0 })).toBe(1)
    expect(pontosDoPalpite(fim, { mandante: 1, visitante: 1 })).toBe(0)
    expect(pontosDoPalpite(jogo(2, 33, '2026-11-07T19:00:00Z', [1, 1]), { mandante: 0, visitante: 0 })).toBe(1)
  })
  it('sem pontos se o jogo não terminou ou o palpite está incompleto', () => {
    expect(pontosDoPalpite(fim, undefined)).toBeNull()
    expect(pontosDoPalpite(fim, { mandante: 2, visitante: null })).toBeNull()
    expect(pontosDoPalpite(jogo(3, 33, '2026-11-07T19:00:00Z'), { mandante: 2, visitante: 1 })).toBeNull()
  })
})

describe('trava no horário do jogo', () => {
  it('fecha quando chega a hora, quando tem resultado ou foi cancelado', () => {
    expect(jogoFechado(jogo(1, 33, new Date(AGORA + H).toISOString()), AGORA)).toBe(false)
    expect(jogoFechado(jogo(1, 33, new Date(AGORA).toISOString()), AGORA)).toBe(true)
    expect(jogoFechado(jogo(1, 33, new Date(AGORA - H).toISOString()), AGORA)).toBe(true)
    expect(jogoFechado(jogo(1, 33, new Date(AGORA + H).toISOString(), undefined, 'cancelada'), AGORA)).toBe(true)
    expect(jogoFechado(jogo(1, 33, new Date(AGORA + H).toISOString(), undefined, 'emAndamento'), AGORA)).toBe(true)
  })
  it('adiado sem data nova continua aberto', () => {
    expect(jogoFechado(jogo(1, 33, new Date(AGORA - 48 * H).toISOString(), undefined, 'adiada'), AGORA)).toBe(false)
  })
  it('acusa palpite incluído, trocado ou apagado em jogo fechado, e deixa mexer nos abertos', () => {
    const partidas = [
      jogo(1, 33, new Date(AGORA - H).toISOString()),
      jogo(2, 33, new Date(AGORA - H).toISOString()),
      jogo(3, 33, new Date(AGORA - H).toISOString()),
      jogo(4, 33, new Date(AGORA + H).toISOString()),
    ]
    const antes = { 1: { mandante: 1, visitante: 0 }, 2: { mandante: 2, visitante: 2 } }
    expect(palpitesMexidosEmJogosFechados(partidas, antes, { ...antes, 4: { mandante: 3, visitante: 3 } }, AGORA)).toEqual([])
    expect(
      palpitesMexidosEmJogosFechados(partidas, antes, { 1: { mandante: 2, visitante: 0 }, 3: { mandante: 0, visitante: 0 } }, AGORA),
    ).toEqual([1, 2, 3])
  })
})

describe('rodada de início', () => {
  const partidas = [
    jogo(1, 31, '2026-11-01T19:00:00Z', [1, 0]),
    jogo(2, 31, '2026-11-01T21:00:00Z', [1, 0]),
    jogo(7, 21, '2026-08-01T19:00:00Z', [0, 0]),
    jogo(3, 21, '2026-11-05T22:00:00Z'), // atrasado de uma rodada antiga
    jogo(4, 32, '2026-11-04T22:00:00Z'),
    jogo(5, 32, '2026-11-05T22:00:00Z'),
    jogo(6, 33, '2026-11-08T19:00:00Z'),
  ]
  it('é a primeira rodada que começa inteira depois do início', () => {
    expect(rodadaDeInicio(partidas, 2026)).toBe(32)
  })
  it('temporada sem data de início conta desde a primeira rodada', () => {
    expect(rodadaDeInicio(partidas, 2027)).toBe(21)
  })
  it('null se nenhuma rodada sobrou', () => {
    expect(rodadaDeInicio(partidas.slice(0, 2), 2026)).toBeNull()
  })
})

describe('ranking do bolão', () => {
  // Rodada 33: dois jogos encerrados. Rodada 34: um encerrado e um por jogar.
  const partidas = [
    jogo(10, 32, '2026-11-04T22:00:00Z', [3, 3]), // antes do início: não conta
    jogo(11, 33, '2026-11-07T19:00:00Z', [2, 1]),
    jogo(12, 33, '2026-11-07T21:00:00Z', [0, 0]),
    jogo(13, 34, '2026-11-11T22:00:00Z', [1, 2]),
    jogo(14, 34, '2026-11-12T22:00:00Z'),
  ]
  const ana = { id: 1, palpites: { 10: { mandante: 3, visitante: 3 }, 11: { mandante: 2, visitante: 1 }, 12: { mandante: 1, visitante: 1 }, 13: { mandante: 0, visitante: 0 } } }
  const bia = { id: 2, palpites: { 11: { mandante: 1, visitante: 0 }, 12: { mandante: 0, visitante: 0 }, 13: { mandante: 0, visitante: 3 } } }
  const caio = { id: 3, palpites: { 11: { mandante: 1, visitante: 0 }, 12: { mandante: 2, visitante: 2 }, 13: { mandante: 1, visitante: 2 } } }
  const davi = { id: 4, palpites: {} }
  const bolao = calcularBolao(partidas, [ana, bia, caio, davi], 33)

  it('soma os pontos só a partir da rodada de início', () => {
    const porId = new Map(bolao.ranking.map((l) => [l.id, l]))
    expect(porId.get(1)).toMatchObject({ pontos: 4, exatos: 1, resultados: 1, porRodada: { 33: 4, 34: 0 } })
    expect(porId.get(2)).toMatchObject({ pontos: 5, exatos: 1, resultados: 2, porRodada: { 33: 4, 34: 1 } })
    expect(porId.get(3)).toMatchObject({ pontos: 5, exatos: 1, resultados: 2, porRodada: { 33: 2, 34: 3 } })
    expect(bolao.jogosContados).toBe(3)
    expect(bolao.rodadas).toEqual([33, 34])
  })

  it('ordena com desempate e divide a posição de quem empata em tudo', () => {
    expect(bolao.ranking.map((l) => [l.id, l.posicao])).toEqual([
      [2, 1],
      [3, 1],
      [1, 3],
      [4, 4],
    ])
  })

  it('coroa o rei só nas rodadas encerradas, dividindo em caso de empate', () => {
    expect([...bolao.reis]).toEqual([[33, [1, 2]]])
    expect(bolao.ultimaEncerrada).toBe(33)
    expect(bolao.ranking.find((l) => l.id === 1)?.coroas).toBe(1)
    expect(bolao.ranking.find((l) => l.id === 3)?.coroas).toBe(0)
  })

  it('sem rodada de início, ninguém pontua', () => {
    const vazio = calcularBolao(partidas, [ana], null)
    expect(vazio.ranking[0]).toMatchObject({ pontos: 0, posicao: 1 })
    expect(vazio.rodadas).toEqual([])
  })
})
