import { describe, expect, it } from 'vitest'
import { chanceNaFaixa } from './config'

describe('chanceNaFaixa', () => {
  it('soma as posições da faixa, que são inclusivas e começam em 1', () => {
    const posicoes = [0.5, 0.25, 0.125, 0.125]
    expect(chanceNaFaixa(posicoes, { de: 1, ate: 1 })).toBe(0.5)
    expect(chanceNaFaixa(posicoes, { de: 2, ate: 4 })).toBe(0.5)
  })
})
