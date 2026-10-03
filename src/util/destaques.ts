import type { Artilheiro, EstatisticasTime, LinhaClassificacao, ProbabilidadesTime, Time } from '../api/tipos'
import { ZONAS, chanceNaFaixa } from '../config'
import { formatarSaldo } from './formato'
import { ULTIMA_POSICAO_SEGURA } from './matematica'
import { emSequencia } from './noticias'
import { notaDoTime } from './notas'

export type CardDestaque = {
  chave: 'lider' | 'vice' | 'terceiro' | 'chamas' | 'choque' | 'lanterna'
  rotulo: string
  time: Time
  /** Número grande (pontos ou tamanho da sequência). */
  grande: number
  unidade: string
  /** 0 a 1, para o anel; null enquanto a simulação não carregou. */
  anel: number | null
  rotuloAnel: string
  /** Cor de destaque: lima (normal) ou vermelho (queda). */
  tom: 'lima' | 'vermelho'
  efeito?: 'fogo' | 'choque'
  numeros: { valor: number | string; rotulo: string }[]
}

type Entrada = {
  linhas: LinhaClassificacao[]
  estatisticas?: EstatisticasTime[]
  probabilidades?: ProbabilidadesTime[]
  artilharia?: Artilheiro[]
}

const zona = (nome: string) => ZONAS.find((z) => z.nome === nome)!

/**
 * Cards que se alternam no topo da classificação: líder, vice, 3º, quem está "em chamas" (3+ vitórias
 * seguidas), quem está "em choque" (3+ derrotas seguidas) e o lanterna. Os de sequência só aparecem quando
 * existe a sequência; todos os números saem da tabela, das sequências e da simulação.
 */
