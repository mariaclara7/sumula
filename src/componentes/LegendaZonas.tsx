import { ZONAS } from '../config'

export function LegendaZonas({ className = 'mt-[18px]' }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-x-[22px] gap-y-2.5 text-[13px] font-semibold text-texto-2 ${className}`}>
      {ZONAS.map((zona) => (
        <li key={zona.nome} className="flex items-center gap-2">
          <span className={`inline-block size-2.5 ${zona.cor}`} />
          {zona.nome}
        </li>
      ))}
    </ul>
  )
}
