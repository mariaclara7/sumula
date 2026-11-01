import { useState, type ReactNode } from 'react'
import { CAMPO } from './estilos'

// Peças dos formulários de conta: entrar, criar conta, nova senha e minha conta.

export function Campo({
  rotulo,
  id,
  ajuda,
  extra,
  children,
}: {
  rotulo: string
  id: string
  ajuda?: string
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold">
          {rotulo}
        </label>
        {extra}
      </div>
      {children}
      {ajuda && <p className="mt-1 text-xs text-texto-2">{ajuda}</p>}
    </div>
  )
}

export function CampoSenha({
  id,
  valor,
  aoMudar,
  autoComplete,
}: {
  id: string
  valor: string
  aoMudar: (valor: string) => void
  autoComplete: 'current-password' | 'new-password'
}) {
  const [visivel, setVisivel] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={visivel ? 'text' : 'password'}
        required
        autoComplete={autoComplete}
        value={valor}
        onChange={(e) => aoMudar(e.target.value)}
        className={`${CAMPO} pr-20`}
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-pressed={visivel}
        aria-controls={id}
        className="absolute top-1/2 right-2 mt-[3px] -translate-y-1/2 cursor-pointer px-2 py-1 font-mono text-[11px] font-extrabold text-texto-2 hover:text-texto"
      >
        {visivel ? 'ESCONDER' : 'MOSTRAR'}
      </button>
    </div>
  )
}

export function BotaoEnviar({
  enviando,
  desabilitado = false,
  children,
}: {
  enviando: boolean
  desabilitado?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="submit"
      disabled={enviando || desabilitado}
      className="mt-5 w-full cursor-pointer border-2 border-texto bg-lima px-[18px] py-3 text-[15px] font-extrabold text-grafite shadow-[4px_4px_0_var(--texto)] transition-[transform,box-shadow] duration-75 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  )
}

export function Aviso({ tipo, children }: { tipo: 'erro' | 'ok'; children: ReactNode }) {
  return (
    <p
      role={tipo === 'erro' ? 'alert' : 'status'}
      className={`mt-4 border-l-4 px-3 py-2 text-sm font-semibold ${
        tipo === 'erro' ? 'border-vermelho bg-vermelho/10 text-texto' : 'border-verde bg-verde/10 text-texto'
      }`}
    >
      {children}
    </p>
  )
}
