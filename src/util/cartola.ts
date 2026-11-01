/**
 * Dicas para o Cartola a partir do modelo de gols da BraSúmula (o mesmo do palpite da Súmula): os gols de cada
 * lado seguem uma distribuição de Poisson com a média prevista para o jogo.
 * - SG (saldo de gols, o "não levar gol" do Cartola): chance de o adversário fazer 0 gols = e^(−média dele).
 * - Marcar: chance de fazer pelo menos 1 gol = 1 − e^(−média); 2 ou mais = 1 − e^(−média)·(1 + média).
 */
import type { Palpite, Partida } from '../api/tipos'
import { jogoFechado } from './bolao'

export const chanceSemSofrer = (golsDoAdversario: number) => Math.exp(-golsDoAdversario)
export const chanceDeMarcar = (gols: number) => 1 - Math.exp(-gols)
export const chanceDeDoisOuMais = (gols: number) => 1 - Math.exp(-gols) * (1 + gols)

export type LinhaCartola = {
  timeId: number
  adversarioId: number
  emCasa: boolean
  partida: Partida
  golsPro: number
  golsContra: number
  sg: number
  marcar: number
  doisOuMais: number
}

export type Faixa = 'otima' | 'boa' | 'fraca'

/** SG: ótima a partir de 45%, boa de 30% a 44%. Marcar: ótima a partir de 80%, boa de 65% a 79%. */
export function faixaDaChance(chance: number, modo: 'defesa' | 'ataque'): Faixa {
  const [otima, boa] = modo === 'defesa' ? [0.45, 0.3] : [0.8, 0.65]
  return chance >= otima ? 'otima' : chance >= boa ? 'boa' : 'fraca'
}

/** Jogos da rodada que ainda não começaram e têm previsão do modelo. */
export function jogosAbertos(partidas: Partida[], palpites: Map<number, Palpite>, rodada: number, agora: number) {
  return partidas
    .filter((p) => p.rodada === rodada && palpites.has(p.id) && !jogoFechado(p, agora))
    .sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id)
}

/** Duas linhas por jogo (mandante e visitante). */
export function linhasDaRodada(jogos: Partida[], palpites: Map<number, Palpite>): LinhaCartola[] {
  return jogos.flatMap((partida) => {
    const palpite = palpites.get(partida.id)
    if (!palpite) return []
    const lado = (emCasa: boolean): LinhaCartola => {
      const golsPro = emCasa ? palpite.golsEsperadosMandante : palpite.golsEsperadosVisitante
      const golsContra = emCasa ? palpite.golsEsperadosVisitante : palpite.golsEsperadosMandante
      return {
        timeId: emCasa ? partida.mandanteId : partida.visitanteId,
        adversarioId: emCasa ? partida.visitanteId : partida.mandanteId,
        emCasa,
        partida,
        golsPro,
        golsContra,
        sg: chanceSemSofrer(golsContra),
        marcar: chanceDeMarcar(golsPro),
        doisOuMais: chanceDeDoisOuMais(golsPro),
      }
    }
    return [lado(true), lado(false)]
  })
}

/**
 * A rodada que a página abre: a primeira em que pelo menos metade dos jogos ainda vai começar (um jogo atrasado de
 * rodada antiga não puxa a página para trás). Sem nenhuma, null.
 */
export function rodadaDoCartola(partidas: Partida[], palpites: Map<number, Palpite>, agora: number): number | null {
  const rodadas = [...new Set(partidas.map((p) => p.rodada))].sort((a, b) => a - b)
  return (
    rodadas.find((r) => {
      const daRodada = partidas.filter((p) => p.rodada === r && p.status !== 'cancelada')
      return daRodada.length > 0 && jogosAbertos(partidas, palpites, r, agora).length * 2 >= daRodada.length
    }) ?? null
  )
}

/** As rodadas com algum jogo aberto (para navegar). */
export function rodadasComJogosAbertos(partidas: Partida[], palpites: Map<number, Palpite>, agora: number) {
  return [...new Set(partidas.filter((p) => palpites.has(p.id) && !jogoFechado(p, agora)).map((p) => p.rodada))].sort((a, b) => a - b)
}
