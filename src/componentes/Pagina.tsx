type Props = { children: React.ReactNode; className?: string }

/** Largura e margens laterais do conteúdo: 18px no celular, 48px a partir do tablet. */
export function Pagina({ children, className = '' }: Props) {
  return <div className={`mx-auto w-full max-w-[1400px] px-[18px] md:px-12 ${className}`}>{children}</div>
}
