import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { obter } from './cliente'
import type {
  Artilheiro,
  Classificacao,
  EvolucaoTime,
  Mando,
  Palpite,
  Partida,
  Recorte,
  ResultadoEstatisticas,
  ResultadoSimulacao,
  ResultadoTempos,
  ResumoConfronto,
  ResumoTime,
  SituacaoMatematica,
  Tempo,
  Time,
} from './tipos'

export function useTimes() {
  return useQuery({
    queryKey: ['times'],
    queryFn: () => obter<Time[]>('/times'),
    select: (times) => ({ lista: times, porId: new Map(times.map((time) => [time.id, time])) }),
  })
}

export function useClassificacao(recorte: Recorte, mando: Mando, tempo: Tempo) {
  return useQuery({
    queryKey: ['classificacao', recorte, mando, tempo],
    queryFn: () => obter<Classificacao>('/classificacao', { recorte, mando, tempo }),
    // Ao trocar o filtro, a tabela antiga fica na tela até a nova chegar, e as linhas deslizam para o lugar novo.
    placeholderData: keepPreviousData,
  })
}

export function useEvolucao() {
  return useQuery({
    queryKey: ['evolucao'],
    queryFn: () => obter<EvolucaoTime[]>('/evolucao'),
  })
}

export function useTempos() {
  return useQuery({
    queryKey: ['tempos'],
    queryFn: () => obter<ResultadoTempos>('/tempos'),
  })
}

export function useResumoTime(timeId: number) {
  return useQuery({
    queryKey: ['time', timeId],
    queryFn: () => obter<ResumoTime>(`/times/${timeId}`),
  })
}

export function useConfronto(timeA: number | undefined, timeB: number | undefined) {
  return useQuery({
    queryKey: ['confronto', timeA, timeB],
    queryFn: () => obter<ResumoConfronto>('/confronto', { timeA, timeB }),
    enabled: timeA !== undefined && timeB !== undefined && timeA !== timeB,
  })
}

export function useArtilharia() {
  return useQuery({
    queryKey: ['artilharia'],
    queryFn: () => obter<Artilheiro[]>('/artilharia'),
  })
}

export function useProbabilidades() {
  return useQuery({
    queryKey: ['probabilidades'],
    queryFn: () => obter<ResultadoSimulacao>('/probabilidades'),
  })
}

export function usePartidas() {
  return useQuery({
    queryKey: ['partidas'],
    queryFn: () => obter<Partida[]>('/partidas'),
  })
}

/** Palpites de todos os jogos restantes, indexados pelo id da partida. */
export function usePalpites() {
  return useQuery({
    queryKey: ['palpites'],
    queryFn: () => obter<Palpite[]>('/palpites'),
    select: (palpites) => new Map(palpites.map((p) => [p.partidaId, p])),
  })
}

export function useMatematica() {
  return useQuery({
    queryKey: ['matematica'],
    queryFn: () => obter<SituacaoMatematica[]>('/matematica'),
  })
}

export function useEstatisticas() {
  return useQuery({
    queryKey: ['estatisticas'],
    queryFn: () => obter<ResultadoEstatisticas>('/estatisticas'),
  })
}
