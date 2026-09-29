import { useEffect, useRef, useState } from 'react'
import type { FaixasMinuto } from '../api/tipos'

type Props = {
  faixas: FaixasMinuto
  rotulos: string[]
  nomeTime: string
}

const ALTURA = 180
const MARGEM = { topo: 20, direita: 8, base: 24, esquerda: 8 }
const LARGURA_MAXIMA_BARRA = 24
const RAIO = 4
const ESPACO = 2

const SERIES = [
  { chave: 'marcados', rotulo: 'Marcados', classe: 'fill-serie', legenda: 'bg-serie' },
  { chave: 'sofridos', rotulo: 'Sofridos', classe: 'fill-serie-2', legenda: 'bg-serie-2' },
] as const

/** Gols marcados e sofridos em cada faixa de 15 minutos, lado a lado. */
export function GraficoFaixas({ faixas, rotulos, nomeTime }: Props) {
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

  const maior = Math.max(...faixas.marcados, ...faixas.sofridos, 1)
  const areaLargura = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 1)
  const areaAltura = ALTURA - MARGEM.topo - MARGEM.base
  const faixa = areaLargura / rotulos.length
  const larguraBarra = Math.min(LARGURA_MAXIMA_BARRA, (faixa * 0.7 - ESPACO) / 2)
  const base = MARGEM.topo + areaAltura
  const centro = (indice: number) => MARGEM.esquerda + faixa * indice + faixa / 2

  function coluna(x: number, valor: number) {
    const h = (valor / maior) * areaAltura
    const r = Math.min(RAIO, h, larguraBarra / 2)
    return `M${x},${base} V${base - h + r} Q${x},${base - h} ${x + r},${base - h} H${x + larguraBarra - r} Q${x + larguraBarra},${base - h} ${x + larguraBarra},${base - h + r} V${base} Z`
  }

  const larguraDica = 130
  const dicaX = ativa === null ? 0 : Math.min(Math.max(centro(ativa) - larguraDica / 2, 0), largura - larguraDica)

  return (
    <div>
      <ul className="flex gap-4 px-4 pt-3 text-xs text-texto-2">
        {SERIES.map((serie) => (
          <li key={serie.chave} className="flex items-center gap-1.5">
            <span className={`inline-block size-2.5 rounded-sm ${serie.legenda}`} />
            {serie.rotulo}
          </li>
        ))}
      </ul>
      <div ref={container} className="relative px-2 pt-2">
        {largura > 0 && (
          <svg
            width={largura}
            height={ALTURA}
            role="img"
            aria-label={`Gols marcados e sofridos pelo ${nomeTime} em cada faixa de 15 minutos.`}
            className="block"
          >
            <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={base} y2={base} className="stroke-borda" strokeWidth={1} />
            {rotulos.map((rotulo, indice) => (
              <g key={rotulo} opacity={ativa === null || ativa === indice ? 1 : 0.45}>
                {SERIES.map((serie, s) => {
                  const valor = faixas[serie.chave][indice]
                  const x = centro(indice) - larguraBarra - ESPACO / 2 + s * (larguraBarra + ESPACO)
                  return valor > 0 ? <path key={serie.chave} d={coluna(x, valor)} className={serie.classe} /> : null
                })}
                <text x={centro(indice)} y={ALTURA - 8} textAnchor="middle" className="fill-texto-3 text-[11px] tabular-nums">
                  {rotulo}
                </text>
              </g>
            ))}
            {rotulos.map((rotulo, indice) => (
              <rect
                key={rotulo}
                x={centro(indice) - faixa / 2}
                y={0}
                width={faixa}
                height={ALTURA}
                fill="transparent"
                onPointerEnter={() => setAtiva(indice)}
                onPointerLeave={() => setAtiva(null)}
              />
            ))}
          </svg>
        )}

        {ativa !== null && (
          <div
            className="pointer-events-none absolute top-0 whitespace-nowrap rounded-md border border-borda bg-superficie px-2.5 py-1.5 text-xs shadow-md"
            style={{ left: dicaX + 8, width: larguraDica }}
          >
            <div className="text-texto-3">{rotulos[ativa]} min</div>
            {SERIES.map((serie) => (
              <div key={serie.chave} className="flex items-center gap-1.5 tabular-nums text-texto">
                <span className={`inline-block size-2 rounded-sm ${serie.legenda}`} />
                {serie.rotulo}: <span className="font-semibold">{faixas[serie.chave][ativa]}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <details className="border-t border-borda px-4 py-2 text-sm">
        <summary className="cursor-pointer text-texto-2">Ver dados em tabela</summary>
        <table className="mt-2 w-full text-center tabular-nums">
          <thead className="text-xs text-texto-3">
            <tr>
              <th className="py-1 font-medium">Minutos</th>
              <th className="py-1 font-medium">Marcados</th>
              <th className="py-1 font-medium">Sofridos</th>
            </tr>
          </thead>
          <tbody>
            {rotulos.map((rotulo, indice) => (
              <tr key={rotulo}>
                <td className="py-0.5">{rotulo}</td>
                <td className="py-0.5">{faixas.marcados[indice]}</td>
                <td className="py-0.5">{faixas.sofridos[indice]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
