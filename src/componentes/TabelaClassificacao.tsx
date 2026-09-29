import { Link } from 'react-router'
import type { LinhaClassificacao } from '../api/tipos'
import { zonaDaPosicao } from '../config'
import { formatarPercentual, formatarSaldo } from '../util/formato'
import { Escudo } from './Escudo'
import { FormaRecente } from './FormaRecente'
import { LegendaZonas } from './LegendaZonas'

type Props = {
  linhas: LinhaClassificacao[]
  /** As faixas de Libertadores/rebaixamento só fazem sentido na tabela geral. */
  mostrarZonas: boolean
}

const cabecalho = 'px-1.5 sm:px-2 py-2 text-center text-xs font-medium text-texto-3'
const celula = 'px-1.5 sm:px-2 py-2 text-center tabular-nums'

export function TabelaClassificacao({ linhas, mostrarZonas }: Props) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-borda [&_abbr]:no-underline">
            <tr>
              <th scope="col" className={`${cabecalho} w-10`}>
                <abbr title="Posição">#</abbr>
              </th>
              <th scope="col" className={`${cabecalho} text-left`}>
                Time
              </th>
              <th scope="col" className={cabecalho}>
                <abbr title="Pontos">P</abbr>
              </th>
              <th scope="col" className={cabecalho}>
                <abbr title="Jogos">J</abbr>
              </th>
              <th scope="col" className={cabecalho}>
                <abbr title="Vitórias">V</abbr>
              </th>
              <th scope="col" className={`${cabecalho} hidden sm:table-cell`}>
                <abbr title="Empates">E</abbr>
              </th>
              <th scope="col" className={`${cabecalho} hidden sm:table-cell`}>
                <abbr title="Derrotas">D</abbr>
              </th>
              <th scope="col" className={`${cabecalho} hidden md:table-cell`}>
                <abbr title="Gols pró">GP</abbr>
              </th>
              <th scope="col" className={`${cabecalho} hidden md:table-cell`}>
                <abbr title="Gols contra">GC</abbr>
              </th>
              <th scope="col" className={cabecalho}>
                <abbr title="Saldo de gols">SG</abbr>
              </th>
              <th scope="col" className={`${cabecalho} hidden md:table-cell`}>
                <abbr title="Aproveitamento">%</abbr>
              </th>
              <th scope="col" className={`${cabecalho} hidden lg:table-cell`}>
                Últimos 5
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borda">
            {linhas.map((linha) => {
              const zona = mostrarZonas ? zonaDaPosicao(linha.posicao) : undefined
              return (
                <tr key={linha.time.id} className="hover:bg-superficie-2">
                  <td className="relative px-2 py-2 text-center font-medium tabular-nums">
                    {zona && (
                      <span className={`absolute inset-y-1 left-0 w-1 rounded-r ${zona.cor}`} title={zona.nome} />
                    )}
                    {linha.posicao}
                  </td>
                  <td className="px-2 py-2">
                    <Link to={`/times/${linha.time.id}`} className="flex items-center gap-2 font-medium hover:underline">
                      <Escudo time={linha.time} />
                      <span className="max-w-[7.5rem] truncate sm:max-w-none">{linha.time.nomeCurto}</span>
                    </Link>
                  </td>
                  <td className={`${celula} font-bold`}>{linha.pontos}</td>
                  <td className={celula}>{linha.jogos}</td>
                  <td className={celula}>{linha.vitorias}</td>
                  <td className={`${celula} hidden sm:table-cell`}>{linha.empates}</td>
                  <td className={`${celula} hidden sm:table-cell`}>{linha.derrotas}</td>
                  <td className={`${celula} hidden md:table-cell`}>{linha.golsPro}</td>
                  <td className={`${celula} hidden md:table-cell`}>{linha.golsContra}</td>
                  <td className={celula}>{formatarSaldo(linha.saldo)}</td>
                  <td className={`${celula} hidden md:table-cell`}>{formatarPercentual(linha.aproveitamento)}</td>
                  <td className="hidden px-2 py-2 lg:table-cell">
                    <div className="flex justify-center">
                      <FormaRecente resultados={linha.ultimosResultados} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {mostrarZonas && <LegendaZonas />}
    </div>
  )
}
