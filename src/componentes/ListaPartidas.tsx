import { Link } from 'react-router'
import type { Partida, Time } from '../api/tipos'
import { formatarDataPartida } from '../util/formato'
import { Escudo } from './Escudo'

type Props = {
  partidas: Partida[]
  times: Map<number, Time>
  vazio?: string
}

const STATUS: Partial<Record<Partida['status'], string>> = {
  emAndamento: 'Ao vivo',
  adiada: 'Adiada',
  cancelada: 'Cancelada',
}

export function ListaPartidas({ partidas, times, vazio = 'Nenhuma partida.' }: Props) {
  if (partidas.length === 0) return <p className="px-4 py-6 text-sm text-texto-2">{vazio}</p>

  return (
    <ul className="divide-y divide-borda">
      {partidas.map((partida) => {
        const mandante = times.get(partida.mandanteId)
        const visitante = times.get(partida.visitanteId)
        if (!mandante || !visitante) return null

        return (
          <li key={partida.id} className="px-4 py-3">
            <div className="mb-1 flex justify-between text-xs text-texto-3">
              <span>Rodada {partida.rodada}</span>
              <span>{STATUS[partida.status] ?? formatarDataPartida(partida.data)}</span>
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-sm">
              <Link to={`/times/${mandante.id}`} className="flex items-center justify-end gap-2 text-right hover:underline">
                <span className="truncate">{mandante.nomeCurto}</span>
                <Escudo time={mandante} />
              </Link>
              <span className="min-w-14 whitespace-nowrap rounded-md bg-superficie-2 px-2 py-0.5 text-center font-semibold tabular-nums">
                {partida.temResultado ? `${partida.golsMandante} × ${partida.golsVisitante}` : '×'}
              </span>
              <Link to={`/times/${visitante.id}`} className="flex items-center gap-2 hover:underline">
                <Escudo time={visitante} />
                <span className="truncate">{visitante.nomeCurto}</span>
              </Link>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
