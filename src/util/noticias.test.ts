import { describe, expect, it } from 'vitest'
import type {
  Artilheiro,
  DesempenhoPorTempo,
  EstatisticasTime,
  LinhaClassificacao,
  Partida,
  ProbabilidadesTime,
  SituacaoMatematica,
  TipoSequencia,
} from '../api/tipos'
import { gerarNoticias, quandoSera, unicoMaior, type EntradaNoticias } from './noticias'

const time = (id: number, nome: string) => ({ id, nome, nomeCurto: nome, sigla: nome.slice(0, 3).toUpperCase(), escudo: null })

type Dados = Partial<Pick<LinhaClassificacao, 'pontos' | 'jogos' | 'golsPro' | 'golsContra' | 'aproveitamento'>>
const linha = (id: number, nome: string, posicao: number, dados: Dados = {}) =>
  ({ posicao, time: time(id, nome), pontos: 0, jogos: 10, golsPro: 10, golsContra: 10, aproveitamento: 50, ...dados }) as LinhaClassificacao

const estatistica = (id: number, nome: string, atuais: Partial<Record<TipoSequencia, number>>): EstatisticasTime => ({
  time: time(id, nome),
  gols: {} as EstatisticasTime['gols'],
  sequencias: Object.entries(atuais).map(([tipo, atual]) => ({ tipo: tipo as TipoSequencia, atual: atual!, maior: atual! })),
})

const artilheiro = (id: number, nome: string, gols: number, penaltis = 0): Artilheiro => ({
  jogadorId: id,
  nome,
  timeId: 1,
  jogos: 20,
  gols,
  assistencias: 0,
  penaltis,
})

// Tabela base: pontos e gols todos diferentes, sem empates, para cada teste mexer só no que interessa.
const tabela = () =>
  ['Flamengo', 'Palmeiras', 'Cruzeiro', 'Bahia', 'Botafogo', 'Santos'].map((nome, i) =>
    linha(i + 1, nome, i + 1, { pontos: 60 - i * 6, golsPro: 50 - i * 3, golsContra: 20 + i * 2 }),
  )

const textos = (entrada: EntradaNoticias) => gerarNoticias(entrada).map((n) => n.texto)
const ids = (entrada: EntradaNoticias) => gerarNoticias(entrada).map((n) => n.id)

describe('unicoMaior', () => {
  it('devolve o maior só quando não há empate', () => {
    expect(unicoMaior([3, 5, 1], (n) => n)).toBe(5)
    expect(unicoMaior([5, 5, 1], (n) => n)).toBeUndefined()
    expect(unicoMaior([], (n: number) => n)).toBeUndefined()
  })
})

describe('sequências', () => {
  it('usa a sequência da temporada inteira, não só os 5 últimos jogos', () => {
    const linhas = tabela()
    const estatisticas = [estatistica(1, 'Flamengo', { vitorias: 7, invencibilidade: 7 })]
    expect(textos({ linhas, estatisticas })).toContain('Flamengo vence o 7º jogo seguido e lidera o campeonato')
  })

  it('só noticia sequência de 3 ou mais', () => {
    const linhas = tabela()
    const estatisticas = [estatistica(2, 'Palmeiras', { vitorias: 2 }), estatistica(6, 'Santos', { derrotas: 2 })]
    expect(ids({ linhas, estatisticas }).filter((id) => id.startsWith('vitorias') || id.startsWith('derrotas'))).toEqual([])
  })

  it('não repete a invencibilidade quando ela é a mesma sequência de vitórias', () => {
    const linhas = tabela()
    const igual = [estatistica(2, 'Palmeiras', { vitorias: 8, invencibilidade: 8 })]
    expect(ids({ linhas, estatisticas: igual })).not.toContain('invicto-2')
    const maior = [estatistica(2, 'Palmeiras', { vitorias: 3, invencibilidade: 9 })]
    expect(textos({ linhas, estatisticas: maior })).toContain('Palmeiras está há 9 jogos sem perder e está em 2º lugar')
  })

  it('escreve a sequência de derrotas com a posição', () => {
    const linhas = tabela()
    const estatisticas = [estatistica(6, 'Santos', { derrotas: 4, semVencer: 4 })]
    expect(textos({ linhas, estatisticas })).toContain('Santos perde a 4ª seguida e está em 6º lugar')
  })
})

