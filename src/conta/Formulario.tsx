import { useState, type ReactNode } from 'react'
import { classeCampo } from './estilos'

// Peças dos formulários de conta: entrar, criar conta, nova senha e minha conta.

/** Rótulo em mono maiúsculo em cima do campo e, se houver, o erro daquele campo embaixo. */
export function Campo({
  rotulo,
  id,
  erro,
  ajuda,
  extra,
  children,
}: {
  rotulo: string
  id: string
  erro?: string | null
  ajuda?: string
  extra?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-mono text-[11px] font-extrabold tracking-[1.5px] uppercase">
          {rotulo}
        </label>
        {extra}
      </div>
      {children}
      {erro ? (
        <span id={`${id}-erro`} className="text-[13px] font-semibold text-vermelho">
          {erro}
        </span>
      ) : (
        ajuda && <span className="text-xs text-texto-2">{ajuda}</span>
      )}
    </div>
  )
}

export function CampoSenha({
  id,
  valor,
  aoMudar,
  autoComplete,
  erro,
  placeholder,
}: {
  id: string
  valor: string
  aoMudar: (valor: string) => void
  autoComplete: 'current-password' | 'new-password'
  erro?: string | null
  placeholder?: string
}) {
  const [visivel, setVisivel] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={visivel ? 'text' : 'password'}
        autoComplete={autoComplete}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => aoMudar(e.target.value)}
        aria-invalid={erro ? true : undefined}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={`${classeCampo(Boolean(erro))} pr-[78px]`}
      />
      <button
        type="button"
        onClick={() => setVisivel((v) => !v)}
        aria-pressed={visivel}
        aria-label={visivel ? 'Ocultar a senha' : 'Mostrar a senha'}
        className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer px-2 py-1 font-mono text-[11px] font-extrabold text-texto-2 hover:text-texto"
      >
        {visivel ? 'OCULTAR' : 'MOSTRAR'}
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
      className="h-[54px] w-full cursor-pointer border-2 border-texto bg-lima px-[18px] text-base font-black text-grafite shadow-[4px_4px_0_var(--texto)] transition-[transform,box-shadow] duration-75 active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-60"
    >
      {children}
    </button>
  )
}

/** Erro (fundo vermelho claro) ou aviso de sucesso (faixa escura com ✓ lima, como no mockup). */
export function Aviso({ tipo, children }: { tipo: 'erro' | 'ok'; children: ReactNode }) {
  if (tipo === 'ok') {
    return (
      <p role="status" className="flex items-center gap-2.5 bg-grafite px-3.5 py-3 text-sm font-semibold text-creme">
        <span aria-hidden className="grid size-5 flex-none place-items-center bg-lima text-xs font-black text-grafite">
          ✓
        </span>
        {children}
      </p>
    )
  }
  return (
    <p role="alert" className="border-l-4 border-vermelho bg-vermelho/10 px-3 py-2.5 text-sm font-semibold text-texto">
      {children}
    </p>
  )
}
