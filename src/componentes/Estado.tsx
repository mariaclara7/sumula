import { useEffect, useState } from 'react'

export function Carregando() {
  // No plano gratuito do Render a API "dorme"; a primeira resposta pode demorar.
  const [demorando, setDemorando] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDemorando(true), 4000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div role="status" className="py-16 text-center text-texto-2">
      <div className="mx-auto mb-3 size-6 animate-spin rounded-full border-2 border-borda border-t-destaque" />
      {demorando ? 'Acordando o servidor, isso pode levar até 30 segundos…' : 'Carregando…'}
    </div>
  )
}

export function Erro({ tentarDeNovo }: { tentarDeNovo?: () => void }) {
  return (
    <div role="alert" className="py-16 text-center text-texto-2">
      <p className="mb-3">Não foi possível carregar os dados.</p>
      {tentarDeNovo && (
        <button
          type="button"
          onClick={tentarDeNovo}
          className="rounded-md border border-borda bg-superficie px-3 py-1.5 text-sm font-medium text-texto hover:bg-superficie-2"
        >
          Tentar de novo
        </button>
      )}
    </div>
  )
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="py-16 text-center text-texto-2">{children}</p>
}
