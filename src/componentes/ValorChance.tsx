import { partesDaChance } from '../util/formato'

type Props = {
  chance: number
  /** Qualificador numa linha acima do número, para colunas estreitas. */
  empilhado?: boolean
  /** Tamanho do "menos de"/"mais de", relativo ao número. */
  tamanho?: string
}

/** Chance com o "menos de"/"mais de" em letra menor, para caber onde antes cabia "<1%". */
export function ValorChance({ chance, empilhado = false, tamanho = 'text-[0.6em]' }: Props) {
  const { qualificador, numero } = partesDaChance(chance)
  if (!qualificador) return numero
  return (
    <>
      <span className={`font-sans font-bold tracking-normal whitespace-nowrap ${tamanho} ${empilhado ? 'block leading-tight' : ''}`}>
        {qualificador}{' '}
      </span>
      {numero}
    </>
  )
}