export function gerarDestaques({ linhas, estatisticas = [], probabilidades = [], artilharia = [] }: Entrada): CardDestaque[] {
  if (linhas.length < 3) return []
  const chances = new Map(probabilidades.map((p) => [p.time.id, p.posicoes]))
  const chance = (time: Time, faixa: { de: number; ate: number }) => {
    const posicoes = chances.get(time.id)
    return posicoes ? chanceNaFaixa(posicoes, faixa) : null
  }
  const titulo = { de: 1, ate: 1 }
  const libertadores = zona('Libertadores')
  const rebaixamento = zona('Rebaixamento')
  const ovr = (linha: LinhaClassificacao) => notaDoTime(linha.aproveitamento)

  const [lider, vice, terceiro] = linhas
  const cards: CardDestaque[] = [
    {
      chave: 'lider',
      rotulo: `LÍDER · OVR ${ovr(lider)}`,
      time: lider.time,
      grande: lider.pontos,
      unidade: 'pts',
      anel: chance(lider.time, titulo),
      rotuloAnel: 'título',
      tom: 'lima',
      numeros: [
        { valor: lider.golsPro, rotulo: 'gols marcados' },
        { valor: lider.golsContra, rotulo: 'gols sofridos' },
        { valor: formatarSaldo(lider.pontos - vice.pontos), rotulo: 'de vantagem' },
      ],
    },
    {
      chave: 'vice',
      rotulo: `VICE · OVR ${ovr(vice)}`,
      time: vice.time,
      grande: vice.pontos,
      unidade: 'pts',
      anel: chance(vice.time, titulo),
      rotuloAnel: 'título',
      tom: 'lima',
      numeros: [
        { valor: vice.vitorias, rotulo: 'vitórias' },
        { valor: vice.derrotas, rotulo: 'derrotas' },
        { valor: formatarSaldo(vice.pontos - lider.pontos), rotulo: 'do líder' },
      ],
    },
  ]

  // Artilheiro do 3º colocado (pela lista da artilharia), para o primeiro número do card.
  const artilheiroDoTerceiro = [...artilharia]
    .filter((a) => a.timeId === terceiro.time.id)
    .sort((a, b) => b.gols - a.gols)[0]
  cards.push({
    chave: 'terceiro',
    rotulo: `3º · OVR ${ovr(terceiro)}`,
    time: terceiro.time,
    grande: terceiro.pontos,
    unidade: 'pts',
    anel: chance(terceiro.time, libertadores),
    rotuloAnel: 'Libertadores',
    tom: 'lima',
    numeros: [
      artilheiroDoTerceiro
        ? { valor: artilheiroDoTerceiro.gols, rotulo: `gols de ${sobrenome(artilheiroDoTerceiro.nome)}` }
        : { valor: terceiro.vitorias, rotulo: 'vitórias' },
      { valor: terceiro.golsPro, rotulo: 'gols marcados' },
      { valor: formatarSaldo(terceiro.saldo), rotulo: 'saldo' },
    ],
  })

  const [emChamas] = emSequencia(estatisticas, linhas, 'vitorias')
  if (emChamas) {
    const { linha, quantidade } = emChamas
    // Para quem está em cima, a chance que importa é a de Libertadores; para quem está embaixo, a de cair.
    const emCima = linha.posicao <= libertadores.ate * 2
    cards.push({
      chave: 'chamas',
      rotulo: `EM CHAMAS · OVR ${ovr(linha)}`,
      time: linha.time,
      grande: quantidade,
      unidade: quantidade === 1 ? 'vitória seguida' : 'vitórias seguidas',
      anel: emCima ? chance(linha.time, libertadores) : chance(linha.time, rebaixamento),
      rotuloAnel: emCima ? 'Libertadores' : 'rebaixamento',
      tom: 'lima',
      efeito: 'fogo',
      numeros: [
        { valor: `${linha.posicao}º`, rotulo: 'posição' },
        { valor: linha.pontos, rotulo: 'pontos' },
        { valor: linha.golsPro, rotulo: 'gols marcados' },
      ],
    })
  }

  const [emChoque] = emSequencia(estatisticas, linhas, 'derrotas')
  if (emChoque) {
    const { linha, quantidade } = emChoque
    cards.push({
      chave: 'choque',
      rotulo: `EM CHOQUE · OVR ${ovr(linha)}`,
      time: linha.time,
      grande: quantidade,
      unidade: quantidade === 1 ? 'derrota seguida' : 'derrotas seguidas',
      anel: chance(linha.time, rebaixamento),
      rotuloAnel: 'rebaixamento',
      tom: 'vermelho',
      efeito: 'choque',
      numeros: [
        { valor: `${linha.posicao}º`, rotulo: 'posição' },
        { valor: linha.pontos, rotulo: 'pontos' },
        // Por definição, quem perdeu os N últimos fez 0 ponto neles.
        { valor: 0, rotulo: `pts nos últimos ${quantidade}` },
      ],
    })
  }

  const lanterna = linhas[linhas.length - 1]
  const ultimoSeguro = linhas[ULTIMA_POSICAO_SEGURA - 1]
  if (lanterna && ultimoSeguro && lanterna.posicao > ULTIMA_POSICAO_SEGURA) {
    cards.push({
      chave: 'lanterna',
      rotulo: `LANTERNA · OVR ${ovr(lanterna)}`,
      time: lanterna.time,
      grande: lanterna.pontos,
      unidade: 'pts',
      anel: chance(lanterna.time, rebaixamento),
      rotuloAnel: 'rebaixamento',
      tom: 'vermelho',
      numeros: [
        { valor: lanterna.vitorias, rotulo: 'vitórias' },
        { valor: lanterna.golsContra, rotulo: 'gols sofridos' },
        { valor: formatarSaldo(lanterna.pontos - ultimoSeguro.pontos), rotulo: 'da salvação' },
      ],
    })
  }

  return cards
}

/** "Kevin Viveros" -> "Viveros"; nomes de uma palavra ficam como estão. */
export function sobrenome(nome: string) {
  const partes = nome.trim().split(/\s+/)
  return partes[partes.length - 1]
}
