import { formatarChance } from '../util/formato'

type Props = { chance: number; cor: string; alinhamento?: 'direita' | 'esquerda' }

/** Percentual com uma barrinha embaixo; o número é sempre o que carrega a informação. */
export function BarraChance({ chance, cor, alinhamento = 'direita' }: Props) {
  return (
    <div className="min-w-10">
      <div className={`tabular-nums ${alinhamento === 'direita' ? 'text-right' : 'text-left'}`}>{formatarChance(chance)}</div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-superficie-2">
        {chance > 0 && (
          <div className={`h-full rounded-full ${cor}`} style={{ width: `max(${chance * 100}%, 2px)` }} />
        )}
      </div>
    </div>
  )
}
