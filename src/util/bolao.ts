/**
 * Bolão das salas: pontos de cada palpite, ranking, rei da rodada e a trava dos jogos que já começaram.
 * Só diversão (sem dinheiro). Usado pelo site e pelo servidor (worker/), por isso não depende do navegador.
 *
 * Regras:
 * - Placar exato vale 3 pontos; acertar só o resultado (quem venceu, ou o empate), 1; errar, 0.
 * - O palpite de um jogo fecha no horário em que ele começa (o servidor recusa mudança depois disso).
 * - Contam os jogos a partir da rodada de início (veja rodadaDeInicio).
 * - Desempate: mais placares exatos; depois, mais resultados certos. Se ainda empatar, a posição é a mesma.
 * - Rei da rodada: quem fez mais pontos numa rodada encerrada (empate: todos levam; ninguém leva com 0).
 */
import type { Partida } from '../api/tipos'

type Placar = { mandante: number | null; visitante: number | null }
type Palpites = Record<number, Placar>
type JogoDoBolao = Pick<Partida, 'id' | 'rodada' | 'data' | 'status' | 'temResultado' | 'golsMandante' | 'golsVisitante'>

export const PONTOS = { cravou: 3, resultado: 1, errou: 0 } as const

/**
 * Quando o bolão passou a valer em cada temporada. Antes disso não havia trava no horário do jogo, então só
 * contam as rodadas que começaram inteiras depois deste instante. Temporada que não está aqui conta desde o início.
 */
export const INICIO_DO_BOLAO: Record<number, string> = {
  2026: '2026-11-02T03:00:00Z',
}

/**
 * O palpite deste jogo não pode mais mudar: já começou (pelo horário), já tem resultado ou foi cancelado.
 * Jogo adiado sem resultado fica aberto até ganhar data nova e chegar a hora dela.
 */
export function jogoFechado(partida: Pick<Partida, 'data' | 'status' | 'temResultado'>, agora: number) {
  if (partida.temResultado || partida.status === 'cancelada' || partida.status === 'emAndamento' || partida.status === 'encerrada')
    return true
  if (partida.status === 'adiada') return false
  const inicio = Date.parse(partida.data)
  return Number.isFinite(inicio) && inicio <= agora
}

/**
 * Os ids dos jogos fechados cujo palpite mudou (incluído, trocado ou apagado) de `antes` para `depois`.
 * Vazio: pode gravar.
 */
export function palpitesMexidosEmJogosFechados(partidas: JogoDoBolao[], antes: Palpites, depois: Palpites, agora: number) {
  const igual = (a: Placar | undefined, b: Placar | undefined) =>
    (a?.mandante ?? null) === (b?.mandante ?? null) && (a?.visitante ?? null) === (b?.visitante ?? null)
  return partidas.filter((p) => jogoFechado(p, agora) && !igual(antes[p.id], depois[p.id])).map((p) => p.id)
}

/**
 * `novos` com os jogos fechados de volta ao que está gravado (`salvos`): o que se digitou depois do jogo começar
 * não vale (e o servidor recusaria).
 */
export function manterFechados<T extends Placar>(partidas: JogoDoBolao[], salvos: Record<number, T>, novos: Record<number, T>, agora: number) {
  const resultado = { ...novos }
  for (const p of partidas) {
    if (!jogoFechado(p, agora)) continue
    if (salvos[p.id]) resultado[p.id] = salvos[p.id]
    else delete resultado[p.id]
  }
  return resultado
}

/**
 * A primeira rodada que conta no bolão desta temporada: a primeira em que todos os jogos (menos os cancelados)
 * começam depois de INICIO_DO_BOLAO. null se nenhuma rodada começou inteira depois disso (fim de temporada).
 */
export function rodadaDeInicio(partidas: JogoDoBolao[], temporada: number): number | null {
  const rodadas = [...new Set(partidas.map((p) => p.rodada))].sort((a, b) => a - b)
  const inicio = INICIO_DO_BOLAO[temporada]
  if (!inicio) return rodadas[0] ?? null
  const limite = Date.parse(inicio)
  return (
    rodadas.find((r) =>
      partidas.filter((p) => p.rodada === r && p.status !== 'cancelada').every((p) => Date.parse(p.data) >= limite),
    ) ?? null
  )
}

