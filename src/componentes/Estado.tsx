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
      <div className="mx-auto mb-3 size-7 animate-spin border-[3px] border-borda border-t-lima" />
      <span className="font-mono text-xs font-extrabold tracking-[2px] uppercase">
        {demorando ? 'Acordando o servidor, isso pode levar até 30 segundos…' : 'Carregando…'}
      </span>
    </div>
  )
}

export function Erro({ tentarDeNovo }: { tentarDeNovo?: () => void }) {
  return (
    <div role="alert" className="py-16 text-center text-texto-2">
      <p className="mb-4 font-bold text-texto">Não foi possível carregar os dados.</p>
      {tentarDeNovo && <BotaoPrincipal onClick={tentarDeNovo}>Tentar de novo</BotaoPrincipal>}
    </div>
  )
}

export function Vazio({ children }: { children: React.ReactNode }) {
  return <p className="py-16 text-center text-texto-2">{children}</p>
}

/** Botão lima com sombra dura, que "afunda" ao clicar. */
export function BotaoPrincipal({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer border-2 border-texto bg-lima px-[18px] py-3 text-sm font-extrabold text-grafite shadow-[4px_4px_0_var(--texto)] transition-[transform,box-shadow] duration-75 active:translate-x-1 active:translate-y-1 active:shadow-none ${className}`}
    >
      {children}
    </button>
  )
}
