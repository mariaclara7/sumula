import { describe, expect, it } from 'vitest'
import type { LinhaClassificacao, Time } from '../api/tipos'
import { codificarPalpites, decodificarPalpites, resumoDaSimulacao } from './compartilhar'
import type { PalpitesUsuario } from './simulador'

describe('compartilhar a simulação', () => {
  it('ida e volta com ids seguidos, saltos e placares até 20', () => {
    const palpites: PalpitesUsuario = {
      50001: { mandante: 2, visitante: 1 },
      50002: { mandante: 0, visitante: 0 },
      50003: { mandante: 20, visitante: 3 },
      50150: { mandante: 1, visitante: 11 },
    }
    const codigo = codificarPalpites(palpites)!

    expect(codigo.startsWith('1.')).toBe(true)
    expect(decodificarPalpites(codigo)).toEqual(palpites)
  })

  it('ignora palpites incompletos e devolve null sem nenhum completo', () => {
    expect(codificarPalpites({ 10: { mandante: 1, visitante: null } })).toBeNull()
    expect(decodificarPalpites(codificarPalpites({ 10: { mandante: 1, visitante: null }, 11: { mandante: 3, visitante: 2 } })))
      .toEqual({ 11: { mandante: 3, visitante: 2 } })
  })

  it('fica curto: 120 jogos seguidos cabem em pouco mais de 240 caracteres', () => {
    const palpites: PalpitesUsuario = {}
    for (let i = 0; i < 120; i++) palpites[50261 + i] = { mandante: i % 4, visitante: i % 3 }
    expect(codificarPalpites(palpites)!.length).toBeLessThan(260)
  })

  it('recusa links quebrados ou de outra versão', () => {
    for (const ruim of ['', '2.abc-12', '1.', '1.-12', '1.abc-1', '1.abc-~0~12', '1.abc-zz', '1.abc-~5']) {
      expect(decodificarPalpites(ruim)).toBeNull()
    }
    expect(decodificarPalpites(null)).toBeNull()
  })

  it('monta o texto com o campeão e os rebaixados', () => {
    const linha = (nome: string, posicao: number): LinhaClassificacao => ({
      posicao,
      time: { id: posicao, nome, nomeCurto: nome, sigla: nome.slice(0, 3), escudo: null } satisfies Time,
      pontos: 0,
      jogos: 0,
      vitorias: 0,
      empates: 0,
      derrotas: 0,
      golsPro: 0,
      golsContra: 0,
      saldo: 0,
      aproveitamento: 0,
      ultimosResultados: [],
    })
    const tabela = ['Bahia', 'Vasco', 'Santos', 'Sport'].map((nome, i) => linha(nome, i + 1))
    expect(resumoDaSimulacao(tabela, 2)).toBe(
      'Minha simulação do Brasileirão: campeão Bahia; caem Santos e Sport. Faça a sua:',
    )
  })
})
