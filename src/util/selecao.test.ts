import { describe, expect, it } from 'vitest'
import { alternar, escreverSelecao, lerSelecao } from './selecao'

describe('seleção de times', () => {
  it('lê e escreve mantendo as vagas', () => {
    const selecao = lerSelecao('12,,7')
    expect(selecao).toEqual([12, null, 7, null, null])
    expect(escreverSelecao(selecao)).toBe('12,,7')
  })

  it('ignora ids inválidos, repetidos e o que passa do máximo', () => {
    expect(lerSelecao('abc,5,5,-1,8,9,10', 5)).toEqual([null, 5, null, null, 8])
  })

  it('tirar um time não muda a vaga (e a cor) dos outros', () => {
    const selecao = alternar([1, 2, 3, null, null], 2)
    expect(selecao).toEqual([1, null, 3, null, null])
  })

  it('um time novo ocupa a primeira vaga livre', () => {
    expect(alternar([1, null, 3, null, null], 9)).toEqual([1, 9, 3, null, null])
  })

  it('não passa do máximo', () => {
    const cheia = [1, 2, 3, 4, 5]
    expect(alternar(cheia, 6)).toBe(cheia)
  })
})
