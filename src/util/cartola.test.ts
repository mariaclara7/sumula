import { describe, expect, it } from 'vitest'
import type { Palpite, Partida } from '../api/tipos'
import {
  chanceDeDoisOuMais,
  chanceDeMarcar,
  chanceSemSofrer,
  faixaDaChance,
  jogosAbertos,
  linhasDaRodada,
  rodadaDoCartola,
  rodadasComJogosAbertos,
} from './cartola'

const AGORA = Date.parse('2026-11-05T12:00:00Z')

function jogo(id: number, rodada: number, data: string, mandanteId = 1, visitanteId = 2, temResultado = false): Partida {
  return {
    id,
    rodada,
    data,
    status: temResultado ? 'encerrada' : 'agendada',
    mandanteId,
    visitanteId,
    golsMandante: temResultado ? 1 : null,
    golsVisitante: temResultado ? 0 : null,
    golsMandanteIntervalo: null,
    golsVisitanteIntervalo: null,
    temResultado,
  }
}
const previsao = (partidaId: number, m: number, v: number): Palpite => ({
  partidaId,
  golsEsperadosMandante: m,
  golsEsperadosVisitante: v,
  vitoriaMandante: 0.5,
  empate: 0.25,
  vitoriaVisitante: 0.25,
  placarMaisProvavel: { mandante: 1, visitante: 0 },
})

describe('chances do Cartola (Poisson)', () => {
  it('SG é a chance de o adversário não marcar', () => {
    expect(chanceSemSofrer(0.65)).toBeCloseTo(0.522, 3)
    expect(chanceSemSofrer(0)).toBe(1)
  })
  it('marcar 1 ou mais e 2 ou mais', () => {
    expect(chanceDeMarcar(1)).toBeCloseTo(0.632, 3)
    expect(chanceDeDoisOuMais(1)).toBeCloseTo(0.264, 3)
  })
  it('faixas', () => {
    expect(faixaDaChance(0.52, 'defesa')).toBe('otima')
    expect(faixaDaChance(0.3, 'defesa')).toBe('boa')
    expect(faixaDaChance(0.29, 'defesa')).toBe('fraca')
    expect(faixaDaChance(0.8, 'ataque')).toBe('otima')
    expect(faixaDaChance(0.7, 'ataque')).toBe('boa')
  })
})

describe('rodada e jogos', () => {
  const partidas = [
    jogo(1, 20, '2026-11-06T22:00:00Z', 5, 6), // atrasado de rodada antiga
    jogo(2, 20, '2026-08-01T22:00:00Z', 7, 8, true),
    jogo(3, 20, '2026-08-01T22:00:00Z', 9, 10, true),
    jogo(4, 32, '2026-11-04T22:00:00Z', 1, 2, true),
    jogo(5, 32, '2026-11-05T10:00:00Z', 3, 4), // já começou, sem resultado
    jogo(6, 33, '2026-11-08T19:00:00Z', 1, 3),
    jogo(7, 33, '2026-11-08T21:00:00Z', 2, 4),
  ]
  const palpites = new Map([previsao(1, 1, 1), previsao(5, 1, 1), previsao(6, 2.05, 0.65), previsao(7, 1.2, 1.1)].map((p) => [p.partidaId, p]))

  it('abre na primeira rodada com pelo menos metade dos jogos por começar', () => {
    expect(rodadaDoCartola(partidas, palpites, AGORA)).toBe(33)
    expect(rodadasComJogosAbertos(partidas, palpites, AGORA)).toEqual([20, 33])
  })

  it('duas linhas por jogo aberto, com as chances de cada lado', () => {
    const linhas = linhasDaRodada(jogosAbertos(partidas, palpites, 33, AGORA), palpites)
    expect(linhas).toHaveLength(4)
    const casa = linhas[0]
    expect(casa).toMatchObject({ timeId: 1, adversarioId: 3, emCasa: true, golsPro: 2.05, golsContra: 0.65 })
    expect(casa.sg).toBeCloseTo(Math.exp(-0.65))
    expect(linhas[1]).toMatchObject({ timeId: 3, emCasa: false })
    expect(linhas[1].sg).toBeCloseTo(Math.exp(-2.05))
  })

  it('jogo que já começou fica de fora', () => {
    expect(jogosAbertos(partidas, palpites, 32, AGORA)).toEqual([])
  })
})
