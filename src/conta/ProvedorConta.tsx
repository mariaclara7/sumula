import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { ContextoConta, type Usuario } from './conta'
import { carregarAuth } from './firebase'

function paraUsuario(u: User | null): Usuario | null {
  if (!u) return null
  const provedores = u.providerData.map((p) => p.providerId)
  return {
    uid: u.uid,
    nome: u.displayName?.trim() || u.email?.split('@')[0] || 'Torcedor',
    email: u.email ?? '',
    emailConfirmado: u.emailVerified,
    comSenha: provedores.includes('password'),
    comGoogle: provedores.includes('google.com'),
    criadaEm: u.metadata.creationTime ? new Date(u.metadata.creationTime).toISOString() : null,
  }
}

/** Diz para o site inteiro quem está logado. O Firebase é carregado depois da primeira pintura da página. */
export function ProvedorConta({ children }: { children: ReactNode }) {
  const [carregando, setCarregando] = useState(true)
  const [usuario, setUsuario] = useState<Usuario | null>(null)

  useEffect(() => {
    let parar: (() => void) | undefined
    let cancelado = false
    const timer = setTimeout(() => {
      carregarAuth()
        .then(({ auth, onAuthStateChanged }) => {
          if (cancelado) return
          parar = onAuthStateChanged(auth, (u) => {
            setUsuario(paraUsuario(u))
            setCarregando(false)
          })
        })
        .catch(() => setCarregando(false))
    }, 0)
    return () => {
      cancelado = true
      clearTimeout(timer)
      parar?.()
    }
  }, [])

  const atualizar = useCallback(async () => {
    const { auth } = await carregarAuth()
    await auth.currentUser?.reload()
    setUsuario(paraUsuario(auth.currentUser))
  }, [])

  const valor = useMemo(() => ({ carregando, usuario, atualizar }), [carregando, usuario, atualizar])
  return <ContextoConta.Provider value={valor}>{children}</ContextoConta.Provider>
}
