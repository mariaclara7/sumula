import type { Partida, Resultado } from '../api/tipos'

const FUSO = 'America/Sao_Paulo'

const formatoData = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

const formatoAtualizacao = new Intl.DateTimeFormat('pt-BR', {
  timeZone: FUSO,
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
})

/** Ex.: "dom., 05/04, 16:00" */
export function formatarDataPartida(iso: string) {
  return formatoData.format(new Date(iso))
}

/** Ex.: "28/09, 20:41" */
export function formatarAtualizacao(iso: string) {
  return formatoAtualizacao.format(new Date(iso))
}

/** Saldo com sinal: +5, 0, -3. */
export function formatarSaldo(saldo: number) {
  return saldo > 0 ? `+${saldo}` : String(saldo)
}

export function formatarPercentual(valor: number) {
  return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
}

/**
 * Chance em percentual inteiro, separada em "menos de"/"mais de" e o número, para quem mostra o
 * qualificador menor. Evita "0%" e "100%" quando o evento ainda é possível, porque arredondar 0,3% para
 * 0% passa a ideia errada de que acabou. Por extenso, e não "<1%", para qualquer um entender.
 */
export function partesDaChance(chance: number): { qualificador?: 'menos de' | 'mais de'; numero: string } {
  if (chance <= 0) return { numero: '—' }
  if (chance >= 1) return { numero: '100%' }
  if (chance < 0.005) return { qualificador: 'menos de', numero: '1%' }
  if (chance > 0.995) return { qualificador: 'mais de', numero: '99%' }
  return { numero: `${Math.round(chance * 100)}%` }
}

/** Ex.: "12%", "menos de 1%", "mais de 99%". */
export function formatarChance(chance: number) {
  const { qualificador, numero } = partesDaChance(chance)
  return qualificador ? `${qualificador} ${numero}` : numero
}

export const SIGLA_RESULTADO: Record<Resultado, string> = {
  vitoria: 'V',
  empate: 'E',
  derrota: 'D',
}

export const NOME_RESULTADO: Record<Resultado, string> = {
  vitoria: 'Vitória',
  empate: 'Empate',
  derrota: 'Derrota',
}

/** Resultado da partida do ponto de vista de um time, ou undefined se ainda não terminou. */
export function resultadoPara(partida: Partida, timeId: number): Resultado | undefined {
  if (!partida.temResultado || partida.golsMandante === null || partida.golsVisitante === null) return undefined

  const [pro, contra] =
    partida.mandanteId === timeId
      ? [partida.golsMandante, partida.golsVisitante]
      : [partida.golsVisitante, partida.golsMandante]

  return pro > contra ? 'vitoria' : pro < contra ? 'derrota' : 'empate'
}
