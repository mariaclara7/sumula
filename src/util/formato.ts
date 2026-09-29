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
 * Chance em percentual inteiro. Evita "0%" e "100%" quando o evento ainda é possível,
 * porque arredondar 0,3% para 0% passa a ideia errada de que acabou.
 */
export function formatarChance(chance: number) {
  if (chance <= 0) return '—'
  if (chance >= 1) return '100%'
  if (chance < 0.005) return '<1%'
  if (chance > 0.995) return '>99%'
  return `${Math.round(chance * 100)}%`
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
