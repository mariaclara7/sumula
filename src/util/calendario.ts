import type { Partida } from '../api/tipos'
import { podePalpitar, rodadaInicial } from './simulador'

const FUSO = 'America/Sao_Paulo'

/** Dia de um jogo no horário de Brasília, como "2026-10-17" (serve para agrupar e comparar). */
export function diaDoJogo(iso: string | Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: FUSO, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(iso),
  )
}

const formatoDia = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, weekday: 'short', day: '2-digit', month: '2-digit' })
const formatoDiaMes = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, day: '2-digit', month: '2-digit' })
const formatoHora = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' })

/** "16:00" */
export function horaDoJogo(iso: string) {
  return formatoHora.format(new Date(iso))
}

/** "sáb., 17/10" */
export function nomeDoDia(iso: string) {
  return formatoDia.format(new Date(iso))
}

/** "Hoje", "Amanhã", "Ontem" ou nada. */
export function diaRelativo(iso: string, agora: Date) {
  const dia = diaDoJogo(iso)
  const hoje = diaDoJogo(agora)
  const umDia = 86_400_000
  if (dia === hoje) return 'Hoje'
  if (dia === diaDoJogo(new Date(agora.getTime() + umDia))) return 'Amanhã'
  if (dia === diaDoJogo(new Date(agora.getTime() - umDia))) return 'Ontem'
  return null
}

/** "17 a 19/10", "17/10" ou "30/10 a 02/11". */
export function periodo(partidas: Partida[]) {
  if (partidas.length === 0) return ''
  const datas = partidas.map((p) => p.data).sort()
  const primeiro = formatoDiaMes.format(new Date(datas[0]))
  const ultimo = formatoDiaMes.format(new Date(datas[datas.length - 1]))
  if (primeiro === ultimo) return primeiro
  // Mesmo mês: "17 a 19/10".
  if (primeiro.slice(3) === ultimo.slice(3)) return `${primeiro.slice(0, 2)} a ${ultimo}`
  return `${primeiro} a ${ultimo}`
}

export type DiaDeJogos = { dia: string; partidas: Partida[] }
export type GrupoRodada = { rodada: number; partidas: Partida[]; dias: DiaDeJogos[] }

export type Calendario = {
  /** Jogos remarcados de rodadas que já passaram (ex.: um jogo da 21 quando a atual é a 31). */
  atrasados: DiaDeJogos[]
  rodadas: GrupoRodada[]
  /** Adiados que ainda não têm data nova. */
  semData: Partida[]
}

function porDia(partidas: Partida[], recentesPrimeiro: boolean): DiaDeJogos[] {
  const dias = new Map<string, Partida[]>()
  for (const p of [...partidas].sort((a, b) => a.data.localeCompare(b.data) || a.id - b.id)) {
    const dia = diaDoJogo(p.data)
    dias.set(dia, [...(dias.get(dia) ?? []), p])
  }
  const lista = [...dias].map(([dia, jogos]) => ({ dia, partidas: jogos }))
  return recentesPrimeiro ? lista.reverse() : lista
}

function porRodada(partidas: Partida[], recentesPrimeiro: boolean): GrupoRodada[] {
  const rodadas = new Map<number, Partida[]>()
  for (const p of partidas) rodadas.set(p.rodada, [...(rodadas.get(p.rodada) ?? []), p])
  return [...rodadas]
    .sort(([a], [b]) => (recentesPrimeiro ? b - a : a - b))
    .map(([rodada, jogos]) => ({ rodada, partidas: jogos, dias: porDia(jogos, recentesPrimeiro) }))
}

/**
 * Os próximos jogos, separados por rodada e, dentro dela, por dia. A rodada atual é a mesma do simulador; um jogo
 * remarcado de rodada anterior vai para "atrasados" (para não aparecer uma rodada antiga no topo), e um adiado sem
 * data nova vai para o fim.
 *
 * `todas` define a rodada atual com o campeonato inteiro, mesmo quando `partidas` já vem filtrada por um time.
 */
export function proximosJogos(partidas: Partida[], todas: Partida[] = partidas): Calendario {
  const atual = rodadaInicial(todas)
  const pendentes = partidas.filter(podePalpitar)
  const semData = pendentes.filter((p) => p.status === 'adiada').sort((a, b) => a.rodada - b.rodada || a.id - b.id)
  const comData = pendentes.filter((p) => p.status !== 'adiada')
  return {
    atrasados: porDia(
      comData.filter((p) => p.rodada < atual),
      false,
    ),
    rodadas: porRodada(
      comData.filter((p) => p.rodada >= atual),
      false,
    ),
    semData,
  }
}

/** Os jogos que já terminaram, da rodada mais recente para a mais antiga, e do dia mais recente para o mais antigo. */
export function resultados(partidas: Partida[]): GrupoRodada[] {
  return porRodada(
    partidas.filter((p) => p.temResultado),
    true,
  )
}
