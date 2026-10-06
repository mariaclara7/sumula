import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  /** O que a sigla quer dizer, ex.: "Pontos". */
  dica: string
  children: ReactNode
  /**
   * A sigla está dentro de um botão (cabeçalho que ordena a tabela): não vira um segundo elemento clicável, e o
   * toque mostra o balão por alguns segundos sem impedir o botão de ordenar.
   */
  dentroDeBotao?: boolean
}

/**
 * Sigla com explicação (PTS → "Pontos"). O balão aparece ao passar o mouse, ao focar com o teclado ou ao tocar
 * (no celular não existe "passar o mouse"). Leitores de tela leem a explicação no lugar da sigla.
 */
export function Sigla({ dica, children, dentroDeBotao = false }: Props) {
  // A sigla com o balão aberto (null: fechado).
  const [aberta, setAberta] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (!aberta) return
    const fechar = () => setAberta(null)
    const tocouFora = (evento: PointerEvent) => {
      if (!aberta.contains(evento.target as Node)) fechar()
    }
    const tecla = (evento: KeyboardEvent) => evento.key === 'Escape' && fechar()
    // O balão fica preso na tela (position: fixed): se a página ou a tabela rolar, ele fecha.
    window.addEventListener('scroll', fechar, true)
    window.addEventListener('resize', fechar)
    document.addEventListener('pointerdown', tocouFora)
    document.addEventListener('keydown', tecla)
    const timer = dentroDeBotao ? setTimeout(fechar, 2500) : undefined
    return () => {
      window.removeEventListener('scroll', fechar, true)
      window.removeEventListener('resize', fechar)
      document.removeEventListener('pointerdown', tocouFora)
      document.removeEventListener('keydown', tecla)
      clearTimeout(timer)
    }
  }, [aberta, dentroDeBotao])

  return (
    <>
      <span
        tabIndex={dentroDeBotao ? undefined : 0}
        onPointerEnter={(evento) => evento.pointerType === 'mouse' && setAberta(evento.currentTarget)}
        onPointerLeave={(evento) => evento.pointerType === 'mouse' && setAberta(null)}
        onFocus={(evento) => setAberta(evento.currentTarget)}
        onBlur={() => setAberta(null)}
        onClick={(evento) => setAberta(evento.currentTarget)}
        className="cursor-help underline decoration-texto-3 decoration-dotted underline-offset-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lima"
      >
        <span aria-hidden>{children}</span>
        <span className="sr-only">{dica}</span>
      </span>
      {aberta && createPortal(<Balao alvo={aberta} texto={dica} />, document.body)}
    </>
  )
}

/** O balão, preso na tela embaixo da sigla (ou em cima, se não couber), sem sair pelas laterais. */
function Balao({ alvo, texto }: { alvo: HTMLElement; texto: string }) {
  const balao = useRef<HTMLSpanElement>(null)
  const [posicao, setPosicao] = useState<{ x: number; y: number; seta: number; acima: boolean } | null>(null)

  useLayoutEffect(() => {
    const caixa = alvo.getBoundingClientRect()
    const tamanho = balao.current!.getBoundingClientRect()
    const centro = caixa.left + caixa.width / 2
    const x = Math.min(Math.max(8, centro - tamanho.width / 2), window.innerWidth - tamanho.width - 8)
    const acima = caixa.bottom + 10 + tamanho.height > window.innerHeight - 8
    setPosicao({
      x,
      y: acima ? caixa.top - 10 - tamanho.height : caixa.bottom + 10,
      seta: Math.min(Math.max(10, centro - x), tamanho.width - 10),
      acima,
    })
  }, [alvo])

  return (
    <span
      ref={balao}
      role="tooltip"
      aria-hidden
      className="pointer-events-none fixed z-50 block w-max max-w-[240px] bg-texto px-3 py-2 text-left font-sans text-[13px] leading-snug font-bold tracking-normal text-superficie normal-case shadow-[3px_3px_0_#c6f432]"
      style={{ left: posicao?.x ?? 0, top: posicao?.y ?? 0, visibility: posicao ? 'visible' : 'hidden' }}
    >
      {texto}
      <span
        className={`absolute size-2.5 rotate-45 bg-texto ${posicao?.acima ? '-bottom-1' : '-top-1'}`}
        style={{ left: (posicao?.seta ?? 0) - 5 }}
      />
    </span>
  )
}
