import { ValorChance } from './ValorChance'

type Props = {
  chance: number
  cor: string
  alinhamento?: 'direita' | 'esquerda'
  /** 0 a 1: a barra cresce junto com a animação da página. */
  progresso?: number
}

/** Percentual com uma barrinha embaixo; o número é sempre o que carrega a informação. */
export function BarraChance({ chance, cor, alinhamento = 'direita', progresso = 1 }: Props) {
  return (
    <div className="flex min-w-10 flex-col gap-[5px]">
      <span
        className={`font-mono text-[13px] font-bold whitespace-nowrap tabular-nums ${alinhamento === 'direita' ? 'text-right' : 'text-left'}`}
      >
        <ValorChance chance={chance} tamanho="text-[10px]" />
      </span>
      <div className="h-1.5 bg-superficie-2">
        {chance > 0 && <div className={`h-full ${cor}`} style={{ width: `max(${chance * 100 * progresso}%, 2px)` }} />}
      </div>
    </div>
  )
}
