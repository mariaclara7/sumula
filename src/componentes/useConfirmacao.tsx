import { useCallback, useRef, useState, type ReactNode } from 'react'
import { Confirmacao } from './Confirmacao'

export type Pedido = {
  titulo: string
  texto: ReactNode
  /** Texto do botão que confirma, ex.: "Apagar palpites". */
  confirmar: string
  /** Ação que apaga ou substitui algo: botão vermelho. */
  perigo?: boolean
}

/**
 * Janela de confirmação no visual do site, no lugar do window.confirm.
 * Uso: `const [confirmar, janela] = useConfirmacao()`, põe `{janela}` na página e
 * `if (await confirmar({ ... })) ...`.
 */
export function useConfirmacao() {
  const [pedido, setPedido] = useState<Pedido | null>(null)
  const resposta = useRef<(sim: boolean) => void>(undefined)

  const confirmar = useCallback(
    (novo: Pedido) =>
      new Promise<boolean>((resolver) => {
        resposta.current?.(false)
        resposta.current = resolver
        setPedido(novo)
      }),
    [],
  )

  const responder = useCallback((sim: boolean) => {
    resposta.current?.(sim)
    resposta.current = undefined
    setPedido(null)
  }, [])

  const janela = pedido ? <Confirmacao pedido={pedido} aoResponder={responder} /> : null
  return [confirmar, janela] as const
}

