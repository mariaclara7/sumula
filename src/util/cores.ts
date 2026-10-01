import type { Time } from '../api/tipos'

/** Cor principal (fundo) e secundária (texto) de um time. */
export type CoresTime = { principal: string; secundaria: string }

/**
 * A API não traz as cores dos clubes, então elas ficam aqui, pelo nome curto
 * (o shortName do football-data.org), sem acento e em minúsculas.
 */
const CORES: Record<string, CoresTime> = {
  flamengo: { principal: '#c8102e', secundaria: '#111111' },
  palmeiras: { principal: '#0b6b3a', secundaria: '#ffffff' },
  paranaense: { principal: '#d2102a', secundaria: '#111111' },
  athletico: { principal: '#d2102a', secundaria: '#111111' },
  'athletico-pr': { principal: '#d2102a', secundaria: '#111111' },
  fluminense: { principal: '#7a1f3d', secundaria: '#ffffff' },
  bahia: { principal: '#1a55b5', secundaria: '#ffffff' },
  cruzeiro: { principal: '#1b3fa6', secundaria: '#ffffff' },
  mineiro: { principal: '#1a1a1a', secundaria: '#ffffff' },
  'atletico mineiro': { principal: '#1a1a1a', secundaria: '#ffffff' },
  santos: { principal: '#f4f4f4', secundaria: '#111111' },
  coritiba: { principal: '#0f6b3c', secundaria: '#ffffff' },
  bragantino: { principal: '#e8e8e8', secundaria: '#c8102e' },
  'sao paulo': { principal: '#e8e8e8', secundaria: '#c8102e' },
  botafogo: { principal: '#1a1a1a', secundaria: '#ffffff' },
  vitoria: { principal: '#c8102e', secundaria: '#111111' },
  corinthians: { principal: '#1a1a1a', secundaria: '#ffffff' },
  mirassol: { principal: '#f3c500', secundaria: '#0b5a2e' },
  'vasco da gama': { principal: '#1a1a1a', secundaria: '#ffffff' },
  vasco: { principal: '#1a1a1a', secundaria: '#ffffff' },
  gremio: { principal: '#0a7fc2', secundaria: '#111111' },
  internacional: { principal: '#d2102a', secundaria: '#ffffff' },
  'clube do remo': { principal: '#0d2a6b', secundaria: '#ffffff' },
  remo: { principal: '#0d2a6b', secundaria: '#ffffff' },
  chapecoense: { principal: '#0f7a3c', secundaria: '#ffffff' },
}

/** Para times sem cor cadastrada (ex.: promovidos de outra temporada). */
const NEUTRAS: CoresTime = { principal: '#111111', secundaria: '#f2f1ec' }

function normalizar(nome: string) {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function coresDoTime(time: Pick<Time, 'nomeCurto' | 'nome'>): CoresTime {
  return CORES[normalizar(time.nomeCurto)] ?? CORES[normalizar(time.nome)] ?? NEUTRAS
}
