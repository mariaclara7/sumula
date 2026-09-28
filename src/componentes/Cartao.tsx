type Props = { titulo?: string; children: React.ReactNode; className?: string }

export function Cartao({ titulo, children, className = '' }: Props) {
  return (
    <section className={`rounded-xl border border-borda bg-superficie ${className}`}>
      {titulo && <h2 className="border-b border-borda px-4 py-3 text-sm font-semibold">{titulo}</h2>}
      {children}
    </section>
  )
}
