type Props = { children: React.ReactNode; className?: string }

/** Título grande em caixa alta, igual em todas as páginas. */
export function TituloPagina({ children, className = '' }: Props) {
  return (
    <h1
      className={`m-0 text-[clamp(32px,11vw,48px)] leading-[.85] break-words font-black tracking-[-2px] uppercase md:text-[96px] md:tracking-[-4px] ${className}`}
    >
      {children}
    </h1>
  )
}

/** Rótulo pequeno em fonte mono e caixa alta (ex.: "CAIXA DE ENTRADA"). */
export function Rotulo({ children, className = 'text-texto-2' }: Props) {
  return <div className={`font-mono text-xs font-extrabold tracking-[2px] ${className}`}>{children}</div>
}
