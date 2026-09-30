import { useMemo } from 'react'

const CORES = ['#c6f432', '#ffffff', '#2f6bff', '#e5484d']
const PECAS = 44

/** Números entre 0 e 1 a partir de uma semente (gerador congruencial linear). */
function sorteador(semente: number) {
  let estado = (semente * 2654435761) >>> 0
  return () => {
    estado = (Math.imul(estado, 1664525) + 1013904223) >>> 0
    return estado / 4294967296
  }
}

/**
 * Chuva de confete sobre o elemento pai (que precisa de position: relative e overflow: hidden).
 * Cada valor novo de `disparo` solta uma nova rajada; 0 não solta nada.
 */
export function Confete({ disparo }: { disparo: number }) {
  // Sorteio com semente: cada disparo tem uma rajada diferente, mas a mesma a cada renderização.
  const pecas = useMemo(() => {
    const sortear = sorteador(disparo)
    return Array.from({ length: PECAS }, (_, i) => ({
      esquerda: sortear() * 100,
      desvio: (sortear() - 0.5) * 120,
      duracao: 1.6 + sortear() * 1.4,
      atraso: sortear() * 0.5,
      cor: CORES[i % CORES.length],
    }))
  }, [disparo])

  if (disparo === 0) return null

  return (
    <div key={disparo} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
      {pecas.map((peca, i) => (
        <span
          key={i}
          className="absolute top-0 h-[11px] w-1.5 opacity-0"
          style={
            {
              left: `${peca.esquerda}%`,
              background: peca.cor,
              '--dx': `${peca.desvio}px`,
              animation: `confete ${peca.duracao}s ${peca.atraso}s cubic-bezier(.2,.6,.4,1) forwards`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  )
}
