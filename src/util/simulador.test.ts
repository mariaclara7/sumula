import { describe, expect, it } from 'vitest'
import type { Palpite, Partida } from '../api/tipos'
import {
  jogosDaSimulacao,
  lerGols,
  lerPalpitesSalvos,
  preencherComPalpitesDaSumula,
  rodadaInicial,
} from './simulador'

const partida = (id: number, rodada: number, gols?: [number, number], status?: Partida['status']): Partida => ({
  id,
  rodada,
  data: `2026-04-${String(id).padStart(2, '0')}T19:00:00Z`,
  status: status ?? (gols ? 'encerrada' : 'agendada'),
  mandanteId: 1,
  visitanteId: 2,
  golsMandante: gols?.[0] ?? null,
  golsVisitante: gols?.[1] ?? null,
  golsMandanteIntervalo: null,
  golsVisitanteIntervalo: null,
  temResultado: gols !== undefined,
})

describe('simulador', () => {
  it('lê só números de 0 a 20', () => {
    expect([lerGols('3'), lerGols(''), lerGols('a'), lerGols('99'), lerGols('0')]).toEqual([3, null, null, 20, 0])
  })

  it('usa o resultado real e ignora palpite em jogo já disputado', () => {
    const jogos = jogosDaSimulacao([partida(1, 1, [2, 0])], { 1: { mandante: 0, visitante: 5 } })
    expect(jogos.map((j) => [j.golsMandante, j.golsVisitante])).toEqual([[2, 0]])
  })

  it('só conta palpite com os dois lados preenchidos e nunca jogo cancelado', () => {
    const partidas = [partida(1, 2), partida(2, 2), partida(3, 2, undefined, 'cancelada')]
    const jogos = jogosDaSimulacao(partidas, {
      1: { mandante: 1, visitante: 1 },
      2: { mandante: 2, visitante: null },
      3: { mandante: 1, visitante: 0 },
    })
    expect(jogos).toHaveLength(1)
  })

  it('preenche com a Súmula só o que está vazio', () => {
    const sugestao = (id: number): Palpite => ({
      partidaId: id,
      golsEsperadosMandante: 1,
      golsEsperadosVisitante: 1,
      vitoriaMandante: 0.4,
      empate: 0.3,
      vitoriaVisitante: 0.3,
      placarMaisProvavel: { mandante: 1, visitante: 0 },
    })
    const resultado = preencherComPalpitesDaSumula(
      [partida(1, 2), partida(2, 2)],
      { 1: { mandante: 3, visitante: 3 } },
      new Map([
        [1, sugestao(1)],
        [2, sugestao(2)],
      ]),
    )
    expect(resultado).toEqual({ 1: { mandante: 3, visitante: 3 }, 2: { mandante: 1, visitante: 0 } })
  })

  it('abre na primeira rodada com jogo pendente, inclusive adiado', () => {
    expect(rodadaInicial([partida(1, 1, [1, 0]), partida(2, 5, undefined, 'adiada'), partida(3, 9)])).toBe(5)
    expect(rodadaInicial([partida(1, 1, [1, 0]), partida(2, 2, [0, 0])])).toBe(2)
  })

  it('abre na rodada atual, sem voltar para um jogo atrasado de rodada antiga', () => {
    const jogos = [
      // rodada 21: um jogo atrasado
      partida(1, 21, [1, 0]),
      partida(2, 21),
      // rodada 22 inteira disputada
      partida(3, 22, [2, 2]),
      partida(4, 22, [0, 1]),
      // rodada 23: um jogo já foi, o outro é na segunda
      partida(5, 23, [3, 1]),
      partida(6, 23),
      // rodada 24 ainda não começou (um jogo antecipado não conta)
      partida(7, 24, [1, 1]),
      partida(8, 24),
      partida(9, 24),
    ]
    expect(rodadaInicial(jogos)).toBe(23)
    // Terminada a 23, a atual passa a ser a 24, e o jogo atrasado da 21 continua sem puxar para trás.
    expect(rodadaInicial(jogos.map((p) => (p.id === 6 ? partida(6, 23, [0, 0]) : p)))).toBe(24)
  })

  it('descarta palpites salvos com formato inválido', () => {
    const salvo = JSON.stringify({ 1: { mandante: 2, visitante: null }, 2: { mandante: 'x' }, 3: 'lixo', 4: { mandante: 50, visitante: 1 } })
    expect(lerPalpitesSalvos(salvo)).toEqual({ 1: { mandante: 2, visitante: null } })
    expect(lerPalpitesSalvos('{quebrado')).toEqual({})
  })
})
