import { describe, expect, it } from 'vitest'
import { formatarCodigo, iniciais, lerCodigo } from './salas'

describe('código da sala', () => {
  it('entende o código digitado de vários jeitos', () => {
    expect(lerCodigo('k7p-2qx')).toBe('K7P2QX')
    expect(lerCodigo(' K7P 2QX ')).toBe('K7P2QX')
    expect(lerCodigo('https://brasumula.com.br/sala/K7P-2QX')).toBe('K7P2QX')
    expect(lerCodigo('brasumula.com.br/sala/K7P-2QX#chave=abc')).toBe('K7P2QX')
  })

  it('recusa o que não pode ser um código', () => {
    expect(lerCodigo('abc')).toBeNull()
    expect(lerCodigo('K0P2QX')).toBeNull() // sem 0, O, 1 e I
    expect(lerCodigo('K7P2QXX')).toBeNull()
  })

  it('mostra com traço no meio', () => {
    expect(formatarCodigo('K7P2QX')).toBe('K7P-2QX')
  })
})

describe('iniciais', () => {
  it('pega a primeira e a última palavra, ou as duas primeiras letras', () => {
    expect(iniciais('Maria Clara')).toBe('MC')
    expect(iniciais('Ana Maria da Silva')).toBe('AS')
    expect(iniciais('lucas')).toBe('LU')
    expect(iniciais('É')).toBe('É')
  })
})
