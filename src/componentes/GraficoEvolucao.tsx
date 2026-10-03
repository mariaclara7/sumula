import { useEffect, useRef, useState } from 'react'
import type { PontoEvolucao } from '../api/tipos'
import { TabelaDados, Variacao } from './TabelaDados'

type Props = {
  pontos: PontoEvolucao[]
  quantidadeTimes: number
  nomeTime: string
  /** 0 a 1: a linha se desenha rodada a rodada junto com a animação da página. */
  progresso?: number
}

const ALTURA = 260
const MARGEM = { topo: 14, direita: 50, base: 30, esquerda: 44 }

/** Posição do time ao fim de cada rodada. O 1º lugar fica no topo. */
export function GraficoEvolucao({ pontos, quantidadeTimes, nomeTime, progresso = 1 }: Props) {
  const container = useRef<HTMLDivElement>(null)
  const [largura, setLargura] = useState(0)
  const [ativo, setAtivo] = useState<PontoEvolucao | null>(null)

  useEffect(() => {
    const elemento = container.current
    if (!elemento) return
    const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width))
    observador.observe(elemento)
    return () => observador.disconnect()
  }, [])

  if (pontos.length === 0) {
    return <p className="px-4 py-6 text-sm text-texto-2">O gráfico aparece depois da primeira rodada.</p>
  }

  const ultimaRodada = pontos[pontos.length - 1].rodada
  const areaLargura = Math.max(largura - MARGEM.esquerda - MARGEM.direita, 1)
  const areaAltura = ALTURA - MARGEM.topo - MARGEM.base

  const x = (rodada: number) => MARGEM.esquerda + (ultimaRodada === 1 ? 0 : ((rodada - 1) / (ultimaRodada - 1)) * areaLargura)
  const y = (posicao: number) => MARGEM.topo + ((posicao - 1) / Math.max(quantidadeTimes - 1, 1)) * areaAltura

  const linhasGrade = [1, 5, 10, 15, 20].filter((p) => p <= quantidadeTimes)
  const passoRodadas = ultimaRodada > 20 ? 5 : ultimaRodada > 10 ? 2 : 1
  const rodadasEixo = pontos.map((p) => p.rodada).filter((r) => r === 1 || r % passoRodadas === 0)
  const limite = Math.max(1, Math.ceil(progresso * ultimaRodada))
  const visiveis = pontos.filter((p) => p.rodada <= limite)
  const caminho = visiveis.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.rodada)},${y(p.posicao)}`).join(' ')
  const ultimo = pontos[pontos.length - 1]
  const destaque = ativo ?? visiveis[visiveis.length - 1]

  function aoMover(evento: React.PointerEvent<SVGRectElement>) {
    const caixa = evento.currentTarget.getBoundingClientRect()
    const proporcao = (evento.clientX - caixa.left) / caixa.width
    const rodada = Math.round(1 + proporcao * (ultimaRodada - 1))
    setAtivo(pontos.find((p) => p.rodada === rodada) ?? null)
  }

  const larguraDica = 150
  const dicaX = Math.min(Math.max(x(destaque.rodada) - larguraDica / 2, 0), largura - larguraDica)

  return (
    <div>
      <div ref={container} className="relative px-2 pt-2">
        {largura > 0 && (
          <svg
            width={largura}
            height={ALTURA}
            role="img"
            aria-label={`Posição do ${nomeTime} rodada a rodada. Após a rodada ${ultimo.rodada}: ${ultimo.posicao}º lugar.`}
            className="block"
          >
            {linhasGrade.map((posicao) => (
              <g key={posicao}>
                <line x1={MARGEM.esquerda} x2={largura - MARGEM.direita} y1={y(posicao)} y2={y(posicao)} className="stroke-borda" strokeWidth={1} />
                <text x={MARGEM.esquerda - 8} y={y(posicao)} dy="0.32em" textAnchor="end" className="fill-texto-3 font-mono text-xs">
                  {posicao}º
                </text>
              </g>
            ))}

            {rodadasEixo.map((rodada) => (
              <text key={rodada} x={x(rodada)} y={ALTURA - 8} textAnchor="middle" className="fill-texto-3 font-mono text-xs">
                {rodada}
              </text>
            ))}

            {ativo && (
              <line x1={x(ativo.rodada)} x2={x(ativo.rodada)} y1={MARGEM.topo} y2={MARGEM.topo + areaAltura} className="stroke-texto-3" strokeWidth={1} />
            )}

            <path d={caminho} fill="none" className="stroke-texto" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />

            <circle cx={x(destaque.rodada)} cy={y(destaque.posicao)} r={5} className="fill-texto stroke-superficie" strokeWidth={2} />

            {!ativo && progresso >= 1 && (
              <text x={x(ultimo.rodada) + 10} y={y(ultimo.posicao)} dy="0.32em" className="fill-texto font-mono text-xs font-extrabold">
                {ultimo.posicao}º
              </text>
            )}

            <rect
              x={MARGEM.esquerda}
              y={0}
              width={areaLargura}
              height={ALTURA}
              fill="transparent"
              onPointerMove={aoMover}
              onPointerLeave={() => setAtivo(null)}
            />
          </svg>
        )}

        {ativo && (
          <div
            className="pointer-events-none absolute top-0 border-2 border-texto bg-superficie px-2.5 py-1.5 text-xs whitespace-nowrap shadow-[4px_4px_0_#c6f432]"
            style={{ left: dicaX + 8, width: larguraDica }}
          >
            <div className="font-mono font-extrabold text-texto-2">RODADA {ativo.rodada}</div>
            <div className="font-black tabular-nums text-texto">
              {ativo.posicao}º lugar · {ativo.pontos} pts
            </div>
          </div>
        )}
      </div>

      <TabelaDados
        className="mx-4"
        cabecalho={
          <>
            <th scope="col">RODADA</th>
            <th scope="col">POSIÇÃO</th>
            <th scope="col">
              <abbr title="Variação de posição em relação à rodada anterior" className="no-underline">
                ▲▼
              </abbr>
            </th>
            <th scope="col">PONTOS</th>
            <th scope="col">NA RODADA</th>
          </>
        }
      >
        {pontos.map((p, i) => {
          const anterior = i > 0 ? pontos[i - 1] : undefined
          const ganhos = p.pontos - (anterior?.pontos ?? 0)
          return (
            <tr key={p.rodada}>
              <td className="font-sans font-black">{p.rodada}</td>
              <td className="font-sans text-[15px] font-black">{p.posicao}º</td>
              <td className="text-xs font-extrabold">
                <Variacao valor={anterior ? anterior.posicao - p.posicao : null} />
              </td>
              <td>{p.pontos}</td>
              <td className={ganhos === 3 ? 'font-extrabold text-verde' : ganhos === 0 ? 'text-texto-2' : ''}>
                {ganhos > 0 ? `+${ganhos}` : ganhos}
              </td>
            </tr>
          )
        })}
      </TabelaDados>
    </div>
  )
}
