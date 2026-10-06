import type { Palpite, Partida } from '../api/tipos'
import { COMPETICAO, TEMPORADA } from '../config'
import { lerArmazenado } from '../preferencias'
import type { JogoComPlacar } from './classificacao'

/** Placar digitado no simulador; um lado vazio fica null e o jogo ainda não conta na tabela. */
export type PlacarDigitado = { mandante: number | null; visitante: number | null }
export type PalpitesUsuario = Record<number, PlacarDigitado>

export const MAIOR_PLACAR = 20

/** Jogo que o usuário pode palpitar: tudo o que ainda não tem resultado (inclui adiados) e não foi cancelado. */
export function podePalpitar(partida: Partida) {
  return !partida.temResultado && partida.status !== 'cancelada'
}

/** "3" → 3; "" ou algo inválido → null. Limita a 0–20 para ninguém digitar 999 sem querer. */
export function lerGols(texto: string): number | null {
  const limpo = texto.replace(/\D/g, '')
  if (limpo === '') return null
  return Math.min(Number(limpo), MAIOR_PLACAR)
}

/** Jogos que entram na tabela simulada: os disputados de verdade mais os palpites completos. */
export function jogosDaSimulacao(partidas: Partida[], palpites: PalpitesUsuario): JogoComPlacar[] {
  return partidas.flatMap((partida): JogoComPlacar[] => {
    if (partida.temResultado && partida.golsMandante !== null && partida.golsVisitante !== null) {
      return [{ ...partida, golsMandante: partida.golsMandante, golsVisitante: partida.golsVisitante }]
    }
    const palpite = podePalpitar(partida) ? palpites[partida.id] : undefined
    if (palpite?.mandante == null || palpite.visitante == null) return []
    return [{ ...partida, golsMandante: palpite.mandante, golsVisitante: palpite.visitante }]
  })
}

/** Preenche com o placar mais provável da Súmula os jogos que o usuário ainda não palpitou. */
export function preencherComPalpitesDaSumula(
  partidas: Partida[],
  atuais: PalpitesUsuario,
  daSumula: Map<number, Palpite>,
): PalpitesUsuario {
  const novos = { ...atuais }
  for (const partida of partidas) {
    if (!podePalpitar(partida)) continue
    const atual = novos[partida.id]
    if (atual?.mandante != null && atual.visitante != null) continue
    const sugestao = daSumula.get(partida.id)
    if (sugestao) novos[partida.id] = { ...sugestao.placarMaisProvavel }
  }
  return novos
}

/**
 * Rodada para abrir o simulador: a rodada atual, que é a primeira com jogo por palpitar cuja rodada seguinte ainda
 * não está mais da metade disputada. Assim um jogo atrasado (ex.: um adiado da rodada 21 quando já se joga a 29)
 * não puxa a tela para trás, e uma rodada com jogos ainda na segunda-feira continua sendo a atual.
 */
export function rodadaInicial(partidas: Partida[]) {
  const rodadas = [...new Set(partidas.map((p) => p.rodada))].sort((a, b) => a - b)
  const daRodada = (r: number) => partidas.filter((p) => p.rodada === r && p.status !== 'cancelada')
  const comPendentes = rodadas.filter((r) => daRodada(r).some(podePalpitar))

  const atual = comPendentes.find((r) => {
    const seguinte = rodadas[rodadas.indexOf(r) + 1]
    if (seguinte === undefined) return true
    const jogos = daRodada(seguinte)
    return jogos.filter((p) => p.temResultado).length * 2 <= jogos.length
  })
  return atual ?? comPendentes[0] ?? Math.max(1, ...rodadas)
}

/** Lê palpites salvos, descartando o que não tiver o formato esperado. */
export function lerPalpitesSalvos(texto: string | null): PalpitesUsuario {
  if (!texto) return {}
  try {
    const dados: unknown = JSON.parse(texto)
    if (typeof dados !== 'object' || dados === null) return {}
    const valido = (v: unknown) => v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= MAIOR_PLACAR)
    return Object.fromEntries(
      Object.entries(dados).filter(
        ([id, placar]) =>
          Number.isInteger(Number(id)) &&
          typeof placar === 'object' &&
          placar !== null &&
          valido((placar as PlacarDigitado).mandante) &&
          valido((placar as PlacarDigitado).visitante),
      ),
    ) as PalpitesUsuario
  } catch {
    return {}
  }
}

/** Onde o Simulador guarda os palpites neste navegador. */
export const CHAVE_PALPITES = `sumula:simulador:${COMPETICAO}:${TEMPORADA}`

/** Os palpites salvos no Simulador (para levar para uma sala). */
export function palpitesDoSimulador() {
  return lerPalpitesSalvos(lerArmazenado(CHAVE_PALPITES))
}
