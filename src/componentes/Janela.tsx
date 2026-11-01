import { useEffect, useRef, type ReactNode } from 'react'

/**
 * Janela por cima da página (o <dialog> do navegador: prende o Tab dentro, fecha com Esc), no visual do site.
 * Para "sim ou não" simples, use useConfirmacao; esta é para conteúdo livre.
 */
export function Janela({ rotulo, aoFechar, children }: { rotulo: string; aoFechar: () => void; children: ReactNode }) {
  const dialogo = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const atual = dialogo.current
    atual?.showModal()
    return () => atual?.close()
  }, [])

  return (
    <dialog
      ref={dialogo}
      aria-label={rotulo}
      onCancel={(evento) => {
        evento.preventDefault()
        aoFechar()
      }}
      onClick={(evento) => evento.target === evento.currentTarget && aoFechar()}
      className="m-auto w-[min(460px,calc(100vw-32px))] border-2 border-texto bg-fundo p-0 text-texto shadow-[8px_8px_0_var(--texto)] backdrop:bg-grafite/55 motion-safe:animate-[entrada_.25s_cubic-bezier(.2,.8,.2,1)]"
    >
      <div className="flex flex-col gap-[18px] p-7">{children}</div>
    </dialog>
  )
}
