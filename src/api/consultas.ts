import { useQuery } from '@tanstack/react-query'
import { obter } from './cliente'
import type {
  Artilheiro,
  Classificacao,
  Mando,
  Recorte,
  ResultadoSimulacao,
  ResultadoTempos,
  ResumoConfronto,
  ResumoTime,
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
