import { describe, expect, it } from 'vitest'
import type { Artilheiro, LinhaClassificacao } from '../api/tipos'
import { atributosDoJogador, faixaDaNota, mediaDeGols, notaDeAtaque, notaDeDefesa, notaDoJogador, notaDoTime } from './notas'

const linha = (golsPro: number, golsContra: number, jogos = 10): LinhaClassificacao => ({
  posicao: 1,
  time: { id: 1, nome: 'Time', nomeCurto: 'Time', sigla: 'TIM', escudo: null },
  pontos: 0,
  jogos,
  vitorias: 0,
  empates: 0,
  derrotas: 0,
  golsPro,
  golsContra,
  saldo: golsPro - golsContra,
  aproveitamento: 0,
  ultimosResultados: [],
})

const artilheiro = (dados: Partial<Artilheiro>): Artilheiro => ({
  jogadorId: 1,
  nome: 'Jogador',
  timeId: 1,
  jogos: 20,
  gols: 10,
  assistencias: 2,
  penaltis: 0,
  ...dados,
})

describe('notaDoTime', () => {
  it('vai de 50 (0%) a 99 (100%)', () => {
    expect([0, 71.4, 100].map(notaDoTime)).toEqual([50, 91, 99])
  })
})

describe('faixaDaNota', () => {
  it('separa ouro, prata e bronze em 85 e 75', () => {
    expect([85, 84, 75, 74].map((n) => faixaDaNota(n).nome)).toEqual(['OURO', 'PRATA', 'PRATA', 'BRONZE'])
  })
})

describe('ataque e defesa', () => {
  const liga = [linha(20, 10), linha(10, 20)]

  it('valem 78 quando o time está na média da liga', () => {
    expect(mediaDeGols(liga)).toBe(1.5)
    expect(notaDeAtaque(linha(15, 15), 1.5)).toBe(78)
    expect(notaDeDefesa(linha(15, 15), 1.5)).toBe(78)
  })

  it('ficam entre 40 e 99 e não quebram sem jogos', () => {
    expect(notaDeAtaque(linha(100, 0), 1.5)).toBe(99)
    expect(notaDeDefesa(linha(0, 0), 1.5)).toBe(99)
    expect(notaDeAtaque(linha(0, 0, 0), 1.5)).toBe(50)
  })
})

describe('jogador', () => {
  it('usa gols por jogo quando há o número de jogos', () => {
    expect(notaDoJogador(artilheiro({ gols: 18, jogos: 26 }))).toBe(91)
    expect(notaDoJogador(artilheiro({ gols: 10, jogos: null }))).toBe(75)
  })

  it('deixa sem nota o atributo que depende de dado ausente', () => {
    const atributos = atributosDoJogador(artilheiro({ jogos: null, assistencias: null }))
    expect(atributos.map((a) => a.nota)).toEqual([null, null, 40, null])
  })
})
