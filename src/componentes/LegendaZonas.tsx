import { ZONAS } from '../config'

export function LegendaZonas() {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 border-t border-borda px-4 py-3 text-xs text-texto-2">
      {ZONAS.map((zona) => (
        <li key={zona.nome} className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-1 rounded ${zona.cor}`} />
          {zona.nome}
        </li>
      ))}
    </ul>
  )
}
