import { describe, expect, it } from 'vitest'
import type { Partida } from '../api/tipos'
import { formatarDataPartida, formatarSaldo, resultadoPara } from './formato'

const partida = (golsMandante: number | null, golsVisitante: number | null): Partida => ({
  id: 1,
  rodada: 1,
  data: '2026-04-05T19:00:00Z',
  status: golsMandante === null ? 'agendada' : 'encerrada',
  mandanteId: 10,
  visitanteId: 20,
  golsMandante,
  golsVisitante,
  temResultado: golsMandante !== null,
})

describe('resultadoPara', () => {
  it('considera o ponto de vista do time', () => {
    expect(resultadoPara(partida(2, 1), 10)).toBe('vitoria')
    expect(resultadoPara(partida(2, 1), 20)).toBe('derrota')
    expect(resultadoPara(partida(1, 1), 20)).toBe('empate')
  })

  it('retorna undefined para jogo sem resultado', () => {
    expect(resultadoPara(partida(null, null), 10)).toBeUndefined()
  })
})

describe('formatarSaldo', () => {
  it('coloca sinal só em saldo positivo', () => {
    expect([formatarSaldo(5), formatarSaldo(0), formatarSaldo(-3)]).toEqual(['+5', '0', '-3'])
  })
})

describe('formatarDataPartida', () => {
  it('usa o horário de Brasília', () => {
    expect(formatarDataPartida('2026-04-05T19:00:00Z')).toContain('16:00')
  })
})
