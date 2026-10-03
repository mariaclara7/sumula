import { describe, expect, it } from 'vitest'
import type { Artilheiro, EstatisticasTime, LinhaClassificacao, ProbabilidadesTime, TipoSequencia } from '../api/tipos'
import { gerarDestaques, sobrenome } from './destaques'

const time = (id: number, nome: string) => ({ id, nome, nomeCurto: nome, sigla: nome.slice(0, 3).toUpperCase(), escudo: null })

const linhas = Array.from({ length: 20 }, (_, i) =>
  ({
    posicao: i + 1,
    time: time(i + 1, `Time ${i + 1}`),
    pontos: 60 - i * 3,
    jogos: 28,
    vitorias: 18 - i,
    derrotas: i,
    golsPro: 50 - i,
    golsContra: 20 + i,
    saldo: 30 - 2 * i,
    aproveitamento: 70 - i * 2,
  }) as LinhaClassificacao,
)

const estatistica = (id: number, atuais: Partial<Record<TipoSequencia, number>>) =>
  ({
    time: time(id, `Time ${id}`),
    sequencias: Object.entries(atuais).map(([tipo, atual]) => ({ tipo, atual, maior: atual })),
  }) as EstatisticasTime

describe('gerarDestaques', () => {
  it('monta líder, vice, 3º e lanterna com os números da tabela', () => {
    const cards = gerarDestaques({ linhas })
    expect(cards.map((c) => c.chave)).toEqual(['lider', 'vice', 'terceiro', 'lanterna'])
    expect(cards[0].numeros.map((n) => n.valor)).toEqual([50, 20, '+3'])
    expect(cards[1].numeros.at(-1)).toEqual({ valor: '-3', rotulo: 'do líder' })
    // Lanterna (3 pts) contra o 16º (15 pts).
    expect(cards[3].numeros.at(-1)).toEqual({ valor: '-12', rotulo: 'da salvação' })
    expect(cards[0].anel).toBeNull()
  })

  it('só mostra "em chamas" e "em choque" com 3 ou mais seguidas', () => {
    const fracos = gerarDestaques({ linhas, estatisticas: [estatistica(8, { vitorias: 2 }), estatistica(14, { derrotas: 2 })] })
    expect(fracos.map((c) => c.chave)).not.toContain('chamas')
    expect(fracos.map((c) => c.chave)).not.toContain('choque')

    const cards = gerarDestaques({ linhas, estatisticas: [estatistica(8, { vitorias: 4 }), estatistica(14, { derrotas: 5 })] })
    const chamas = cards.find((c) => c.chave === 'chamas')!
    const choque = cards.find((c) => c.chave === 'choque')!
    expect([chamas.time.id, chamas.grande, chamas.unidade, chamas.efeito]).toEqual([8, 4, 'vitórias seguidas', 'fogo'])
    expect([choque.time.id, choque.grande, choque.efeito]).toEqual([14, 5, 'choque'])
    expect(choque.numeros.at(-1)).toEqual({ valor: 0, rotulo: 'pts nos últimos 5' })
  })

  it('não repete time: se o líder tem a maior sequência, "em chamas" vai para o próximo', () => {
    const estatisticas = [
      estatistica(1, { vitorias: 6 }),
      estatistica(9, { vitorias: 4 }),
      estatistica(20, { derrotas: 7 }),
      estatistica(15, { derrotas: 3 }),
    ]
    const cards = gerarDestaques({ linhas, estatisticas })
    expect(cards.find((c) => c.chave === 'chamas')?.time.id).toBe(9)
    expect(cards.find((c) => c.chave === 'choque')?.time.id).toBe(15)
    expect(new Set(cards.map((c) => c.time.id)).size).toBe(cards.length)

    // Só o líder em sequência: não há card "em chamas".
    const soLider = gerarDestaques({ linhas, estatisticas: [estatistica(1, { vitorias: 6 })] })
    expect(soLider.map((c) => c.chave)).not.toContain('chamas')
  })

  it('usa a chance certa no anel de cada card', () => {
    const posicoes = (de: number) => Array.from({ length: 20 }, (_, i) => (i === de - 1 ? 1 : 0))
    const probabilidades = linhas.map((l) => ({ time: l.time, posicoes: posicoes(l.posicao) }) as ProbabilidadesTime)
    const cards = gerarDestaques({ linhas, probabilidades })
    expect(cards.map((c) => [c.chave, c.rotuloAnel, c.anel])).toEqual([
      ['lider', 'título', 1],
      ['vice', 'título', 0],
      ['terceiro', 'Libertadores', 1],
      ['lanterna', 'rebaixamento', 1],
    ])
  })

  it('mostra o artilheiro do 3º colocado pelo sobrenome', () => {
    const artilharia = [{ nome: 'Kevin Viveros', timeId: 3, gols: 18 } as Artilheiro]
    expect(gerarDestaques({ linhas, artilharia })[2].numeros[0]).toEqual({ valor: 18, rotulo: 'gols de Viveros' })
    expect(sobrenome('Pedro')).toBe('Pedro')
  })
})
