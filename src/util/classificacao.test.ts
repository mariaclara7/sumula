import { describe, expect, it } from 'vitest'
import type { Time } from '../api/tipos'
import { calcularClassificacao, type JogoComPlacar } from './classificacao'

const time = (id: number, nome: string): Time => ({ id, nome, nomeCurto: nome, sigla: nome.slice(0, 3), escudo: null })
const flamengo = time(1, 'Flamengo')
const palmeiras = time(2, 'Palmeiras')
const botafogo = time(3, 'Botafogo')
const corinthians = time(4, 'Corinthians')
const times = [flamengo, palmeiras, botafogo, corinthians]

let dia = 1
const jogo = (mandanteId: number, golsMandante: number, visitanteId: number, golsVisitante: number): JogoComPlacar => ({
  mandanteId,
  visitanteId,
  golsMandante,
  golsVisitante,
  data: `2026-04-${String(dia++).padStart(2, '0')}`,
})

const linhaDe = (id: number, jogos: JogoComPlacar[]) => calcularClassificacao(times, jogos).find((l) => l.time.id === id)!

describe('calcularClassificacao', () => {
  it('soma pontos, gols, saldo e aproveitamento', () => {
    const jogos = [jogo(1, 2, 2, 0), jogo(3, 1, 4, 1), jogo(2, 3, 3, 1)]

    const palmeiras = linhaDe(2, jogos)
    expect([palmeiras.pontos, palmeiras.jogos, palmeiras.golsPro, palmeiras.golsContra, palmeiras.saldo]).toEqual([
      3, 2, 3, 3, 0,
    ])
    expect(palmeiras.aproveitamento).toBe(50)
  })

  it('inclui times sem jogos e numera as posições', () => {
    const tabela = calcularClassificacao(times, [])
    expect(tabela.map((l) => l.posicao)).toEqual([1, 2, 3, 4])
    expect(tabela.every((l) => l.jogos === 0)).toBe(true)
  })

  it('desempata por vitórias antes do saldo', () => {
    // Flamengo: 1V 2D = 3 pts, saldo -1. Palmeiras: 3E = 3 pts, saldo 0. Vitórias decidem.
    const jogos = [
      jogo(1, 1, 3, 0),
      jogo(1, 0, 4, 1),
      jogo(1, 0, 3, 1),
      jogo(2, 0, 4, 0),
      jogo(2, 1, 3, 1),
      jogo(2, 2, 4, 2),
    ]
    expect(linhaDe(1, jogos).posicao).toBeLessThan(linhaDe(2, jogos).posicao)
  })

  it('com tudo igual entre dois times, vale o confronto direto', () => {
    const jogos = [jogo(3, 1, 2, 0), jogo(2, 1, 1, 0), jogo(3, 0, 4, 1)]
    const botafogo = linhaDe(3, jogos)
    const palmeirasLinha = linhaDe(2, jogos)

    expect([botafogo.pontos, botafogo.vitorias, botafogo.saldo, botafogo.golsPro]).toEqual([
      palmeirasLinha.pontos,
      palmeirasLinha.vitorias,
      palmeirasLinha.saldo,
      palmeirasLinha.golsPro,
    ])
    expect(botafogo.posicao).toBeLessThan(palmeirasLinha.posicao)
  })

  it('guarda os cinco últimos resultados em ordem de data', () => {
    const jogos = [
      jogo(1, 0, 2, 1),
      jogo(1, 1, 3, 0),
      jogo(1, 1, 4, 1),
      jogo(1, 2, 2, 0),
      jogo(3, 2, 1, 0),
      jogo(4, 0, 1, 1),
    ]
    expect(linhaDe(1, [...jogos].reverse()).ultimosResultados).toEqual([
      'vitoria',
      'empate',
      'vitoria',
      'derrota',
      'vitoria',
    ])
  })
})
