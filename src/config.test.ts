import { describe, expect, it } from 'vitest'
import { chanceNaFaixa } from './config'
import { formatarChance } from './util/formato'

describe('chanceNaFaixa', () => {
  it('soma as posições da faixa, que são inclusivas e começam em 1', () => {
    const posicoes = [0.5, 0.25, 0.125, 0.125]
    expect(chanceNaFaixa(posicoes, { de: 1, ate: 1 })).toBe(0.5)
    expect(chanceNaFaixa(posicoes, { de: 2, ate: 4 })).toBe(0.5)
  })

  it('quem ficou na faixa em todas as simulações tem exatamente 100% (sem o erro de soma de frações)', () => {
    // 0.6 + 0.3 + 0.1 em ponto flutuante dá 0.9999999999999999, que viraria "mais de 99%" na tela.
    expect(chanceNaFaixa([0.6, 0.3, 0.1, 0, 0], { de: 1, ate: 4 })).toBe(1)
    expect(chanceNaFaixa([0.5732, 0.3101, 0.0952, 0.0215, 0], { de: 1, ate: 4 })).toBe(1)
    expect(formatarChance(chanceNaFaixa([0.6, 0.3, 0.1, 0, 0], { de: 1, ate: 4 }))).toBe('100%')
    // E quem saiu da faixa em 3 das 10.000 simulações continua "mais de 99%".
    expect(formatarChance(chanceNaFaixa([0.6, 0.3, 0.0997, 0, 0.0003], { de: 1, ate: 4 }))).toBe('mais de 99%')
  })
})
