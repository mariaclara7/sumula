import { useEffect, useRef } from 'react'
import type { Pedido } from './useConfirmacao'

/** Janela de confirmação no visual do site. Use pelo hook useConfirmacao. */
export function Confirmacao({ pedido, aoResponder }: { pedido: Pedido; aoResponder: (sim: boolean) => void }) {
  const dialogo = useRef<HTMLDialogElement>(null)

  // showModal deixa o resto da página inerte, prende o Tab dentro da janela e fecha com Esc.
  useEffect(() => {
    const atual = dialogo.current
    atual?.showModal()
    return () => atual?.close()
  }, [])

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="confirmacao-titulo"
      aria-describedby="confirmacao-texto"
      onCancel={(evento) => {
        evento.preventDefault()
        aoResponder(false)
      }}
      // Clique no fundo escurecido (fora da caixa) cancela.
      onClick={(evento) => evento.target === evento.currentTarget && aoResponder(false)}
      className="m-auto w-[min(440px,calc(100vw-32px))] border-2 border-texto bg-superficie p-0 text-texto shadow-[6px_6px_0_var(--texto)] backdrop:bg-grafite/60 motion-safe:animate-[entrada_.2s_ease-out]"
    >
      <div className="p-6">
        <h2 id="confirmacao-titulo" className="text-2xl leading-tight font-black tracking-[-0.5px]">
          {pedido.titulo}
        </h2>
        <div id="confirmacao-texto" className="mt-2.5 text-[15px] leading-[1.5] text-texto-2">
          {pedido.texto}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            autoFocus
            onClick={() => aoResponder(false)}
            className="cursor-pointer border-2 border-texto bg-superficie px-[18px] py-3 text-sm font-extrabold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lima"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => aoResponder(true)}
            className={`cursor-pointer border-2 border-texto px-[18px] py-3 text-sm font-extrabold shadow-[4px_4px_0_var(--texto)] transition-[transform,box-shadow] duration-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lima active:translate-x-1 active:translate-y-1 active:shadow-none ${
              pedido.perigo ? 'bg-vermelho text-white' : 'bg-lima text-grafite'
            }`}
          >
            {pedido.confirmar}
          </button>
        </div>
      </div>
    </dialog>
  )
}