describe('artilharia', () => {
  it('diz a vantagem quando o artilheiro está sozinho', () => {
    expect(textos({ linhas: [], artilharia: [artilheiro(1, 'Kevin Viveros', 18), artilheiro(2, 'Pedro', 16)] })).toContain(
      'Kevin Viveros chega a 18 gols e abre 2 de vantagem na artilharia',
    )
  })

  it('diz que dividem quando há empate no topo', () => {
    expect(textos({ linhas: [], artilharia: [artilheiro(1, 'A', 9), artilheiro(2, 'B', 9), artilheiro(3, 'C', 4)] })).toContain(
      'A e B dividem a artilharia com 9 gols',
    )
    expect(textos({ linhas: [], artilharia: [artilheiro(1, 'A', 9), artilheiro(2, 'B', 9), artilheiro(3, 'C', 9)] })).toContain(
      '3 jogadores dividem a artilharia com 9 gols',
    )
  })

  it('só fala de pênaltis quando a lista garante que ninguém de fora tem mais', () => {
    const curta = [artilheiro(1, 'A', 9, 4), artilheiro(2, 'B', 7, 1)]
    expect(textos({ linhas: [], artilharia: curta })).toContain('A é quem mais marca de pênalti: 4 gols')
    // Lista cheia (100) em que o último tem 5 gols: alguém de fora pode ter 4 pênaltis também.
    const cheia = Array.from({ length: 100 }, (_, i) => artilheiro(i, `J${i}`, 30 - Math.floor(i / 4), i === 0 ? 4 : 0))
    expect(ids({ linhas: [], artilharia: cheia })).not.toContain('penaltis')
  })
})

describe('melhor e maior', () => {
  it('melhor defesa e melhor ataque só com um único dono', () => {
    const linhas = tabela()
    expect(textos({ linhas })).toContain('Flamengo tem a melhor defesa: 20 gols sofridos em 10 jogos')
    expect(textos({ linhas })).toContain('Flamengo tem o melhor ataque: 50 gols em 10 jogos')
    linhas[1].golsContra = 20
    linhas[1].golsPro = 50
    expect(ids({ linhas }).some((id) => id.startsWith('defesa') || id.startsWith('ataque'))).toBe(false)
  })

  it('rei da virada só sem empate e com 2 ou mais', () => {
    const tempos = (a: number, b: number) =>
      [
        { time: time(1, 'Flamengo'), viradasAFavor: a },
        { time: time(2, 'Palmeiras'), viradasAFavor: b },
      ] as DesempenhoPorTempo[]
    expect(textos({ linhas: [], tempos: tempos(4, 2) })).toContain('Flamengo é o time que mais vira no 2º tempo: 4 jogos')
    expect(ids({ linhas: [], tempos: tempos(3, 3) })).not.toContain('virada-1')
    expect(ids({ linhas: [], tempos: tempos(1, 0) })).not.toContain('virada-1')
  })

  it('melhor 2º turno só depois de 5 jogos', () => {
    const linhas = tabela()
    const returno = [linha(6, 'Santos', 1, { jogos: 6, aproveitamento: 77.8 }), linha(1, 'Flamengo', 2, { jogos: 6, aproveitamento: 60 })]
    expect(textos({ linhas, segundoTurno: returno })).toContain(
      'Santos tem o melhor 2º turno: 77,8% de aproveitamento (está em 6º na geral)',
    )
    returno.forEach((l) => (l.jogos = 4))
    expect(ids({ linhas, segundoTurno: returno })).not.toContain('returno-6')
  })

  it('líder no intervalo só quando é outro time', () => {
    const linhas = tabela()
    expect(textos({ linhas, intervalo: [linha(2, 'Palmeiras', 1)] })).toContain(
      'Se os jogos acabassem no intervalo, Palmeiras seria o líder',
    )
    expect(ids({ linhas, intervalo: [linha(1, 'Flamengo', 1)] })).not.toContain('intervalo')
  })
})

describe('vagas', () => {
  it('G-4 e Z-4 só quando a diferença é de até 3 pontos', () => {
    const linhas = Array.from({ length: 20 }, (_, i) => linha(i + 1, `T${i + 1}`, i + 1, { pontos: 80 - i * 4 }))
    expect(ids({ linhas })).not.toContain('g4')
    linhas[4].pontos = linhas[3].pontos - 2
    linhas[16].pontos = linhas[15].pontos
    const lista = textos({ linhas })
    expect(lista).toContain('T5 está a 2 pontos do G-4')
    expect(lista).toContain('T17 abre o Z-4 com os mesmos 20 pontos de T16')
  })
})

