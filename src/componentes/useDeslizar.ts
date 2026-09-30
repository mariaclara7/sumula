import { useLayoutEffect, useRef } from 'react'

/**
 * Quando a ordem das linhas muda, cada uma desliza da posição antiga para a nova (técnica FLIP).
 * As linhas continuam na ordem certa no HTML; só o movimento é animado.
 * Cada linha precisa do atributo data-deslizar com um id estável.
 */
export function useDeslizar(container: React.RefObject<HTMLElement | null>, ordem: string, duracao = 800) {
  const posicoes = useRef(new Map<string, number>())

  useLayoutEffect(() => {
    const elemento = container.current
    if (!elemento) return
    const reduzido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const novas = new Map<string, number>()

    elemento.querySelectorAll<HTMLElement>('[data-deslizar]').forEach((linha) => {
      const id = linha.dataset.deslizar!
      const topo = linha.offsetTop
      const antes = posicoes.current.get(id)
      novas.set(id, topo)
      if (antes !== undefined && antes !== topo && !reduzido && linha.animate) {
        linha.animate([{ transform: `translateY(${antes - topo}px)` }, { transform: 'translateY(0)' }], {
          duration: duracao,
          easing: 'cubic-bezier(.7,0,.2,1)',
        })
      }
    })

    posicoes.current = novas
  }, [container, ordem, duracao])
}
