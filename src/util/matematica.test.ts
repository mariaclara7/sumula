import { describe, expect, it } from 'vitest'
import type { SituacaoMatematica } from '../api/tipos'
import { metas, selosMatematicos } from './matematica'

const situacao = (parcial: Partial<SituacaoMatematica>): SituacaoMatematica => ({
  time: { id: 1, nome: 'Bahia', nomeCurto: 'Bahia', sigla: 'BAH', escudo: null },
  posicao: 1,
  pontos: 50,
  jogosRestantes: 5,
  pontosMaximos: 65,
  melhorPosicaoPossivel: 1,
  piorPosicaoPossivel: 20,
  pontosParaGarantir: Array(20).fill(0),
  ...parcial,
})

describe('selosMatematicos', () => {
  it('campeão quando não pode terminar abaixo do 1º', () => {
    expect(selosMatematicos(situacao({ piorPosicaoPossivel: 1 }))).toEqual([{ texto: 'Campeão', tom: 'bom' }])
  })

  it('rebaixado quando não consegue sair da zona', () => {
    expect(selosMatematicos(situacao({ melhorPosicaoPossivel: 17 }))[0].texto).toBe('Rebaixado')
  })

  it('garantido na Libertadores e sem chance de título ao mesmo tempo', () => {
    const selos = selosMatematicos(situacao({ melhorPosicaoPossivel: 2, piorPosicaoPossivel: 4 })).map((s) => s.texto)
    expect(selos).toEqual(['Garantido na Libertadores', 'Sem chance de título'])
  })

  it('nada decidido com o campeonato em aberto', () => {
    expect(selosMatematicos(situacao({}))).toEqual([])
  })
})

describe('metas', () => {
  it('calcula quanto falta e se depende só do time', () => {
    const pontosParaGarantir = Array(20).fill(0)
    pontosParaGarantir[0] = 70 // título
    pontosParaGarantir[3] = 60 // G4
    pontosParaGarantir[15] = 45 // fora do Z4

    const [titulo, liberta, fuga] = metas(situacao({ pontosParaGarantir, melhorPosicaoPossivel: 1 }))

    expect(titulo).toMatchObject({ pontos: 70, faltam: 20, dependeSoDele: false, impossivel: false })
    expect(liberta).toMatchObject({ pontos: 60, faltam: 10, dependeSoDele: true })
    expect(fuga).toMatchObject({ pontos: 45, faltam: 0, dependeSoDele: true })
  })
})
