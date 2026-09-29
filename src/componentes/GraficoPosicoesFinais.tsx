import { useEffect, useRef, useState } from 'react'
import { zonaDaPosicao } from '../config'
import { formatarChance } from '../util/formato'
import { LegendaZonas } from './LegendaZonas'

type Props = {
  /** Chance de terminar em cada posição; índice 0 = 1º lugar. */
  posicoes: number[]
  nomeTime: string
}

const ALTURA = 180
const MARGEM = { topo: 20, direita: 8, base: 24, esquerda: 8 }
const LARGURA_MAXIMA_BARRA = 24
const RAIO = 4

/** Colunas com a chance de terminar em cada posição, coloridas pela zona da tabela. */
export function GraficoPosicoesFinais({ posicoes, nomeTime }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(0)
  const [ativa, setAtiva] = useState<number | null>(null)

  useEffect(() => {
    const elemento = container.current
    if (!elemento) return
    const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width))
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  const maior = Math.max(...posicoes, 0.01)
  const maisProvavel = posicoes.indexOf(Math.max(...posicoes))
  const areaLargura = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 1)
  const areaAltura = ALTURA - MARGEM.topo - MARGEM.base
  const faixa = areaLargura / posicoes.length
  const larguraBarra = Math.min(LARGURA_MAXIMA_BARRA, faixa * 0.7)
  const base = MARGEM.topo + areaAltura

  const centro = (indice: number) => MARGEM.esquerda + faixa * indice + faixa / 2
  const alturaBarra = (chance: number) => (chance / maior) * areaAltura

  // Topo arredondado e base reta, apoiada no eixo.
  function coluna(indice: number, chance: number) {
    const h = alturaBarra(chance)
    const x = centro(indice) - larguraBarra / 2
    const r = Math.min(RAIO, h, larguraBarra / 2)
    return `M${x},${base} V${base - h + r} Q${x},${base - h} ${x + r},${base - h} H${x + larguraBarra - r} Q${x + larguraBarra},${base - h} ${x + larguraBarra},${base - h + r} V${base} Z`
  }

  const rotuloEixo = (indice: number) => posicoes.length <= 12 || faixa >= 18 || indice === 0 || (indice + 1) % 5 === 0

  const larguraDica = 120
  const dicaX = ativa === null ? 0 : Math.min(Math.max(centro(ativa) - larguraDica / 2, 0), largura - larguraDica)

  return (
    <div>
      <div ref={container} className="relative px-2 pt-2">
        {largura > 0 && (
          <svg
            width={largura}
            height={ALTURA}
            role="img"
            aria-label={`Chance de o ${nomeTime} terminar em cada posição. Mais provável: ${maisProvavel + 1}º lugar, ${formatarChance(posicoes[maisProvavel])}.`}
            className="block"
          >
            <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={base} y2={base} className="stroke-borda" strokeWidth={1} />

            {posicoes.map((chance, indice) => {
              const zona = zonaDaPosicao(indice + 1)
              return (
                <g key={indice}>
                  {chance > 0 && (
                    <path
                      d={coluna(indice, chance)}
                      className={zona?.preenchimento ?? 'fill-empate'}
                      opacity={ativa === null || ativa === indice ? 1 : 0.45}
                    />
                  )}
                  {rotuloEixo(indice) && (
                    <text x={centro(indice)} y={ALTURA - 8} textAnchor="middle" className="fill-texto-3 text-[11px] tabular-nums">
                      {indice + 1}º
                    </text>
                  )}
                  <rect
                    x={centro(indice) - faixa / 2}
                    y={0}
                    width={faixa}
                    height={ALTURA}
                    fill="transparent"
                    onPointerEnter={() => setAtiva(indice)}
                    onPointerLeave={() => setAtiva(null)}
                  />
                </g>
              )
            })}

            {ativa === null && (
              <text
                x={centro(maisProvavel)}
                y={base - alturaBarra(posicoes[maisProvavel]) - 6}
                textAnchor="middle"
                className="pointer-events-none fill-texto text-xs font-semibold tabular-nums"
              >
                {formatarChance(posicoes[maisProvavel])}
              </text>
            )}
          </svg>
        )}

        {ativa !== null && (
          <div
            className="pointer-events-none absolute top-0 whitespace-nowrap rounded-md border border-borda bg-superficie px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: dicaX + 8, width: larguraDica }}
          >
            <div className="text-texto-3">{ativa + 1}º lugar</div>
            <div className="font-semibold tabular-nums text-texto">{formatarChance(posicoes[ativa])}</div>
          </div>
        )}
      </div>

      <LegendaZonas />

      <details className="border-t border-borda px-4 py-2 text-sm">
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
