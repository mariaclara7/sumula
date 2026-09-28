import { Link, useParams } from 'react-router'
import { useResumoTime, useTimes } from '../api/consultas'
import type { LinhaClassificacao } from '../api/tipos'
import { Cartao } from '../componentes/Cartao'
import { Escudo } from '../componentes/Escudo'
import { Carregando, Erro, Vazio } from '../componentes/Estado'
import { FormaRecente } from '../componentes/FormaRecente'
import { GraficoEvolucao } from '../componentes/GraficoEvolucao'
import { ListaPartidas } from '../componentes/ListaPartidas'
import { formatarPercentual, formatarSaldo } from '../util/formato'

export function PaginaTime() {
  const timeId = Number(useParams().timeId)
  const resumo = useResumoTime(timeId)
  const times = useTimes()

  if (resumo.isPending || times.isPending) return <Carregando />
  if (resumo.isError || times.isError) {
    return (resumo.error as { status?: number } | null)?.status === 404 ? (
      <Vazio>Time não encontrado nesta competição.</Vazio>
    ) : (
      <Erro tentarDeNovo={() => resumo.refetch()} />
    )
  }

  const { time, geral } = resumo.data
  const recortes: [string, LinhaClassificacao][] = [
    ['Geral', resumo.data.geral],
    ['Em casa', resumo.data.casa],
    ['Fora', resumo.data.fora],
    ['1º turno', resumo.data.primeiroTurno],
    ['2º turno', resumo.data.segundoTurno],
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Escudo time={time} tamanho="g" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{time.nome}</h1>
          <Link to={`/confronto?a=${time.id}`} className="text-sm text-destaque hover:underline">
            Comparar com outro time →
          </Link>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Indicador rotulo="Posição" valor={`${geral.posicao}º`} />
        <Indicador rotulo="Pontos" valor={String(geral.pontos)} />
        <Indicador rotulo="Aproveitamento" valor={formatarPercentual(geral.aproveitamento)} />
        <Indicador rotulo="Saldo de gols" valor={formatarSaldo(geral.saldo)} />
      </dl>

      <Cartao titulo="Posição rodada a rodada">
        <GraficoEvolucao pontos={resumo.data.evolucao} quantidadeTimes={times.data.lista.length} nomeTime={time.nomeCurto} />
      </Cartao>

      <Cartao titulo="Desempenho">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-sm tabular-nums">
            <thead className="border-b border-borda text-xs text-texto-3">
              <tr>
                <th scope="col" className="px-4 py-2 text-left font-medium">Recorte</th>
                <th scope="col" className="px-2 py-2 font-medium">Pontos</th>
                <th scope="col" className="px-2 py-2 font-medium">Jogos</th>
                <th scope="col" className="px-2 py-2 font-medium">V-E-D</th>
                <th scope="col" className="px-2 py-2 font-medium">Gols</th>
                <th scope="col" className="px-2 py-2 font-medium">Aproveitamento</th>
                <th scope="col" className="px-2 py-2 font-medium">Últimos 5</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda text-center">
              {recortes.map(([rotulo, linha]) => (
                <tr key={rotulo}>
                  <th scope="row" className="px-4 py-2 text-left font-medium">{rotulo}</th>
                  <td className="px-2 py-2 font-bold">{linha.pontos}</td>
                  <td className="px-2 py-2">{linha.jogos}</td>
                  <td className="px-2 py-2">{`${linha.vitorias}-${linha.empates}-${linha.derrotas}`}</td>
                  <td className="px-2 py-2">{`${linha.golsPro}:${linha.golsContra}`}</td>
                  <td className="px-2 py-2">{formatarPercentual(linha.aproveitamento)}</td>
                  <td className="px-2 py-2">
                    <div className="flex justify-center">
                      <FormaRecente resultados={linha.ultimosResultados} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Cartao>

      <div className="grid gap-4 md:grid-cols-2">
        <Cartao titulo="Últimos jogos">
          <ListaPartidas partidas={resumo.data.ultimasPartidas} times={times.data.porId} vazio="Nenhum jogo disputado." />
        </Cartao>
        <Cartao titulo="Próximos jogos">
          <ListaPartidas partidas={resumo.data.proximasPartidas} times={times.data.porId} vazio="Nenhum jogo agendado." />
        </Cartao>
      </div>
    </div>
  )
}

function Indicador({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-borda bg-superficie px-4 py-3">
      <dt className="text-xs text-texto-3">{rotulo}</dt>
      <dd className="text-2xl font-semibold tabular-nums">{valor}</dd>
    </div>
  )
}
