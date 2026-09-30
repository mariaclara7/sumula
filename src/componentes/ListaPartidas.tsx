import { Link } from 'react-router'
import type { Palpite, Partida, Time } from '../api/tipos'
import { formatarDataPartida, resultadoPara } from '../util/formato'
import { BarraPalpite } from './BarraPalpite'
import { Escudo } from './Escudo'
import { COR_PLACAR } from './FormaRecente'

type Props = {
  partidas: Partida[]
  times: Map<number, Time>
  vazio?: string
  /** Time cujo resultado pinta o placar (vitória, empate ou derrota). */
  perspectiva?: number
  /** Palpites da Súmula; aparecem embaixo dos jogos que ainda não aconteceram. */
  palpites?: Map<number, Palpite>
}

const STATUS: Partial<Record<Partida['status'], string>> = {
  emAndamento: 'Ao vivo',
  adiada: 'Adiada',
  cancelada: 'Cancelada',
}

export function ListaPartidas({ partidas, times, vazio = 'Nenhuma partida.', perspectiva, palpites }: Props) {
  if (partidas.length === 0) return <p className="border-t border-borda px-4 py-6 text-sm text-texto-2">{vazio}</p>

  return (
    <ul>
      {partidas.map((partida) => {
        const mandante = times.get(partida.mandanteId)
        const visitante = times.get(partida.visitanteId)
        if (!mandante || !visitante) return null
        const resultado = perspectiva === undefined ? undefined : resultadoPara(partida, perspectiva)
        const palpite = partida.temResultado ? undefined : palpites?.get(partida.id)

        return (
          <li key={partida.id} className="border-t border-borda px-4 py-3">
            <div className="flex justify-between text-xs text-texto-2">
              <span>Rodada {partida.rodada}</span>
              <span>{STATUS[partida.status] ?? formatarDataPartida(partida.data)}</span>
            </div>
            <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2.5 text-sm font-bold">
              <Link to={`/times/${mandante.id}`} className="flex items-center justify-end gap-2 text-right hover:text-destaque">
                <span className="truncate">{mandante.nomeCurto}</span>
                <Escudo time={mandante} tamanho={24} />
              </Link>
              <span
                className={`min-w-[60px] px-2 py-1 text-center font-mono text-sm font-extrabold whitespace-nowrap tabular-nums ${
                  resultado ? COR_PLACAR[resultado] : 'bg-superficie-2'
                }`}
              >
                {partida.temResultado ? `${partida.golsMandante} × ${partida.golsVisitante}` : '×'}
              </span>
              <Link to={`/times/${visitante.id}`} className="flex items-center gap-2 hover:text-destaque">
                <Escudo time={visitante} tamanho={24} />
                <span className="truncate">{visitante.nomeCurto}</span>
              </Link>
            </div>
            {palpite && <BarraPalpite palpite={palpite} mandante={mandante} visitante={visitante} />}
          </li>
        )
      })}
    </ul>
  )
}
