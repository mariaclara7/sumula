type Props = { titulo?: React.ReactNode; children: React.ReactNode; className?: string }

export function Cartao({ titulo, children, className = '' }: Props) {
  return (
    <section className={`border-2 border-texto bg-superficie ${className}`}>
      {titulo && <h2 className="border-b border-borda px-4 py-3.5 text-lg font-black">{titulo}</h2>}
      {children}
    </section>
  )
}