describe('simulação e matemática', () => {
  const prob = (id: number, nome: string, posicoes: number[]) =>
    ({ time: time(id, nome), posicoes }) as ProbabilidadesTime

  it('fala de chance sempre como simulação, e só a partir de 50%', () => {
    const chances = [prob(1, 'Flamengo', [0.75, 0.25]), prob(2, 'Palmeiras', [0.25, 0.75])]
    expect(textos({ linhas: [], probabilidades: chances })).toContain(
      'Flamengo tem 75% de chance de título nas simulações da BraSúmula',
    )
    const divididas = [prob(1, 'Flamengo', [0.5, 0.5]), prob(2, 'Palmeiras', [0.5, 0.5])]
    expect(ids({ linhas: [], probabilidades: divididas }).some((id) => id.startsWith('simulacao-titulo'))).toBe(false)
  })

  it('usa a conta conservadora para "garantido" e "rebaixado"', () => {
    const situacao = (id: number, nome: string, melhor: number, pior: number) =>
      ({ time: time(id, nome), melhorPosicaoPossivel: melhor, piorPosicaoPossivel: pior, jogosRestantes: 3 }) as SituacaoMatematica
    const lista = textos({ linhas: [], matematica: [situacao(1, 'Flamengo', 1, 3), situacao(20, 'Sport', 17, 20), situacao(9, 'Ceará', 6, 18)] })
    expect(lista).toContain('Flamengo já tem vaga garantida na Libertadores')
    expect(lista).toContain('Sport está matematicamente rebaixado')
    expect(lista.some((t) => t.startsWith('Ceará'))).toBe(false)
  })
})

describe('jogos recentes e agenda', () => {
  const agora = new Date('2026-10-05T12:00:00Z')
  const partida = (id: number, data: string, m: number, v: number, placar: [number, number] | null, intervalo?: [number, number]): Partida => ({
    id,
    rodada: 30,
    data,
    status: placar ? 'encerrada' : 'agendada',
    mandanteId: m,
    visitanteId: v,
    golsMandante: placar?.[0] ?? null,
    golsVisitante: placar?.[1] ?? null,
    golsMandanteIntervalo: intervalo?.[0] ?? null,
    golsVisitanteIntervalo: intervalo?.[1] ?? null,
    temResultado: placar !== null,
  })
  const linhas = tabela()

  it('goleada só de jogo encerrado nos últimos 7 dias, com 3 gols de diferença', () => {
    const recente = partida(1, '2026-10-04T19:00:00Z', 6, 2, [1, 4])
    expect(textos({ linhas, partidas: [recente], agora })).toContain('Palmeiras goleia Santos por 4 x 1 fora de casa')
    const antiga = partida(2, '2026-09-20T19:00:00Z', 1, 2, [5, 0])
    expect(ids({ linhas, partidas: [antiga], agora })).not.toContain('goleada-2')
    const apertada = partida(3, '2026-10-04T19:00:00Z', 1, 2, [3, 1])
    expect(ids({ linhas, partidas: [apertada], agora })).not.toContain('goleada-3')
  })

  it('virada: perdia no intervalo e venceu', () => {
    const virada = partida(4, '2026-10-03T21:30:00Z', 4, 3, [3, 2], [0, 2])
    expect(textos({ linhas, partidas: [virada], agora })).toContain('Bahia perdia por 0 x 2 no intervalo e venceu Cruzeiro por 3 x 2')
    const empateNoIntervalo = partida(5, '2026-10-03T21:30:00Z', 4, 3, [3, 2], [1, 1])
    expect(ids({ linhas, partidas: [empateNoIntervalo], agora })).not.toContain('virou-5')
  })

  it('agenda: o jogo dos mais bem colocados da próxima rodada, só se ainda não começou', () => {
    const jogos = [
      partida(10, '2026-10-08T22:30:00Z', 6, 1, null),
      partida(11, '2026-10-10T19:00:00Z', 2, 3, null),
      partida(12, '2026-10-04T19:00:00Z', 1, 2, null), // já passou da hora: ignorado
    ]
    expect(textos({ linhas, partidas: jogos, agora })).toContain('Palmeiras (2º) x Cruzeiro (3º) no sábado, 10/10, às 16h')
  })

  it('escreve dia e hora no horário de Brasília', () => {
    expect(quandoSera('2026-10-08T22:30:00Z')).toBe('na quinta, 08/10, às 19h30')
    expect(quandoSera('2026-10-11T19:00:00Z')).toBe('no domingo, 11/10, às 16h')
  })
})

describe('ordem', () => {
  it('mostra primeiro o que é mais forte e nunca repete a mesma notícia', () => {
    const linhas = tabela()
    const noticias = gerarNoticias({
      linhas,
      estatisticas: [estatistica(1, 'Flamengo', { vitorias: 6 })],
      artilharia: [artilheiro(1, 'A', 10), artilheiro(2, 'B', 8)],
    })
    expect(noticias[0].id).toBe('vitorias-1')
    expect(new Set(noticias.map((n) => n.id)).size).toBe(noticias.length)
  })
})
