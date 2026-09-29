import { useEffect, useRef, useState } from 'react'
import type { PontoEvolucao, Time } from '../api/tipos'
import { COR_FUNDO, COR_LINHA, COR_PONTO } from './coresSeries'

export type Medida = 'posicao' | 'pontos'

export type SerieTime = {
  time: Time
  /** Vaga fixa do time na seleção; define a cor. */
  vaga: number
  pontos: PontoEvolucao[]
}

type Props = {
  series: SerieTime[]
  medida: Medida
  quantidadeTimes: number
}

const ALTURA = 300
const MARGEM = { topo: 16, direita: 48, base: 28, esquerda: 36 }
/** Rótulos no fim das linhas só enquanto não se atropelam; senão ficam a legenda e a dica. */
const DISTANCIA_MINIMA_ROTULOS = 14
const MAXIMO_ROTULOS_DIRETOS = 4

/** Várias linhas na mesma escala: posição (1º no topo) ou pontos, rodada a rodada. */
export function GraficoComparativo({ series, medida, quantidadeTimes }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(0)
  const [rodadaAtiva, setRodadaAtiva] = useState<number | null>(null)

  useEffect(() => {
    const elemento = container.current
    if (!elemento) return
    const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width))
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  const ultimaRodada = Math.max(0, ...series.flatMap((s) => s.pontos.map((p) => p.rodada)))
  const vazio = series.length === 0 || ultimaRodada === 0

  const valor = (p: PontoEvolucao) => (medida === 'posicao' ? p.posicao : p.pontos)
  const maiorPontos = Math.max(10, ...series.flatMap((s) => s.pontos.map((p) => p.pontos)))
  const topoPontos = Math.ceil(maiorPontos / 10) * 10

  const areaLargura = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 1)
  const areaAltura = ALTURA - MARGEM.topo - MARGEM.base
  const x = (rodada: number) =>
    MARGEM.esquerda + (ultimaRodada === 1 ? 0 : ((rodada - 1) / (ultimaRodada - 1)) * areaLargura)
  const y = (v: number) =>
    medida === 'posicao'
      ? MARGEM.topo + ((v - 1) / Math.max(quantidadeTimes - 1, 1)) * areaAltura
      : MARGEM.topo + (1 - v / topoPontos) * areaAltura

  const grade =
    medida === 'posicao'
      ? [1, 5, 10, 15, 20].filter((p) => p <= quantidadeTimes)
      : Array.from({ length: topoPontos / 10 + 1 }, (_, i) => i * 10).filter((_, i, todos) => todos.length <= 8 || i % 2 === 0)
  const rotuloGrade = (v: number) => (medida === 'posicao' ? `${v}º` : String(v))

  const passo = ultimaRodada > 20 ? 5 : ultimaRodada > 10 ? 2 : 1
  const rodadasEixo = Array.from({ length: ultimaRodada }, (_, i) => i + 1).filter((r) => r === 1 || r % passo === 0)

  // Fim de cada linha, para o ponto final e o rótulo direto.
  const finais = series
    .map((s) => ({ serie: s, ultimo: s.pontos[s.pontos.length - 1] }))
    .filter((f) => f.ultimo)
    .map((f) => ({ ...f, yFinal: y(valor(f.ultimo)) }))
  const ordenadosY = [...finais].sort((a, b) => a.yFinal - b.yFinal)
  const rotulosCabem =
    finais.length <= MAXIMO_ROTULOS_DIRETOS &&
    ordenadosY.every((f, i) => i === 0 || f.yFinal - ordenadosY[i - 1].yFinal >= DISTANCIA_MINIMA_ROTULOS)

  function aoMover(evento: React.PointerEvent<SVGRectElement>) {
    const caixa = evento.currentTarget.getBoundingClientRect()
    const proporcao = (evento.clientX - caixa.left) / caixa.width
    setRodadaAtiva(Math.min(Math.max(Math.round(1 + proporcao * (ultimaRodada - 1)), 1), ultimaRodada))
  }

  const naRodada =
    rodadaAtiva === null
      ? []
      : series
          .map((s) => ({ serie: s, ponto: s.pontos.find((p) => p.rodada === rodadaAtiva) }))
          .filter((item): item is { serie: SerieTime; ponto: PontoEvolucao } => item.ponto !== undefined)
          .sort((a, b) => (medida === 'posicao' ? a.ponto.posicao - b.ponto.posicao : b.ponto.pontos - a.ponto.pontos))

  const larguraDica = 170
  const dicaX =
    rodadaAtiva === null ? 0 : x(rodadaAtiva) + 12 + larguraDica > largura ? x(rodadaAtiva) - 12 - larguraDica : x(rodadaAtiva) + 12

  // Um único container sempre na tela: o ResizeObserver mede este elemento desde o início.
  return (
    <div ref={container} className="relative px-2 pt-2">
      {vazio && <p className="px-2 py-10 text-center text-sm text-texto-2">Escolha times abaixo para comparar.</p>}
      {!vazio && largura > 0 && (
        <svg
          width={largura}
          height={ALTURA}
          role="img"
          aria-label={`${medida === 'posicao' ? 'Posição' : 'Pontos'} rodada a rodada de ${series.map((s) => s.time.nomeCurto).join(', ')}.`}
          className="block"
        >
          {grade.map((v) => (
            <g key={v}>
              <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(v)} y2={y(v)} className="stroke-borda" strokeWidth={1} />
              <text x={MARGEM.esquerda - 8} y={y(v)} dy="0.32em" textAnchor="end" className="fill-texto-3 text-[11px] tabular-nums">
                {rotuloGrade(v)}
              </text>
            </g>
          ))}

          {rodadasEixo.map((rodada) => (
            <text key={rodada} x={x(rodada)} y={ALTURA - 8} textAnchor="middle" className="fill-texto-3 text-[11px] tabular-nums">
              {rodada}
            </text>
          ))}

          {rodadaAtiva !== null && (
            <line
              x1={x(rodadaAtiva)}
              x2={x(rodadaAtiva)}
              y1={MARGEM.topo}
              y2={MARGEM.topo + areaAltura}
              className="stroke-texto-3"
              strokeWidth={1}
            />
          )}

          {series.map((s) => (
            <path
              key={s.time.id}
              d={s.pontos.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.rodada)},${y(valor(p))}`).join(' ')}
              fill="none"
              className={COR_LINHA[s.vaga]}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {(rodadaAtiva === null ? finais.map((f) => ({ serie: f.serie, ponto: f.ultimo })) : naRodada).map(({ serie, ponto }) => (
            <circle
              key={serie.time.id}
              cx={x(ponto.rodada)}
              cy={y(valor(ponto))}
              r={4}
              className={`${COR_PONTO[serie.vaga]} stroke-superficie`}
              strokeWidth={2}
            />
          ))}

          {rodadaAtiva === null &&
            rotulosCabem &&
            finais.map((f) => (
              <text
                key={f.serie.time.id}
                x={x(f.ultimo.rodada) + 9}
                y={f.yFinal}
                dy="0.32em"
                className="fill-texto text-[11px] font-semibold"
              >
                {f.serie.time.sigla}
              </text>
            ))}

          <rect
            x={MARGEM.esquerda}
            y={0}
            width={areaLargura}
            height={ALTURA}
            fill="transparent"
            onPointerMove={aoMover}
            onPointerLeave={() => setRodadaAtiva(null)}
          />
        </svg>
      )}

      {!vazio && rodadaAtiva !== null && naRodada.length > 0 && (
        <div
          className="pointer-events-none absolute top-2 rounded-md border border-borda bg-superficie px-2.5 py-1.5 text-xs shadow-md"
          style={{ left: dicaX + 8, width: larguraDica }}
        >
          <div className="mb-1 text-texto-3">Rodada {rodadaAtiva}</div>
          <ul className="space-y-0.5">
            {naRodada.map(({ serie, ponto }) => (
              <li key={serie.time.id} className="flex items-center gap-1.5 text-texto">
                <span className={`inline-block size-2 shrink-0 rounded-full ${COR_FUNDO[serie.vaga]}`} />
                <span className="truncate">{serie.time.nomeCurto}</span>
                <span className="ml-auto font-semibold tabular-nums">
                  {medida === 'posicao' ? `${ponto.posicao}º` : `${ponto.pontos} pts`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
