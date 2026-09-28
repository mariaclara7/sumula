/** Código do football-data.org. BSA = Brasileirão Série A. */
export const COMPETICAO = 'BSA'
export const TEMPORADA = 2026
export const NOME_COMPETICAO = 'Brasileirão Série A'

export type Zona = {
  nome: string
  /** Posições da zona, inclusivas. */
  de: number
  ate: number
  /** Classe Tailwind da faixa colorida ao lado da posição. */
  cor: string
}

/**
 * Faixas de classificação do Brasileirão. As vagas podem mudar conforme os campeões
 * da Copa do Brasil e das competições continentais, então são uma referência.
 */
export const ZONAS: Zona[] = [
  { nome: 'Libertadores', de: 1, ate: 4, cor: 'bg-zona-libertadores' },
  { nome: 'Pré-Libertadores', de: 5, ate: 6, cor: 'bg-zona-pre-libertadores' },
  { nome: 'Sul-Americana', de: 7, ate: 12, cor: 'bg-zona-sul-americana' },
  { nome: 'Rebaixamento', de: 17, ate: 20, cor: 'bg-zona-rebaixamento' },
]

export function zonaDaPosicao(posicao: number): Zona | undefined {
  return ZONAS.find((zona) => posicao >= zona.de && posicao <= zona.ate)
}
