import { Link } from 'react-router'
import { useArtilharia, useTimes } from '../api/consultas'
import { Cartao } from '../componentes/Cartao'
import { Escudo } from '../componentes/Escudo'
import { Carregando, Erro, Vazio } from '../componentes/Estado'

const cabecalho = 'px-2 py-2 text-center text-xs font-medium text-texto-3'

export function PaginaArtilharia() {
  const artilharia = useArtilharia()
  const times = useTimes()

  const conteudo = () => {
    if (artilharia.isPending || times.isPending) return <Carregando />
    if (artilharia.isError || times.isError) return <Erro tentarDeNovo={() => artilharia.refetch()} />
    if (artilharia.data.length === 0) return <Vazio>Ainda não há gols registrados.</Vazio>

    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] text-sm tabular-nums">
          <thead className="border-b border-borda">
            <tr>
              <th scope="col" className={`${cabecalho} w-10`}>#</th>
              <th scope="col" className={`${cabecalho} text-left`}>Jogador</th>
              <th scope="col" className={cabecalho}>Gols</th>
              <th scope="col" className={cabecalho}>Assist.</th>
              <th scope="col" className={`${cabecalho} hidden sm:table-cell`}>Pênaltis</th>
              <th scope="col" className={`${cabecalho} hidden sm:table-cell`}>Jogos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borda text-center">
            {artilharia.data.map((artilheiro, indice) => {
              const time = times.data.porId.get(artilheiro.timeId)
              const empatadoComAnterior = indice > 0 && artilharia.data[indice - 1].gols === artilheiro.gols
              return (
                <tr key={artilheiro.jogadorId} className="hover:bg-superficie-2">
                  <td className="px-2 py-2 text-texto-3">{empatadoComAnterior ? '' : indice + 1}</td>
                  <td className="px-2 py-2 text-left">
                    <div className="font-medium">{artilheiro.nome}</div>
                    {time && (
                      <Link to={`/times/${time.id}`} className="flex items-center gap-1.5 text-xs text-texto-2 hover:underline">
                        <Escudo time={time} />
                        {time.nomeCurto}
                      </Link>
                    )}
                  </td>
                  <td className="px-2 py-2 font-bold">{artilheiro.gols}</td>
                  <td className="px-2 py-2">{artilheiro.assistencias ?? '—'}</td>
                  <td className="hidden px-2 py-2 sm:table-cell">{artilheiro.penaltis ?? '—'}</td>
                  <td className="hidden px-2 py-2 sm:table-cell">{artilheiro.jogos ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Artilharia</h1>
      <Cartao>{conteudo()}</Cartao>
    </div>
  )
}
