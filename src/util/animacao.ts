import { useCallback, useEffect, useRef, useState } from 'react'

const DURACAO = 1400

export function movimentoReduzido() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/**
 * Progresso de 0 a 1 (com desaceleração no fim) para números que contam e barras que crescem.
 * Começa quando `pronto` fica verdadeiro (ex.: os dados chegaram) e recomeça com `repetir()`.
 * Com "reduzir movimento" ligado no sistema, já começa em 1.
 */
export function useAnimacao(pronto = true) {
  const [progresso, setProgresso] = useState(() => (movimentoReduzido() ? 1 : 0))
  const [rodada, setRodada] = useState(0)
  const quadro = useRef(0)

  useEffect(() => {
    // Com movimento reduzido o progresso já nasce em 1 e fica assim.
    if (!pronto || movimentoReduzido()) return
    const inicio = performance.now()
    const passo = (agora: number) => {
      const k = Math.min(1, (agora - inicio) / DURACAO)
      setProgresso(1 - Math.pow(1 - k, 3))
      if (k < 1) quadro.current = requestAnimationFrame(passo)
    }
    quadro.current = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(quadro.current)
  }, [pronto, rodada])

  const repetir = useCallback(() => setRodada((r) => r + 1), [])
  return { progresso, repetir, rodada }
}

/** Número inteiro contando até o valor final. */
export function contar(valor: number, progresso: number) {
  return Math.round(valor * progresso)
}
