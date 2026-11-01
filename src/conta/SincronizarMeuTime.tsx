import { useEffect, useRef } from 'react'
import { gravarEu, lerEu } from '../api/eu'
import { usePreferencias } from '../preferencias'
import { useConta } from './conta'

/**
 * Time do coração na conta. Ao entrar: se a conta já tem um time, ele vale (em qualquer aparelho); se não tem,
 * a conta fica com o time que estava neste navegador. Depois, cada troca vai para a conta. Sem login, o time
 * continua só no navegador, como sempre.
 */
export function SincronizarMeuTime() {
  const { usuario } = useConta()
  const { meuTime, escolherMeuTime } = usePreferencias()
  const uid = usuario?.uid ?? null
  // Para qual conta já sincronizou e qual valor a conta tem: assim só manda para o servidor o que a pessoa mudou.
  const sincronizado = useRef<{ uid: string; valor: number | null } | null>(null)

  useEffect(() => {
    if (!uid) {
      sincronizado.current = null
      return
    }
    if (sincronizado.current?.uid === uid) return
    let cancelado = false
    lerEu()
      .then(async ({ meuTime: daConta }) => {
        if (cancelado) return
        if (daConta !== null) {
          sincronizado.current = { uid, valor: daConta }
          escolherMeuTime(daConta)
        } else {
          sincronizado.current = { uid, valor: meuTime }
          if (meuTime !== null) await gravarEu({ meuTime })
        }
      })
      .catch(() => {})
    return () => {
      cancelado = true
    }
    // meuTime fica de fora: aqui só interessa o valor no momento em que a pessoa entrou.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  useEffect(() => {
    const atual = sincronizado.current
    if (!uid || !atual || atual.uid !== uid || atual.valor === meuTime) return
    atual.valor = meuTime
    gravarEu({ meuTime }).catch(() => {})
  }, [uid, meuTime])

  return null
}
