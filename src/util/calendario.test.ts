import { describe, expect, it } from 'vitest'
import type { Partida } from '../api/tipos'
import { diaDoJogo, diaRelativo, horaDoJogo, periodo, proximosJogos, resultados } from './calendario'

const jogo = (id: number, rodada: number, data: string, extra: Partial<Partida> = {}): Partida => ({
  id,
  rodada,
  data,
  status: 'agendada',
  mandanteId: 1,
  visitanteId: 2,
  golsMandante: null,
  golsVisitante: null,
  golsMandanteIntervalo: null,
  golsVisitanteIntervalo: null,
  temResultado: false,
  ...extra,
})
const encerrado = (id: number, rodada: number, data: string) =>
  jogo(id, rodada, data, { status: 'encerrada', temResultado: true, golsMandante: 1, golsVisitante: 0 })

describe('datas no horário de Brasília', () => {
  it('um jogo às 22h30 de Brasília é do mesmo dia, mesmo já sendo o dia seguinte em UTC', () => {
    expect(diaDoJogo('2026-10-18T01:30:00Z')).toBe('2026-10-17')
    expect(horaDoJogo('2026-10-18T01:30:00Z')).toBe('22:30')
  })

  it('diz hoje, amanhã e ontem', () => {
    const agora = new Date('2026-10-17T15:00:00Z')
    expect(diaRelativo('2026-10-17T23:00:00Z', agora)).toBe('Hoje')
    expect(diaRelativo('2026-10-18T19:00:00Z', agora)).toBe('Amanhã')
    expect(diaRelativo('2026-10-16T22:00:00Z', agora)).toBe('Ontem')
    expect(diaRelativo('2026-10-20T22:00:00Z', agora)).toBeNull()
  })

  it('escreve o período da rodada', () => {
    expect(periodo([jogo(1, 1, '2026-10-17T19:00:00Z'), jogo(2, 1, '2026-10-19T22:00:00Z')])).toBe('17 a 19/10')
    expect(periodo([jogo(1, 1, '2026-10-31T19:00:00Z'), jogo(2, 1, '2026-11-02T22:00:00Z')])).toBe('31/10 a 02/11')
    expect(periodo([jogo(1, 1, '2026-10-17T19:00:00Z')])).toBe('17/10')
  })
})

describe('próximos jogos', () => {
  const partidas = [
    // rodada 21: um jogo já foi, o outro foi remarcado para depois da rodada atual
    encerrado(1, 21, '2026-08-01T19:00:00Z'),
    jogo(2, 21, '2026-10-22T22:00:00Z'),
    // rodada 30 inteira disputada
    encerrado(3, 30, '2026-10-11T19:00:00Z'),
    encerrado(4, 30, '2026-10-12T19:00:00Z'),
    // rodada 31 (atual): um no sábado, dois no domingo (um adiado sem data nova)
    jogo(5, 31, '2026-10-18T19:00:00Z'),
    jogo(6, 31, '2026-10-17T21:00:00Z'),
    jogo(7, 31, '2026-10-18T22:00:00Z', { status: 'adiada' }),
    // rodada 32
    jogo(8, 32, '2026-10-25T19:00:00Z'),
  ]

  it('começa na rodada atual, separa por dia e manda o atrasado e o sem data para os seus blocos', () => {
    const c = proximosJogos(partidas)
    expect(c.rodadas.map((r) => r.rodada)).toEqual([31, 32])
    expect(c.rodadas[0].dias.map((d) => [d.dia, d.partidas.map((p) => p.id)])).toEqual([
      ['2026-10-17', [6]],
      ['2026-10-18', [5]],
    ])
    expect(c.atrasados.map((d) => d.partidas.map((p) => p.id))).toEqual([[2]])
    expect(c.semData.map((p) => p.id)).toEqual([7])
  })

  it('com um time escolhido, a rodada atual continua sendo a do campeonato', () => {
    const doTime = partidas.filter((p) => p.id === 8 || p.id === 2)
    const c = proximosJogos(doTime, partidas)
    expect(c.rodadas.map((r) => r.rodada)).toEqual([32])
    expect(c.atrasados.flatMap((d) => d.partidas.map((p) => p.id))).toEqual([2])
  })

  it('resultados: da rodada mais recente para a mais antiga', () => {
    const r = resultados(partidas)
    expect(r.map((g) => g.rodada)).toEqual([30, 21])
    expect(r[0].dias.map((d) => d.dia)).toEqual(['2026-10-12', '2026-10-11'])
  })
})
