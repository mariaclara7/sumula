import { zonaDaPosicao } from '../config'
import { formatarChance } from '../util/formato'
import { LegendaZonas } from './LegendaZonas'

type Props = {
  /** Chance de terminar em cada posição; índice 0 = 1º lugar. */
  posicoes: number[]
  nomeTime: string
  /** 0 a 1: as colunas crescem junto com a animação da página. */
  progresso?: number
}

const ALTURA_MAXIMA = 130

/** Colunas com a chance de terminar em cada posição, coloridas pela zona da tabela. */
export function GraficoPosicoesFinais({ posicoes, nomeTime, progresso = 1 }: Props) {
  const maior = Math.max(...posicoes, 0.0001)
  const maisProvavel = posicoes.indexOf(Math.max(...posicoes))

  return (
    <div>
      <div
        role="img"
        aria-label={`Chance de o ${nomeTime} terminar em cada posição. Mais provável: ${maisProvavel + 1}º lugar, ${formatarChance(posicoes[maisProvavel])}.`}
      >
        <div
          className="grid h-[170px] items-end gap-0.5 border-b-2 border-texto md:gap-1.5"
          style={{ gridTemplateColumns: `repeat(${posicoes.length}, minmax(0, 1fr))` }}
        >
          {posicoes.map((chance, indice) => {
            const zona = zonaDaPosicao(indice + 1)
            return (
              <div
                key={indice}
                title={`${indice + 1}º lugar: ${formatarChance(chance)}`}
                className="flex h-full flex-col items-center justify-end gap-1"
              >
                <span className="font-mono text-[10px] font-extrabold">
                  {indice === maisProvavel ? formatarChance(chance) : ''}
                </span>
                <div
                  className={`w-full ${zona?.cor ?? 'bg-texto-3'}`}
                  style={{ height: Math.round((chance / maior) * ALTURA_MAXIMA * progresso) }}
                />
              </div>
            )
          })}
        </div>
        <div
          aria-hidden
          className="mt-1.5 grid gap-0.5 md:gap-1.5"
          style={{ gridTemplateColumns: `repeat(${posicoes.length}, minmax(0, 1fr))` }}
        >
          {posicoes.map((_, indice) => (
            <span key={indice} className="text-center font-mono text-[8px] font-medium text-texto-2 md:text-[11px]">
              {indice + 1}º
            </span>
          ))}
        </div>
      </div>

      <LegendaZonas className="mt-3" />

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-texto-2">Ver dados em tabela</summary>
        <div className="max-h-64 overflow-y-auto">
          <table className="mt-2 w-full text-center tabular-nums">
            <thead className="text-xs text-texto-3">
              <tr>
                <th className="py-1 font-medium">Posição final</th>
                <th className="py-1 font-medium">Chance</th>
              </tr>
            </thead>
            <tbody>
              {posicoes.map((chance, indice) => (
                <tr key={indice}>
                  <td className="py-0.5">{indice + 1}º</td>
                  <td className="py-0.5">{formatarChance(chance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