/** Pontos do palpite num jogo encerrado (3, 1 ou 0); null se o jogo não terminou ou não havia palpite completo. */
export function pontosDoPalpite(partida: JogoDoBolao, palpite: Placar | undefined): number | null {
  if (!partida.temResultado || partida.golsMandante === null || partida.golsVisitante === null) return null
  if (palpite?.mandante == null || palpite.visitante == null) return null
  if (palpite.mandante === partida.golsMandante && palpite.visitante === partida.golsVisitante) return PONTOS.cravou
  return Math.sign(palpite.mandante - palpite.visitante) === Math.sign(partida.golsMandante - partida.golsVisitante)
    ? PONTOS.resultado
    : PONTOS.errou
}

export type LinhaBolao = {
  id: number
  /** 1, 2, 2, 4...: empatados em tudo dividem a posição. */
  posicao: number
  pontos: number
  exatos: number
  resultados: number
  /** Rodadas em que foi rei. */
  coroas: number
  porRodada: Record<number, number>
}

export type Bolao = {
  /** Rodada de início; null se o bolão não tem rodada para valer nesta temporada. */
  desde: number | null
  /** Do primeiro ao último colocado. */
  ranking: LinhaBolao[]
  /** Rodadas (a partir de `desde`) com pelo menos um jogo encerrado, em ordem. */
  rodadas: number[]
  /** Rodadas encerradas e quem foi rei em cada uma (ids). */
  reis: Map<number, number[]>
  /** A última rodada encerrada que conta, ou null. */
  ultimaEncerrada: number | null
  /** Jogos encerrados que já contaram. */
  jogosContados: number
}

/** Rodada encerrada: todos os jogos têm resultado, foram cancelados ou adiados. */
function rodadaEncerrada(partidas: JogoDoBolao[], rodada: number) {
  const jogos = partidas.filter((p) => p.rodada === rodada)
  return jogos.length > 0 && jogos.every((p) => p.temResultado || p.status === 'cancelada' || p.status === 'adiada')
}

export function calcularBolao(
  partidas: JogoDoBolao[],
  participantes: { id: number; palpites: Palpites }[],
  desde: number | null,
): Bolao {
  const contados = desde === null ? [] : partidas.filter((p) => p.rodada >= desde && pontosDoPalpite(p, { mandante: 0, visitante: 0 }) !== null)
  const rodadas = [...new Set(contados.map((p) => p.rodada))].sort((a, b) => a - b)

  const linhas = participantes.map((participante) => {
    const linha: LinhaBolao = { id: participante.id, posicao: 0, pontos: 0, exatos: 0, resultados: 0, coroas: 0, porRodada: {} }
    for (const r of rodadas) linha.porRodada[r] = 0
    for (const partida of contados) {
      const pontos = pontosDoPalpite(partida, participante.palpites[partida.id])
      if (!pontos) continue
      linha.pontos += pontos
      linha.porRodada[partida.rodada] += pontos
      if (pontos === PONTOS.cravou) linha.exatos++
      else linha.resultados++
    }
    return linha
  })

  const reis = new Map<number, number[]>()
  for (const r of rodadas) {
    if (!rodadaEncerrada(partidas, r)) continue
    const maior = Math.max(0, ...linhas.map((l) => l.porRodada[r]))
    const vencedores = maior > 0 ? linhas.filter((l) => l.porRodada[r] === maior).map((l) => l.id) : []
    reis.set(r, vencedores)
    for (const l of linhas) if (vencedores.includes(l.id)) l.coroas++
  }

  const ordem = (a: LinhaBolao, b: LinhaBolao) => b.pontos - a.pontos || b.exatos - a.exatos || b.resultados - a.resultados
  const ranking = [...linhas].sort((a, b) => ordem(a, b) || a.id - b.id)
  ranking.forEach((l, i) => {
    l.posicao = i > 0 && ordem(ranking[i - 1], l) === 0 ? ranking[i - 1].posicao : i + 1
  })

  return { desde, ranking, rodadas, reis, ultimaEncerrada: [...reis.keys()].at(-1) ?? null, jogosContados: contados.length }
}
